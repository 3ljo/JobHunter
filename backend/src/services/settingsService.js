// Settings Service
// Reads/writes runtime settings from config/settings.json
// Allows admin to change AI provider, model, limits without restarting

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', '..', 'config', 'settings.json');

const readSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return {
      ai_provider: 'gemini',
      ai_model_anthropic: 'claude-sonnet-4-20250514',
      ai_model_openai: 'gpt-4o-mini',
      ai_model_gemini: 'gemini-2.0-flash',
      max_tokens: 4000,
      rate_limit_cv_per_day: 10,
      rate_limit_cl_per_day: 20,
    };
  }
};

const writeSettings = (settings) => {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
};

const getSetting = (key) => {
  const settings = readSettings();
  return settings[key];
};

const updateSettings = (updates) => {
  const settings = readSettings();
  Object.assign(settings, updates);
  writeSettings(settings);
  return settings;
};

module.exports = { readSettings, writeSettings, getSetting, updateSettings };
