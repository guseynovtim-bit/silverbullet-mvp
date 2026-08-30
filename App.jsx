// src/App.jsx
// Небольшая демо-обвязка для ручного тестирования: форма -> локальный стейт -> дашборд.
// В реальном приложении onSubmit скорее всего пойдёт в API, который вернёт aiSummary;
// здесь просто эхо, чтобы прощёлкать сценарий глазами.
import { useState } from 'react';
import FormQBR from './components/FormQBR';
import Dashboard from './components/Dashboard';

export default function App() {
  const [submitted, setSubmitted] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      {!submitted ? (
        <FormQBR onSubmit={setSubmitted} />
      ) : (
        <div className="space-y-4">
          <Dashboard data={submitted} aiSummary={null} />
          <div className="max-w-5xl mx-auto px-6">
            <button
              onClick={() => setSubmitted(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Заполнить заново
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
