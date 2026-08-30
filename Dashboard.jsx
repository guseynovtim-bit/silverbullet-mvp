// src/components/Dashboard.jsx
import { useMemo } from 'react';
import {
  METRICS_WITH_STATUS,
  METRICS_INFO_ONLY,
  getMetricStatus,
  getColor,
  STATUS_LABELS,
  buildSummaryPayload,
} from '../config/metrics';
import { useQuarterSummary } from '../hooks/useQuarterSummary';

const SUMMARY_PLACEHOLDER = 'Нажмите «Сформировать AI-резюме», чтобы получить резюме';

export default function Dashboard({ data = {}, aiSummary: aiSummaryProp = null }) {
  const metrics = data?.metrics || {};

  // Хук ничего не вызывает сам по себе — генерация только по клику (см. handleGenerate).
  // Сам компонент не знает, что за AI стоит за /api/qbr-summary (сейчас — YandexGPT Lite,
  // см. src/server/yandexGptClient.js) — провайдер можно сменить, не трогая Dashboard.
  const { summary: generatedSummary, isLoading, error, generate } = useQuarterSummary();

  // aiSummary-проп (например, уже посчитанный на сервере при первой отдаче страницы)
  // имеет приоритет над тем, что сгенерировано кликом в текущей сессии.
  const summary = aiSummaryProp || generatedSummary || {};

  const handleGenerate = () => {
    generate(buildSummaryPayload(data)).catch(() => {
      // ошибка уже отражена в error из хука — здесь глушим, чтобы не улетало в консоль как unhandled
    });
  };

  const metricItems = useMemo(
    () =>
      METRICS_WITH_STATUS.map((metric) => {
        const entry = metrics[metric.key] || {};
        return {
          ...metric,
          value: entry.value ?? null,
          plan: entry.plan ?? null,
          status: getMetricStatus(metric, entry),
        };
      }),
    [metrics]
  );

  const infoItems = useMemo(
    () =>
      METRICS_INFO_ONLY.map((metric) => ({
        ...metric,
        value: metrics[metric.key]?.value ?? null,
      })),
    [metrics]
  );

  const statusCounts = useMemo(
    () =>
      metricItems.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        { OK: 0, Risk: 0, Attention: 0 }
      ),
    [metricItems]
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QBR Dashboard: итоги квартала</h1>
        <p className="text-gray-600 mt-2">
          Команда: <strong>{data?.team || '—'}</strong> | Квартал: <strong>{data?.quarter || '—'}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {statusCounts.OK} в плане · {statusCounts.Risk} в риске · {statusCounts.Attention} требуют внимания
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Генерируем AI-резюме…' : summary.summary_overall ? 'Обновить AI-резюме' : 'Сформировать AI-резюме'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>

        {summary.summary_overall && <p className="mt-4 text-gray-800 leading-relaxed">{summary.summary_overall}</p>}
      </header>

      {/* Сводка по ролям — крупные карточки сверху.
          Без line-clamp: ответ YandexGPT — это полноценный абзац, а не одна строка,
          обрезка по числу строк съедала почти весь текст. items-start у грида не даёт
          карточкам растягиваться друг под друга по высоте самой длинной. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-start">
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h4 className="text-xs text-gray-500 font-medium">Для топ‑менеджмента</h4>
          <p className="mt-2 text-sm text-gray-800 leading-relaxed">{summary.for_c_level || SUMMARY_PLACEHOLDER}</p>
        </div>
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h4 className="text-xs text-gray-500 font-medium">Для проектного офиса</h4>
          <p className="mt-2 text-sm text-gray-800 leading-relaxed">{summary.for_project_office || SUMMARY_PLACEHOLDER}</p>
        </div>
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h4 className="text-xs text-gray-500 font-medium">Для продуктовой команды</h4>
          <p className="mt-2 text-sm text-gray-800 leading-relaxed">{summary.for_product_team || SUMMARY_PLACEHOLDER}</p>
        </div>
      </div>

      {/* Метрики со статусом (план или порог) */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Метрики</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricItems.map(({ key, label, value, plan, hasPlan, thresholdStatus, status }) => (
            <div key={key} className={`p-4 rounded-lg border ${getColor(status)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs font-semibold uppercase tracking-wide">{STATUS_LABELS[status]}</span>
              </div>
              <p className="mt-2 text-xl font-bold">
                {value ?? '—'}
                {hasPlan && <span className="text-sm font-normal text-gray-500"> / план {plan ?? '—'}</span>}
                {thresholdStatus && (
                  <span className="text-sm font-normal text-gray-500">
                    {' '}
                    (порог: {thresholdStatus.threshold})
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Справочные метрики без плана/статуса */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ресурсы</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infoItems.map(({ key, label, value }) => (
            <div key={key} className="p-4 rounded-lg border border-gray-200 bg-white">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <p className="mt-2 text-xl font-bold text-gray-800">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
