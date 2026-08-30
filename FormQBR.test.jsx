// src/components/FormQBR.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormQBR from './FormQBR';
import { METRICS_WITH_PLAN } from '../config/metrics';

// Заполняет факт (и опционально план) по всем метрикам с планом —
// нужно для тестов, которым важно дойти до "валидной" формы.
async function fillAllRequiredFacts(user, { withPlan = true } = {}) {
  for (const { key, label } of METRICS_WITH_PLAN) {
    const factInput = screen.getByLabelText(new RegExp(`${label} \\(факт / план\\)`));
    await user.clear(factInput);
    await user.type(factInput, '10');
    if (withPlan) {
      const planInput = screen.getByLabelText(new RegExp(`${label} план`));
      await user.clear(planInput);
      await user.type(planInput, '8');
    }
  }
}

describe('FormQBR', () => {
  it('рендерит квартал и команду со значениями по умолчанию из пропов', () => {
    render(<FormQBR onSubmit={() => {}} defaultQuarter="Q1 2027" defaultTeam="Growth" />);
    expect(screen.getByLabelText('Квартал')).toHaveValue('Q1 2027');
    expect(screen.getByLabelText('Команда')).toHaveValue('Growth');
  });

  it('кнопка отправки задизейблена, пока не заполнены все факты с планом', async () => {
    render(<FormQBR onSubmit={() => {}} />);
    const submitBtn = screen.getByRole('button', { name: /Сформировать отчёт/ });
    expect(submitBtn).toBeDisabled();

    const user = userEvent.setup();
    await fillAllRequiredFacts(user);

    expect(submitBtn).toBeEnabled();
  });

  it('изменение одной метрики не задевает соседние (иммутабельность handleChange)', async () => {
    const user = userEvent.setup();
    render(<FormQBR onSubmit={() => {}} />);

    const mauFact = screen.getByLabelText(/MAU \(факт \/ план\)/);
    const arpuFact = screen.getByLabelText(/ARPU \(факт \/ план\)/);

    await user.type(arpuFact, '50');
    await user.type(mauFact, '1000');

    // ARPU не должен был обнулиться/измениться от ввода в MAU
    expect(arpuFact).toHaveValue(50);
    expect(mauFact).toHaveValue(1000);
  });

  it('вызывает onSubmit с числовым payload, а не строками из инпутов', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<FormQBR onSubmit={handleSubmit} />);

    await fillAllRequiredFacts(user);
    await user.click(screen.getByRole('button', { name: /Сформировать отчёт/ }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.metrics.mau.value).toBe(10);
    expect(typeof payload.metrics.mau.value).toBe('number');
    expect(payload.metrics.team_size.value).toBeNull(); // не заполняли -> null, не ''
  });

  it('не вызывает onSubmit, если форма невалидна', async () => {
    const handleSubmit = vi.fn();
    render(<FormQBR onSubmit={handleSubmit} />);

    // Пытаемся сабмитнуть форму напрямую, минуя disabled-кнопку
    const form = screen.getByRole('button', { name: /Сформировать отчёт/ }).closest('form');
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
