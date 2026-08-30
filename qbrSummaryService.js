// src/server/qbrSummaryService.js
//
// Транспорт-агностичная бизнес-логика генерации AI-резюме квартала.
// Не знает, вызвал ли её Express-роут или Vercel serverless function —
// поэтому обе обвязки (routes/qbrSummary.js и /api/qbr-summary.js) сводятся
// к паре строк маппинга req/res на этот сервис.

import { createHash } from 'node:crypto';
import { callYandexGpt } from './yandexGptClient.js';
import { buildQuarterSummaryPrompt, SUMMARY_SYSTEM_MESSAGE } from '../config/prompts.js';
import { parseSummaryResponse } from './parseSummaryResponse.js';

export class InvalidPayloadError extends Error {}

// Кэш по хэшу входных данных в памяти процесса. На классическом долгоживущем
// сервере это надёжно избавляет от повторных платных вызовов при повторном
// клике с теми же данными. На Vercel serverless функция живёт как "тёплый"
// инстанс ограниченное время и при масштабировании поднимаются параллельные
// копии — так что этот Map работает как первый, бесплатный уровень кэша, но
// не как гарантия дедупликации между холодными стартами/инстансами. Если это
// критично — вынести кэш в Vercel KV или Upstash Redis по тому же cacheKey.
const summaryCache = new Map();

const hashPayload = (payload) => createHash('sha256').update(JSON.stringify(payload)).digest('hex');

/**
 * @param {{quarter?: string, team?: string, metrics: object, notes?: object}} payload
 * @returns {Promise<{summary_overall: string, for_c_level: string, for_project_office: string, for_product_team: string, cached: boolean}>}
 */
export async function getQuarterSummary(payload) {
  if (!payload || typeof payload !== 'object' || !payload.metrics) {
    throw new InvalidPayloadError('Некорректное тело запроса: ожидались quarter/team/metrics/notes');
  }

  const cacheKey = hashPayload(payload);
  const cached = summaryCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const prompt = buildQuarterSummaryPrompt(JSON.stringify(payload));
  const rawContent = await callYandexGpt([
    { role: 'system', content: SUMMARY_SYSTEM_MESSAGE },
    { role: 'user', content: prompt },
  ]);

  const summary = parseSummaryResponse(rawContent);
  summaryCache.set(cacheKey, summary);
  return { ...summary, cached: false };
}
