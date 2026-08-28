// src/config/metrics.js
//
// Единый источник правды по метрикам QBR.
// Используется и в форме ввода (FormQBR.jsx), и в дашборде (Dashboard.jsx).
// Нужно добавить/убрать метрику, сменить лейбл или логику статуса —
// редактировать только здесь, компоненты подхватят изменения сами.

export const METRICS = [
  {
    key: 'mau',
    label: 'MAU',
    hasPlan: true,
    direction: 'higher', // факт >= план — хорошо
    hint: 'MAU × ARPU ≈ выручка квартала',
    group: 'finance',
  },
  {
    key: 'arpu',
    label: 'ARPU',
    hasPlan: true,
    direction: 'higher',
    group: 'finance',
  },
  {
    key: 'conversion_mau_share',
    label: 'Конверсия (MAU доля)',
    hasPlan: true,
    direction: 'higher',
    group: 'product',
  },
  {
    key: 'churn_rate',
    label: 'Отток',
    hasPlan: true,
    direction: 'lower', // факт <= план — хорошо
    group: 'product',
  },
  {
    key: 'completed_tasks',
    label: 'Выполненные задачи',
    hasPlan: true,
    direction: 'higher',
    group: 'product',
  },
  {
    key: 'team_size',
    label: 'Размер команды',
    hasPlan: false,
    group: 'resources',
  },
  {
    key: 'planned_tasks',
    label: 'Запланировано задач',
    hasPlan: false,
    group: 'resources',
  },
  {
    key: 'problematic_releases',
    label: 'Проблемные релизы',
    hasPlan: false,
    thresholdStatus: { threshold: 2, direction: 'lower' }, // факт <= порога — хорошо
    group: 'resources',
  },
];

// --- Производные выборки для удобства в компонентах ---

// Метрики с парой факт/план — рендерятся в форме как два инпута
export const METRICS_WITH_PLAN = METRICS.filter((m) => m.hasPlan);

// Метрики без плана вообще (форма рендерит их как один инпут)
export const METRICS_NO_PLAN = METRICS.filter((m) => !m.hasPlan);

// Метрики, для которых дашборд должен показывать статус-бейдж
// (либо есть план, либо задан пороговый статус)
export const METRICS_WITH_STATUS = METRICS.filter((m) => m.hasPlan || m.thresholdStatus);

// Чисто информационные метрики — дашборд показывает их без статуса
export const METRICS_INFO_ONLY = METRICS.filter((m) => !m.hasPlan && !m.thresholdStatus);

// --- Статус-логика ---

export const STATUS_LABELS = {
  OK: 'В плане',
  Risk: 'Риск',
  Attention: 'Требует внимания',
};

export const STATUS_STYLES = {
  OK: 'bg-green-100 text-green-800 border-green-200',
  Risk: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Attention: 'bg-red-100 text-red-800 border-red-200',
};

export const getColor = (status) => STATUS_STYLES[status] || 'bg-gray-100 text-gray-800 border-gray-200';

const toNumberOrNaN = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

const getPlanStatus = (value, plan, direction = 'higher') => {
  const v = toNumberOrNaN(value);
  const p = toNumberOrNaN(plan);
  if (Number.isNaN(v) || Number.isNaN(p)) return 'Attention';
  const meetsTarget = direction === 'lower' ? v <= p : v >= p;
  return meetsTarget ? 'OK' : 'Risk';
};

const getThresholdStatus = (value, threshold, direction = 'lower') => {
  const v = toNumberOrNaN(value);
  if (Number.isNaN(v)) return 'Attention';
  const ok = direction === 'lower' ? v <= threshold : v >= threshold;
  return ok ? 'OK' : 'Attention';
};

// Единая точка входа для расчёта статуса произвольной метрики из METRICS.
// metricEntry — { value, plan } из data.metrics[key]
export const getMetricStatus = (metric, metricEntry = {}) => {
  const { value = null, plan = null } = metricEntry;
  if (metric.hasPlan) return getPlanStatus(value, plan, metric.direction);
  if (metric.thresholdStatus) {
    return getThresholdStatus(value, metric.thresholdStatus.threshold, metric.thresholdStatus.direction);
  }
  return null; // информационная метрика без статуса (например, team_size)
};

// Стартовая форма data.metrics для useState в FormQBR
export const buildInitialMetrics = () => {
  const metrics = {};
  METRICS.forEach(({ key }) => {
    metrics[key] = { value: '', plan: '' };
  });
  return metrics;
};

// То, что реально уходит в промпт AI-резюме: только содержательные поля,
// без служебного UI-состояния. Держим в одном месте, чтобы клиент и сервер
// не могли разойтись в том, что именно отправляется (и не гонять лишние
// байты/токены за чужой счёт).
export const buildSummaryPayload = (data = {}) => ({
  quarter: data.quarter ?? null,
  team: data.team ?? null,
  metrics: data.metrics ?? {},
  notes: data.notes ?? {},
});
