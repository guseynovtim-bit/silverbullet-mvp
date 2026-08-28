// api/qbr-summary.js
//
// Vercel Serverless Function. Файлы в /api на верхнем уровне проекта Vercel
// разворачивает как отдельные функции автоматически — никакой доп. настройки
// роутинга не требуется, POST /api/qbr-summary с фронтенда попадёт сюда.
//
// Тело запроса Vercel уже парсит в req.body как JS-объект для JSON-запросов,
// вручную JSON.parse делать не нужно.

import { getQuarterSummary, InvalidPayloadError } from '../src/server/qbrSummaryService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await getQuarterSummary(req.body);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof InvalidPayloadError) {
      return res.status(400).json({ error: err.message });
    }
    // eslint-disable-next-line no-console
    console.error('[qbr-summary] YandexGPT request failed:', err);
    return res.status(502).json({ error: 'Не удалось получить AI-резюме от YandexGPT. Попробуйте ещё раз.' });
  }
}
