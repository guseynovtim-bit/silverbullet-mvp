// src/server/parseSummaryResponse.js
import { SUMMARY_REQUIRED_KEYS } from '../config/prompts.js';

/**
 * Модели иногда оборачивают JSON в ```json ... ``` несмотря на явную инструкцию
 * не делать этого — подчищаем перед парсингом и жёстко валидируем форму,
 * чтобы на фронте никогда не оказался "почти JSON" или обрезанный ответ.
 */
export function parseSummaryResponse(rawContent) {
  const cleaned = rawContent
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('GigaChat вернул невалидный JSON');
  }

  const missing = SUMMARY_REQUIRED_KEYS.filter((key) => typeof parsed[key] !== 'string' || !parsed[key].trim());
  if (missing.length > 0) {
    throw new Error(`В ответе GigaChat отсутствуют или пусты поля: ${missing.join(', ')}`);
  }

  return {
    summary_overall: parsed.summary_overall,
    for_c_level: parsed.for_c_level,
    for_project_office: parsed.for_project_office,
    for_product_team: parsed.for_product_team,
  };
}
