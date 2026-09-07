import { money } from '../common/money';
import { InvoiceLine } from '../invoices/invoice.model';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const service = new PricingService();
  const lines: InvoiceLine[] = [
    { description: 'Support plan', quantity: 2, unitPrice: money(4900, 'EUR') },
    { description: 'Onboarding', quantity: 1, unitPrice: money(15000, 'EUR') },
  ];

  it('sums the lines into a net amount', () => {
    expect(service.net(lines, 'EUR').amount).toBe(24800);
  });

  it('applies the discount to the net amount only', () => {
    const totals = service.totals(lines, 'EUR', 'DE', { percent: 10, reason: 'partner' });
    expect(totals.discount.amount).toBe(2480);
    expect(totals.tax.amount).toBe(4241);
    expect(totals.gross.amount).toBe(26561);
  });

  it('charges no tax for a country with a zero rate', () => {
    const totals = service.totals(lines, 'EUR', 'US', null);
    expect(totals.tax.amount).toBe(0);
    expect(totals.gross.amount).toBe(24800);
  });

  it('refuses an unknown country', () => {
    expect(() => service.totals(lines, 'EUR', 'ZZ', null)).toThrow('No tax rate');
  });

  it('refuses a discount above 100 percent', () => {
    expect(() => service.discountAmount(money(1000, 'EUR'), { percent: 120, reason: 'typo' })).toThrow(
      'out of range',
    );
  });
});
