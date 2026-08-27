// src/components/FormQBR.jsx
import { useState } from 'react';

export default function FormQBR({ onSubmit }) {
  const [data, setData] = useState({
    quarter: 'Q3 2026',
    team: 'Core Product Team',
    metrics: {
      mau: { value: '', plan: '' },
      arpu: { value: '', plan: '' },
      conversion_mau_share: { value: '', plan: '' },
      churn_rate: { value: '', plan: '' },
      team_size: { value: '', plan: null },
      completed_tasks: { value: '', plan: '' },
      planned_tasks: { value: '', plan: null },
      problematic_releases: { value: '', plan: null }
    },
    notes: {
      achievements: '',
      risks: '',
      plans: ''
    }
  });

  const handleChange = (path, value) => {
    const newData = { ...data };
    const keys = path.split('.');
    let obj = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setData(newData);
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">QBR: ввод данных за квартал</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Квартал</label>
          <input
            type="text"
            value={data.quarter}
            onChange={(e) => setData({ ...data, quarter: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Команда</label>
          <input
            type="text"
            value={data.team}
            onChange={(e) => setData({ ...data, team: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Пример одного блока метрик — продублируй или сгенерируй через Cursor */}
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Финансы</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">MAU (факт / план)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Факт"
                  value={data.metrics.mau.value}
                  onChange={(e) => handleChange('metrics.mau.value', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="План"
                  value={data.metrics.mau.plan}
                  onChange={(e) => handleChange('metrics.mau.plan', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Пример подсказки: MAU × ARPU ≈ выручка квартала</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ARPU (факт / план)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Факт"
                  value={data.metrics.arpu.value}
                  onChange={(e) => handleChange('metrics.arpu.value', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="План"
                  value={data.metrics.arpu.plan}
                  onChange={(e) => handleChange('metrics.arpu.plan', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Аналогично можно сделать блоки для Ресурсов и Продукта — либо сгенерировать их через Cursor по аналогии */}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Контекст (достижения, риски, планы)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Достижения</label>
            <textarea
              rows="3"
              placeholder="Кратко: что сделали важного"
              value={data.notes.achievements}
              onChange={(e) => setData({ ...data, notes: { ...data.notes, achievements: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Риски</label>
            <textarea
              rows="3"
              placeholder="Что мешает, отставания, зависимости"
              value={data.notes.risks}
              onChange={(e) => setData({ ...data, notes: { ...data.notes, risks: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Планы</label>
            <textarea
              rows="3"
              placeholder="Ключевые задачи на следующий квартал"
              value={data.notes.plans}
              onChange={(e) => setData({ ...data, notes: { ...data.notes, plans: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-md"
      >
        Сформировать отчёт и резюме
      </button>
    </form>
  );
}
