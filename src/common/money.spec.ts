import { add, format, money, multiply, roundHalfUp, subtract } from './money';

describe('money', () => {
  it('rejects fractional minor units', () => {
    expect(() => money(10.5, 'EUR')).toThrow('minor units');
  });

  it('adds and subtracts within one currency', () => {
    expect(add(money(1050, 'EUR'), money(250, 'EUR')).amount).toBe(1300);
    expect(subtract(money(1050, 'EUR'), money(50, 'EUR')).amount).toBe(1000);
  });

  it('refuses to mix currencies', () => {
    expect(() => add(money(100, 'EUR'), money(100, 'USD'))).toThrow('Currency mismatch');
  });

  it('rounds half up away from zero', () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-2.5)).toBe(-3);
    expect(multiply(money(1000, 'EUR'), 0.075).amount).toBe(75);
  });

  it('formats with two decimals', () => {
    expect(format(money(1305, 'EUR'))).toBe('13.05 EUR');
    expect(format(money(-40, 'USD'))).toBe('-0.40 USD');
  });
});
