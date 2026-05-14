// Multi-provider AI Client
// Supports: Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini)
// Reads provider/model from config/settings.json (changeable via admin panel)

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getSetting } = require('./settingsService');
const supabase = require('./supabaseClient');

// Lazy-initialized clients
let anthropicClient = null;
let openaiClient = null;
let geminiClient = null;

const getAnthropicClient = () => {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
};

const getOpenAIClient = () => {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
};

const getGeminiClient = () => {
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return geminiClient;
};

// Get current provider + model from settings file
const getProviderConfig = () => {
  const provider = (getSetting('ai_provider') || 'gemini').toLowerCase();
  const model = getSetting(`ai_model_${provider}`) || 'gemini-2.0-flash';
  const maxTokens = parseInt(getSetting('max_tokens')) || 4000;
  return { provider, model, maxTokens };
};

// Cost per 1M tokens (approximate)
const COST_TABLE = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
};

const estimateCost = (model, inputTokens, outputTokens) => {
  const rates = COST_TABLE[model] || { input: 0.5, output: 2.0 };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
};

// Log usage to Supabase (fire-and-forget, never blocks).
// NOTE: `api_usage` is the per-stage audit/cost log — NOT the quota source.
// Quotas are tracked in `feature_usage` via usageService.incrementUsage.
let warnedMissingApiUsage = false;
const logUsage = (data) => {
  supabase.from('api_usage').insert(data).then(({ error }) => {
    if (!error) return;
    // Table missing — surface the hint once instead of spamming logs.
    if (error.code === '42P01') {
      if (!warnedMissingApiUsage) {
        warnedMissingApiUsage = true;
        console.warn('api_usage table missing — run backend/src/database/admin-schema.sql');
      }
      return;
    }
    console.warn('Usage log failed:', error.message);
  });
};

// Unified call function — same interface for all providers
const callAI = async (systemPrompt, userMessage, maxTokensOverride, meta = {}) => {
  const { provider, model, maxTokens: defaultMaxTokens } = getProviderConfig();
  const tokens = maxTokensOverride || defaultMaxTokens;
  const startTime = Date.now();

  let text = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    switch (provider) {
      case 'anthropic': {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model,
          max_tokens: tokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });
        text = response.content[0].text;
        inputTokens = response.usage?.input_tokens || 0;
        outputTokens = response.usage?.output_tokens || 0;
        break;
      }

      case 'openai': {
        const client = getOpenAIClient();
        // Enable JSON mode only when the prompt actually asks for JSON.
        // OpenAI rejects json_object responses if the word "json" isn't in
        // the messages, which would break plain-text features like cover
        // letters.
        const wantsJson = /json/i.test(systemPrompt) || /json/i.test(userMessage);
        const stream = await client.chat.completions.create({
          model,
          max_tokens: tokens,
          stream: true,
          stream_options: { include_usage: true },
          ...(wantsJson ? { response_format: { type: 'json_object' } } : {}),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        });

        let chunks = '';
        for await (const part of stream) {
          const delta = part.choices?.[0]?.delta?.content;
          if (delta) chunks += delta;
          if (part.usage) {
            inputTokens = part.usage.prompt_tokens || 0;
            outputTokens = part.usage.completion_tokens || 0;
          }
        }
        text = chunks;
        break;
      }

      case 'gemini': {
        const client = getGeminiClient();
        const genModel = client.getGenerativeModel({
          model,
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: tokens },
        });
        const result = await genModel.generateContent(userMessage);
        text = result.response.text();
        const usage = result.response.usageMetadata;
        inputTokens = usage?.promptTokenCount || 0;
        outputTokens = usage?.candidatesTokenCount || 0;
        break;
      }

      default:
        throw new Error(`Unknown AI provider: "${provider}"`);
    }

    // Log successful call
    logUsage({
      user_id: meta.userId || null,
      user_email: meta.userEmail || null,
      feature: meta.feature || 'unknown',
      provider,
      model,
      stage: meta.stage || null,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimateCost(model, inputTokens, outputTokens),
      duration_ms: Date.now() - startTime,
      success: true,
    });

    return text;
  } catch (err) {
    // Log failed call
    logUsage({
      user_id: meta.userId || null,
      user_email: meta.userEmail || null,
      feature: meta.feature || 'unknown',
      provider,
      model,
      stage: meta.stage || null,
      input_tokens: 0,
      output_tokens: 0,
      estimated_cost: 0,
      duration_ms: Date.now() - startTime,
      success: false,
      error_message: err.message?.substring(0, 500),
    });

    // Wrap with user-friendly error message — never expose raw API details to users
    const msg = err.message || '';
    console.error(`AI error (${provider}):`, msg);
    if (msg.includes('401') || msg.includes('authentication') || msg.includes('API key') || msg.includes('credentials') || msg.includes('apiKey'))
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    if (msg.includes('429') || msg.includes('rate') || msg.includes('quota') || msg.includes('Too Many Requests'))
      throw new Error('AI service is busy. Please wait a moment and try again.');
    if (msg.includes('529') || msg.includes('overloaded'))
      throw new Error('AI service is temporarily overloaded. Please retry in a few seconds.');
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('network'))
      throw new Error('Could not reach AI service. Please check your connection and try again.');
    if (msg.includes('billing') || msg.includes('credit'))
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    throw new Error('Something went wrong with the AI analysis. Please try again.');
  }
};

const getCurrentProvider = () => getProviderConfig().provider;

module.exports = { callAI, getCurrentProvider, getProviderConfig, estimateCost, COST_TABLE };
