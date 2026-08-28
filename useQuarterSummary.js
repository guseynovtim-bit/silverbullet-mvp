// src/hooks/useQuarterSummary.js
import { useCallback, useRef, useState } from 'react';

/**
 * Дёргает бэкенд-эндпоинт /api/qbr-summary (который уже сам ходит в GigaChat).
 * Ничего не вызывает автоматически — только по explicit generate(payload),
 * плюс в рамках одной сессии компонента не повторяет сетевой запрос для тех
 * же данных подряд (серверный кэш всё равно подстрахует, но незачем даже
 * делать лишний HTTP-запрос).
 */
export function useQuarterSummary() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastKeyRef = useRef(null);

  const generate = useCallback(
    async (payload) => {
      const key = JSON.stringify(payload);
      if (key === lastKeyRef.current && summary) {
        return summary;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/qbr-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: key,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Ошибка запроса: ${res.status}`);
        }

        const data = await res.json();
        setSummary(data);
        lastKeyRef.current = key;
        return data;
      } catch (err) {
        setError(err.message || 'Не удалось получить AI-резюме');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [summary]
  );

  return { summary, isLoading, error, generate };
}
