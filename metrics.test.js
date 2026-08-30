// src/config/metrics.test.js
import { describe, it, expect } from 'vitest';
import {
  METRICS,
  METRICS_WITH_PLAN,
  METRICS_NO_PLAN,
  METRICS_WITH_STATUS,
  METRICS_INFO_ONLY,
  getMetricStatus,
  buildInitialMetrics,
} from './metrics';

const find = (key) => METRICS.find((m) => m.key === key);

describe('getMetricStatus — direction: higher (mau, arpu, completed_tasks...)', () => {
  const mau = find('mau');

  it('факт >= план -> OK', () => {
    expect(getMetricStatus(mau, { value: 120, plan: 100 })).toBe('OK');
    expect(getMetricStatus(mau, { value: 100, plan: 100 })).toBe('OK');
  });

  it('факт < план -> Risk', () => {
    expect(getMetricStatus(mau, { value: 80, plan: 100 })).toBe('Risk');
  });

  it('нет значения/плана -> Attention', () => {
    expect(getMetricStatus(mau, { value: '', plan: 100 })).toBe('Attention');
    expect(getMetricStatus(mau, { value: 100, plan: null })).toBe('Attention');
    expect(getMetricStatus(mau, {})).toBe('Attention');
  });

  it('нечисловые значения -> Attention, а не молчаливый NaN-баг', () => {
    expect(getMetricStatus(mau, { value: 'n/a', plan: 100 })).toBe('Attention');
  });
});

describe('getMetricStatus — direction: lower (churn_rate) — регресс на исходный баг', () => {
  const churn = find('churn_rate');

  it('факт <= план (низкий отток) -> OK', () => {
    expect(getMetricStatus(churn, { value: 3, plan: 5 })).toBe('OK');
  });

  it('факт > план (высокий отток) -> Risk, а не OK', () => {
    // Именно этот кейс раньше возвращал 'OK' из-за v >= p без учёта направления
    expect(getMetricStatus(churn, { value: 8, plan: 5 })).toBe('Risk');
  });
});

describe('getMetricStatus — thresholdStatus (problematic_releases)', () => {
  const releases = find('problematic_releases');

  it('значение <= порога -> OK', () => {
    expect(getMetricStatus(releases, { value: 1 })).toBe('OK');
    expect(getMetricStatus(releases, { value: 2 })).toBe('OK'); // граница включительно
  });

  it('значение > порога -> Attention', () => {
    expect(getMetricStatus(releases, { value: 3 })).toBe('Attention');
  });

  it('нет значения -> Attention', () => {
    expect(getMetricStatus(releases, {})).toBe('Attention');
  });
});

describe('getMetricStatus — информационные метрики без статуса', () => {
  it('team_size не имеет ни плана, ни порога -> null', () => {
    expect(getMetricStatus(find('team_size'), { value: 8 })).toBeNull();
  });
});

describe('производные выборки METRICS_*', () => {
  it('каждая метрика попадает ровно в одну из трёх взаимоисключающих категорий рендера формы', () => {
    const withPlanKeys = METRICS_WITH_PLAN.map((m) => m.key);
    const noPlanKeys = METRICS_NO_PLAN.map((m) => m.key);
    expect(withPlanKeys.length + noPlanKeys.length).toBe(METRICS.length);
    expect(withPlanKeys.some((k) => noPlanKeys.includes(k))).toBe(false);
  });

  it('METRICS_WITH_STATUS и METRICS_INFO_ONLY в сумме покрывают все метрики без пересечений', () => {
    const statusKeys = METRICS_WITH_STATUS.map((m) => m.key);
    const infoKeys = METRICS_INFO_ONLY.map((m) => m.key);
    expect(statusKeys.length + infoKeys.length).toBe(METRICS.length);
    expect(statusKeys.some((k) => infoKeys.includes(k))).toBe(false);
  });

  it('problematic_releases считается статусной метрикой, хотя у неё нет плана', () => {
    expect(METRICS_WITH_STATUS.map((m) => m.key)).toContain('problematic_releases');
    expect(METRICS_INFO_ONLY.map((m) => m.key)).not.toContain('problematic_releases');
  });
});

describe('buildInitialMetrics', () => {
  it('создаёт запись { value: "", plan: "" } для каждой метрики из конфига', () => {
    const initial = buildInitialMetrics();
    expect(Object.keys(initial).sort()).toEqual(METRICS.map((m) => m.key).sort());
    Object.values(initial).forEach((entry) => {
      expect(entry).toEqual({ value: '', plan: '' });
    });
  });
});
