// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import FormQBR from './components/FormQBR_v02';
import Dashboard from './components/Dashboard';
import './index.css'; // ваши стили

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div>
      <h1 className="text-3xl font-bold mb-6">QBR Tool</h1>
      <FormQBR />
      <Dashboard />
    </div>
  </React.StrictMode>
);
