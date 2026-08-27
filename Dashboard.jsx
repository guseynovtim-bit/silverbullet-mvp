// src/components/Dashboard.jsx
import { useMemo } from 'react';
import {
  METRICS_WITH_STATUS,
  METRICS_INFO_ONLY,
  getMetricStatus,
  getColor,
  STATUS_LABELS,
} from '../config/metrics';

export default function Dashboard({ data = {}, aiSummary = {} }) {
  const summary = aiSummary || {};
  const metrics = data?.metrics || {};

  // Метрики со статусом: и те, что сравниваются с планом, и пороговые (problematic_releases)
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

  // Справочные метрики без статуса — просто показываем факт
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
      </header>

      {/* Сводка по ролям — крупные карточки сверху */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="text-sm text-gray-500 font-medium">Для топ‑менеджмента</h3>
          <p className="mt-2 text-lg text-gray-800 line-clamp-3">
            {summary.for_c_level || 'Нажмите «Сформировать отчёт», чтобы получить резюме'}
          </p>
        </div>
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="text-sm text-gray-500 font-medium">Для проектного офиса</h3>
          <p className="mt-2 text-lg text-gray-800 line-clamp-3">
            {summary.for_project_office || 'Нажмите «Сформировать отчёт», чтобы получить резюме'}
          </p>
        </div>
        <div className="p-6 bg-white border rounded-xl shadow-sm">
          <h3 className="text-sm text-gray-500 font-medium">Для команды</h3>
          <p className="mt-2 text-lg text-gray-800 line-clamp-3">
            {summary.for_team || 'Нажмите «Сформировать отчёт», чтобы получить резюме'}
          </p>
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
