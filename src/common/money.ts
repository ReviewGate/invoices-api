/**
 * Money is stored in minor units (cents) as integers.
 * Never use floating point for amounts: 0.1 + 0.2 !== 0.3.
 */
export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Money {
  readonly amount: number; // minor units
  readonly currency: Currency;
}

export function money(amount: number, currency: Currency): Money {
  if (!Number.isInteger(amount)) {
    throw new Error(`Amount must be an integer in minor units, got ${amount}`);
  }
  return { amount, currency };
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function multiply(value: Money, factor: number): Money {
  return { amount: roundHalfUp(value.amount * factor), currency: value.currency };
}

export function isZero(value: Money): boolean {
  return value.amount === 0;
}

export function format(value: Money): string {
  const sign = value.amount < 0 ? '-' : '';
  const abs = Math.abs(value.amount);
  const major = Math.trunc(abs / 100);
  const minor = (abs % 100).toString().padStart(2, '0');
  return `${sign}${major}.${minor} ${value.currency}`;
}

/**
 * Bankers would argue about the rounding mode; the finance team asked for
 * half-up on the absolute value, so -0.5 rounds to -1, not to 0.
 */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} and ${b.currency}`);
  }
}
