// Anthropic client configuration
// Creates a single Claude API client instance for AI features

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = anthropic;
