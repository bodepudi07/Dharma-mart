// This file acts as a secure backend proxy for Gemini API calls.
// It assumes an Express.js server environment where 'express' and '@google/genai' are available.

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// This middleware is for demonstration to simulate a JSON body parser.
// In a real Express app, you would use `app.use(express.json());`
router.use(express.json());

let ai;
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error('CRITICAL: No Gemini API key is configured. Set GEMINI_API_KEY or API_KEY.');
}

// Ethical Hacker Fix: Whitelist allowed models to prevent unauthorized model usage.
const ALLOWED_MODELS = ['gemini-2.5-flash'];

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown-ip';
};

const getRequesterKey = (req) => {
  if (req.requester?.userId) {
    return `user:${req.requester.userId}`;
  }
  if (req.requester?.sessionId) {
    return `session:${req.requester.sessionId}`;
  }
  return `ip:${req.requester?.ip || getClientIp(req)}`;
};

const logAiActivity = async (entry) => {
  try {
    await db.insert('ai_activity_log.json', {
      ...entry,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log AI activity:', error);
  }
};

router.use((req, _res, next) => {
  const sessionId = req.headers['x-ai-session-id'] || req.headers['x-session-id'];
  const roleHeader = req.headers['x-user-role'];
  const authHeader = req.headers.authorization;

  let userId = null;
  let role = typeof roleHeader === 'string' && roleHeader.trim() ? roleHeader.trim() : 'guest';

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.id || decoded?.userId || null;
        role = decoded?.role || role;
      } catch {
        // Ignore invalid tokens for AI usage; AI endpoint remains optional-auth.
      }
    }
  }

  req.requester = {
    userId,
    role,
    sessionId: typeof sessionId === 'string' ? sessionId : null,
    ip: getClientIp(req),
  };

  next();
});

const aiGenerateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => getRequesterKey(req),
  message: { error: 'Too many AI generate requests. Please try again shortly.' },
});

const aiStreamLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => getRequesterKey(req),
  message: { error: 'Too many AI streaming requests. Please wait and try again.' },
});

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }

  return 'Unknown AI service error.';
};

// A generic endpoint for non-streaming content generation
router.post('/generate', aiGenerateLimiter, async (req, res) => {
  if (!ai) {
    return res.status(500).json({ success: false, error: 'AI service is not configured on the server.' });
  }

  const startedAt = Date.now();

  try {
    const { model, contents, config } = req.body;
    
    // Validate model input on the server
    const modelToUse = model || 'gemini-2.5-flash';
    if (!ALLOWED_MODELS.includes(modelToUse)) {
        return res.status(400).json({ success: false, error: 'Invalid or unauthorized model requested.' });
    }

    // FIX: Pass config object directly as systemInstruction is a property of config.
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents,
      config: config,
    });

    // The response from generateContent has a `text` property for the result.
    res.json({ text: response.text });

    await logAiActivity({
      type: 'ai_generate',
      endpoint: '/api/ai/generate',
      model: modelToUse,
      requester: req.requester,
      success: true,
      durationMs: Date.now() - startedAt,
      inputSize: typeof contents === 'string' ? contents.length : JSON.stringify(contents || '').length,
      outputSize: (response.text || '').length,
    });

  } catch (error) {
    console.error('Error in /api/ai/generate:', error);
    await logAiActivity({
      type: 'ai_generate',
      endpoint: '/api/ai/generate',
      model: req.body?.model || 'gemini-2.5-flash',
      requester: req.requester,
      success: false,
      durationMs: Date.now() - startedAt,
      error: getErrorMessage(error),
    });
    res.status(500).json({ success: false, error: getErrorMessage(error) || 'Failed to generate content from AI.' });
  }
});


// An endpoint for streaming content generation
router.post('/stream', aiStreamLimiter, async (req, res) => {
  if (!ai) {
    return res.status(500).json({ success: false, error: 'AI service is not configured on the server.' });
  }

  const startedAt = Date.now();
  let streamOutputSize = 0;

  try {
    const { model, query, history = [], config } = req.body;

    // Validate model input on the server
    const modelToUse = model || 'gemini-2.5-flash';
    if (!ALLOWED_MODELS.includes(modelToUse)) {
      throw new Error('Invalid or unauthorized model requested.');
    }

    if (!query || typeof query !== 'string') {
      throw new Error('A valid query string is required.');
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    
    // --- REFACTOR ---
    // The previous implementation used a Chat object which could lead to state issues.
    // This new, more robust approach uses the stateless `generateContentStream` method,
    // sending the full context in every request as recommended for this type of app.
    const contents = [...history, { role: 'user', parts: [{ text: query }] }];

    // FIX: Pass config object directly as systemInstruction is a property of config.
    const stream = await ai.models.generateContentStream({
        model: modelToUse,
        contents: contents,
        config: config
    });
    // --- END REFACTOR ---

    for await (const chunk of stream) {
      if(chunk.text) {
          streamOutputSize += chunk.text.length;
          res.write(chunk.text);
      }
    }

    res.end();

    await logAiActivity({
      type: 'ai_stream',
      endpoint: '/api/ai/stream',
      model: modelToUse,
      requester: req.requester,
      success: true,
      durationMs: Date.now() - startedAt,
      inputSize: (query || '').length,
      historyCount: Array.isArray(history) ? history.length : 0,
      outputSize: streamOutputSize,
    });

  } catch (error) {
    console.error('Error in /api/ai/stream:', error);
    await logAiActivity({
      type: 'ai_stream',
      endpoint: '/api/ai/stream',
      model: req.body?.model || 'gemini-2.5-flash',
      requester: req.requester,
      success: false,
      durationMs: Date.now() - startedAt,
      error: getErrorMessage(error),
      outputSize: streamOutputSize,
    });
    // If an error occurs after headers are sent, we can't send a JSON error.
    // We just end the response. The client will see a failed request.
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: getErrorMessage(error) || 'Failed to stream content from AI.' });
    } else {
      res.end();
    }
  }
});


export default router;