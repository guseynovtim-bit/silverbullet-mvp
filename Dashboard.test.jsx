// src/components/Dashboard.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Dashboard from './Dashboard';

const baseData = {
  team: 'Core Product Team',
  quarter: 'Q3 2026',
  metrics: {
    mau: { value: 12000, plan: 10000 }, // higher, факт лучше плана -> OK
    arpu: { value: 4, plan: 5 }, // higher, факт хуже плана -> Risk
    conversion_mau_share: { value: 0.2, plan: 0.2 }, // higher, равно -> OK
    churn_rate: { value: 8, plan: 5 }, // lower, факт хуже плана -> Risk (регресс на исходный баг)
    completed_tasks: { value: 40, plan: 40 },
    team_size: { value: 12 }, // без статуса
    planned_tasks: { value: 45 }, // без статуса
    problematic_releases: { value: 3 }, // порог 2 превышен -> Attention
  },
};

const getMetricCard = (label) => screen.getByText(label).closest('div');

describe('Dashboard', () => {
  it('показывает команду и квартал из data', () => {
    render(<Dashboard data={baseData} />);
    expect(screen.getByText('Core Product Team')).toBeInTheDocument();
    expect(screen.getByText('Q3 2026')).toBeInTheDocument();
  });

  it('MAU (higher, факт >= план) помечен как "В плане"', () => {
    render(<Dashboard data={baseData} />);
    expect(within(getMetricCard('MAU')).getByText('В плане')).toBeInTheDocument();
  });

  it('ARPU (higher, факт < план) помечен как "Риск"', () => {
    render(<Dashboard data={baseData} />);
    expect(within(getMetricCard('ARPU')).getByText('Риск')).toBeInTheDocument();
  });

  it('Отток (lower, факт хуже плана) помечен как "Риск", а не "В плане"', () => {
    // Это прямой регресс-тест на исходный баг: v >= p раньше давал OK для churn_rate
    render(<Dashboard data={baseData} />);
    expect(within(getMetricCard('Отток')).getByText('Риск')).toBeInTheDocument();
  });

  it('Проблемные релизы выше порога помечены как "Требует внимания"', () => {
    render(<Dashboard data={baseData} />);
    expect(within(getMetricCard('Проблемные релизы')).getByText('Требует внимания')).toBeInTheDocument();
  });

  it('информационные метрики (team_size) отображаются без статус-бейджа', () => {
    render(<Dashboard data={baseData} />);
    const card = getMetricCard('Размер команды');
    expect(within(card).getByText('12')).toBeInTheDocument();
    expect(within(card).queryByText(/В плане|Риск|Требует внимания/)).not.toBeInTheDocument();
  });

  it('показывает заглушку в карточках сводки, если aiSummary не передан', () => {
    render(<Dashboard data={baseData} />);
    expect(screen.getAllByText('Нажмите «Сформировать AI-резюме», чтобы получить резюме')).toHaveLength(3);
  });

  it('использует переданный aiSummary-проп вместо плейсхолдера', () => {
    const aiSummary = {
      summary_overall: 'Квартал в целом успешный.',
      for_c_level: 'Выручка-эквивалент выше плана.',
      for_project_office: 'Часть задач с отставанием.',
      for_product_team: 'Отток выше плана, стоит разобрать причины.',
    };
    render(<Dashboard data={baseData} aiSummary={aiSummary} />);
    expect(screen.getByText(aiSummary.summary_overall)).toBeInTheDocument();
    expect(screen.getByText(aiSummary.for_c_level)).toBeInTheDocument();
    expect(screen.getByText(aiSummary.for_project_office)).toBeInTheDocument();
    expect(screen.getByText(aiSummary.for_product_team)).toBeInTheDocument();
  });

  it('не падает при отсутствующих data/metrics', () => {
    render(<Dashboard />);
    expect(screen.getByText('—')).toBeInTheDocument(); // команда/квартал -> '—'
  });
});
