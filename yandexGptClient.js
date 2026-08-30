// src/server/yandexGptClient.js
//
// Серверный клиент к Yandex Cloud AI Studio (Foundation Models Text Generation API).
//
// ВАЖНО: модуль держит секретный API-ключ, поэтому исполняется ТОЛЬКО на сервере
// (Node backend / serverless-функция), никогда не импортируется в клиентский бандл.
// Значения берутся ТОЛЬКО из переменных окружения — никогда не хардкодить ключи
// в исходном коде, они попадают в git-историю навсегда, даже после удаления строки.
//
// Переменные окружения (Vercel: Project Settings → Environment Variables):
//   YANDEX_API_KEY        — статический API-ключ сервисного аккаунта
//   YANDEX_FOLDER_ID       — ID каталога (folder) в Yandex Cloud
//   YANDEX_GPT_MODEL_NAME  — по умолчанию 'yandexgpt-lite'

const COMPLETION_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

/**
 * @param {{role: 'system'|'user'|'assistant', content: string}[]} messages
 * @param {{ temperature?: number, maxTokens?: number }} options
 * @returns {Promise<string>} сырой текстовый ответ модели
 */
export async function callYandexGpt(messages, { temperature = 0.3, maxTokens = 700 } = {}) {
  const apiKey = process.env.YANDEX_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;
  if (!apiKey) throw new Error('YANDEX_API_KEY не задан в переменных окружения');
  if (!folderId) throw new Error('YANDEX_FOLDER_ID не задан в переменных окружения');

  const modelName = process.env.YANDEX_GPT_MODEL_NAME || 'yandexgpt-lite';

  const res = await fetch(COMPLETION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${apiKey}`,
    },
    body: JSON.stringify({
      modelUri: `gpt://${folderId}/${modelName}/latest`,
      completionOptions: {
        stream: false,
        temperature, // низкая — нужен предсказуемый деловой тон, не творческая генерация
        // Yandex API ожидает maxTokens строкой, а не числом — так задокументировано в примерах
        maxTokens: String(maxTokens),
      },
      messages: messages.map(({ role, content }) => ({ role, text: content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YandexGPT completion error ${res.status}: ${text}`);
  }

  const data = await res.json();
  // Форма ответа: { result: { alternatives: [{ message: { role, text }, status }], usage: {...} } }
  const alternative = data.result?.alternatives?.[0];
  if (!alternative) {
    throw new Error('YandexGPT вернул пустой ответ без alternatives');
  }
  return alternative.message?.text ?? '';
}
