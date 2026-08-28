// src/server/routes/qbrSummary.js
//
// Express-обвязка над транспорт-агностичным qbrSummaryService.
// Используется, если проект хостится на классическом Node-сервере, а не на
// Vercel serverless. Для Vercel см. /api/qbr-summary.js — та же бизнес-логика,
// другая обвязка req/res.

import { Router } from 'express';
import { getQuarterSummary, InvalidPayloadError } from '../qbrSummaryService.js';

const router = Router();

router.post('/api/qbr-summary', async (req, res) => {
  try {
    const result = await getQuarterSummary(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof InvalidPayloadError) {
      return res.status(400).json({ error: err.message });
    }
    // eslint-disable-next-line no-console
    console.error('[qbr-summary] YandexGPT request failed:', err);
    res.status(502).json({ error: 'Не удалось получить AI-резюме от YandexGPT. Попробуйте ещё раз.' });
  }
});

export default router;
