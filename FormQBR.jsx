// src/components/FormQBR.jsx
import { useState } from 'react';
import { METRICS_WITH_PLAN, METRICS_NO_PLAN, buildInitialMetrics } from '../config/metrics';

const NOTE_FIELDS = [
  { key: 'achievements', label: 'Достижения', placeholder: 'Кратко: что сделали важного' },
  { key: 'risks', label: 'Риски', placeholder: 'Что мешает, отставания, зависимости' },
  { key: 'plans', label: 'Планы', placeholder: 'Ключевые задачи на следующий квартал' },
];

export default function FormQBR({ onSubmit, defaultQuarter = 'Q3 2026', defaultTeam = 'Core Product Team' }) {
  const [data, setData] = useState({
    quarter: defaultQuarter,
    team: defaultTeam,
    metrics: buildInitialMetrics(),
    notes: {
      achievements: '',
      risks: '',
      plans: '',
    },
  });

  // Иммутабельное обновление по пути вида 'metrics.mau.value'
  const handleChange = (path, value) => {
    const keys = path.split('.');
    setData((prev) => {
      const clone = structuredClone(prev);
      let obj = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const setTopLevel = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const setNote = (key, value) => {
    setData((prev) => ({ ...prev, notes: { ...prev.notes, [key]: value } }));
  };

  // Приводим числовые поля к Number перед отдачей наружу, пустые строки — к null
  const buildPayload = () => {
    const toNumberOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
    const metrics = {};
    Object.entries(data.metrics).forEach(([key, { value, plan }]) => {
      metrics[key] = {
        value: toNumberOrNull(value),
        plan: toNumberOrNull(plan),
      };
    });
    return { ...data, metrics };
  };

  // Факт по каждой метрике с планом обязателен
  const isValid = () => METRICS_WITH_PLAN.every(({ key }) => data.metrics[key].value !== '');

  const submit = (e) => {
    e.preventDefault();
    if (!isValid()) return;
    onSubmit(buildPayload());
  };

  const renderMetricWithPlan = ({ key, label, hint }) => (
    <div key={key}>
      <label htmlFor={`${key}-value`} className="block text-xs text-gray-500 mb-1">
        {label} (факт / план)
      </label>
      <div className="flex gap-2">
        <input
          id={`${key}-value`}
          type="number"
          placeholder="Факт"
          required
          value={data.metrics[key].value}
          onChange={(e) => handleChange(`metrics.${key}.value`, e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          id={`${key}-plan`}
          aria-label={`${label} план`}
          type="number"
          placeholder="План"
          value={data.metrics[key].plan}
          onChange={(e) => handleChange(`metrics.${key}.plan`, e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  const renderMetricNoPlan = ({ key, label }) => (
    <div key={key}>
      <label htmlFor={`${key}-value`} className="block text-xs text-gray-500 mb-1">
        {label}
      </label>
      <input
        id={`${key}-value`}
        type="number"
        placeholder="Факт"
        value={data.metrics[key].value}
        onChange={(e) => handleChange(`metrics.${key}.value`, e.target.value)}
        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <form
      onSubmit={submit}
      className="max-w-4xl mx-auto space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">QBR: ввод данных за квартал</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quarter" className="block text-sm font-medium text-gray-700 mb-1">
            Квартал
          </label>
          <input
            id="quarter"
            type="text"
            value={data.quarter}
            onChange={(e) => setTopLevel('quarter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
            Команда
          </label>
          <input
            id="team"
            type="text"
            value={data.team}
            onChange={(e) => setTopLevel('team', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Метрики (факт / план)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {METRICS_WITH_PLAN.map(renderMetricWithPlan)}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Ресурсы и релизы (только факт)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {METRICS_NO_PLAN.map(renderMetricNoPlan)}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Контекст (достижения, риски, планы)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {NOTE_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label htmlFor={`note-${key}`} className="block text-xs text-gray-500 mb-1">
                {label}
              </label>
              <textarea
                id={`note-${key}`}
                rows="3"
                placeholder={placeholder}
                value={data.notes[key]}
                onChange={(e) => setNote(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {!isValid() && (
        <p className="text-sm text-red-500">Заполните фактические значения по всем метрикам с планом.</p>
      )}

      <button
        type="submit"
        disabled={!isValid()}
        className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
      >
        Сформировать отчёт и резюме
      </button>
    </form>
  );
}
