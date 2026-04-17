#!/usr/bin/env node
/*
 * One-off helper to list available Gemini/Generative AI models using
 * the @google/generative-ai client. Requires GEMINI_API_KEY in env.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key_here node scripts/list_gemini_models.js
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set. Export it and re-run.');
    process.exit(2);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    if (typeof genAI.listModels === 'function') {
      console.log('Calling client.listModels()...');
      const res = await genAI.listModels();
      const models = (res?.models || res || []).map(m => m.name || m.id || m.model || JSON.stringify(m));
      console.log('Available models (sample):');
      models.slice(0, 100).forEach(m => console.log('-', m));
      return;
    }

    // Fallback: attempt to call the REST list models endpoint directly
    console.log('client.listModels() not available; calling REST API as fallback...');
    const fetch = require('node-fetch');
    const url = 'https://generativelanguage.googleapis.com/v1beta/models';
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`HTTP ${r.status} ${r.statusText}: ${text}`);
    }
    const json = await r.json();
    const models = (json?.models || []).map(m => m.name || JSON.stringify(m));
    console.log('Available models (REST):');
    models.slice(0, 100).forEach(m => console.log('-', m));
  } catch (err) {
    console.error('Failed to list models:', err);
    process.exit(3);
  }
}

main();
