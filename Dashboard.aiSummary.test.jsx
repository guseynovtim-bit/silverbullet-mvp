// src/components/Dashboard.aiSummary.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';

const baseData = {
  team: 'Core Product Team',
  quarter: 'Q3 2026',
  metrics: {
    mau: { value: 12000, plan: 10000 },
    arpu: { value: 4, plan: 5 },
    conversion_mau_share: { value: 0.2, plan: 0.2 },
    churn_rate: { value: 8, plan: 5 },
    completed_tasks: { value: 40, plan: 40 },
    team_size: { value: 12 },
    planned_tasks: { value: 45 },
    problematic_releases: { value: 3 },
  },
};

describe('Dashboard — генерация AI-резюме (backend-агностично: сейчас это YandexGPT Lite)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('по клику дёргает /api/qbr-summary и подставляет ответ в карточки', async () => {
    const user = userEvent.setup();
    const mockSummary = {
      summary_overall: 'Квартал закрыт с показателем MAU при опредлелённом ARPU и стабильном оттоке',
      for_c_level: 'MAU выше плана, ARPU немного не дотянул.',
      for_project_office: 'Три релиза потребовали хотфиксов.',
      for_product_team: 'Отток превышает план — стоит приоритизировать retention.',
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockSummary, cached: false }),
    });

    render(<Dashboard data={baseData} />);
    await user.click(screen.getByRole('button', { name: /Сформировать AI-резюме/ }));

    await waitFor(() => expect(screen.getByText(mockSummary.summary_overall)).toBeInTheDocument());
    expect(screen.getByText(mockSummary.for_c_level)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/qbr-summary',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('дизейблит кнопку и меняет подпись, пока идёт запрос', async () => {
    const user = userEvent.setup();
    let resolveFetch;
    fetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<Dashboard data={baseData} />);
    const button = screen.getByRole('button', { name: /Сформировать AI-резюме/ });
    await user.click(button);

    expect(screen.getByRole('button', { name: /Генерируем AI-резюме/ })).toBeDisabled();

    resolveFetch({
      ok: true,
      json: async () => ({
        summary_overall: 'ok',
        for_c_level: 'ok',
        for_project_office: 'ok',
        for_product_team: 'ok',
      }),
    });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('показывает сообщение об ошибке, если backend вернул ошибку', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Не удалось получить AI-резюме от YandexGPT. Попробуйте ещё раз.' }),
    });

    render(<Dashboard data={baseData} />);
    await user.click(screen.getByRole('button', { name: /Сформировать AI-резюме/ }));

    await waitFor(() =>
      expect(screen.getByText('Не удалось получить AI-резюме от YandexGPT. Попробуйте ещё раз.')).toBeInTheDocument()
    );
  });
});
