import { Invoice } from '../invoices/invoice.model';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const service = new ReportsService();

  const invoice = (id: string, issuedAt: string): Invoice => ({
    id,
    tenantId: 'acme',
    customerId: 'cus_1',
    currency: 'EUR',
    lines: [],
    status: 'issued',
    issuedAt: new Date(issuedAt),
    dueAt: null,
    paidAt: null,
  });

  it('starts the month at local midnight, not at UTC midnight', () => {
    const period = service.monthPeriod(2026, 3, 'Europe/Berlin');
    expect(period.from.toISOString()).toBe('2026-02-28T23:00:00.000Z');
  });

  it('keeps a late-evening invoice in the month the customer sees', () => {
    const period = service.monthPeriod(2026, 3, 'Europe/Berlin');
    const late = invoice('inv_late', '2026-03-31T22:30:00.000Z');
    const first = invoice('inv_first', '2026-02-28T23:30:00.000Z');
    const inside = service.issuedWithin([late, first], period).map((row) => row.id);
    expect(inside).toEqual(['inv_first']);
  });

  it('falls back to UTC for a zone without an offset', () => {
    const period = service.monthPeriod(2026, 3, 'UTC');
    expect(period.from.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });
});
