// src/server/routes/qbrSummary.js
//
// Пример на Express — при другом бэкенде (Next.js API route, Fastify, AWS Lambda)
// логика внутри handler'а переносится один в один, меняется только обвязка роутинга.

import { Router } from 'express';
import { createHash } from 'node:crypto';
import { callYandexGpt } from '../yandexGptClient.js';
import { buildQuarterSummaryPrompt, SUMMARY_SYSTEM_MESSAGE } from '../../config/prompts.js';
import { parseSummaryResponse } from '../parseSummaryResponse.js';

const router = Router();

// Кэш по хэшу входных данных в памяти процесса: одинаковый квартал/команда без
// изменений не пересчитывается повторно — экономит вызовы (и деньги) на
// платный API. На нескольких инстансах сервера вынести в Redis/Memcached
// с тем же ключом.
const summaryCache = new Map();

const hashPayload = (payload) => createHash('sha256').update(JSON.stringify(payload)).digest('hex');

router.post('/api/qbr-summary', async (req, res) => {
  const payload = req.body; // { quarter, team, metrics, notes } — см. buildSummaryPayload на клиенте

  if (!payload || typeof payload !== 'object' || !payload.metrics) {
    return res.status(400).json({ error: 'Некорректное тело запроса: ожидались quarter/team/metrics/notes' });
  }

  const cacheKey = hashPayload(payload);
  const cached = summaryCache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  try {
    const prompt = buildQuarterSummaryPrompt(JSON.stringify(payload));
    const rawContent = await callYandexGpt([
      { role: 'system', content: SUMMARY_SYSTEM_MESSAGE },
      { role: 'user', content: prompt },
    ]);

    const summary = parseSummaryResponse(rawContent);
    summaryCache.set(cacheKey, summary);
    res.json({ ...summary, cached: false });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[qbr-summary] YandexGPT request failed:', err);
    res.status(502).json({ error: 'Не удалось получить AI-резюме от YandexGPT. Попробуйте ещё раз.' });
  }
});

export default router;
