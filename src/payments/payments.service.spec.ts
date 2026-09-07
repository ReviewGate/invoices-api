import { money } from '../common/money';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const total = money(26561, 'EUR');
  const request = {
    tenantId: 'acme',
    invoiceId: 'inv_1',
    amount: money(26561, 'EUR'),
    method: 'card' as const,
    idempotencyKey: 'key-1',
  };

  beforeEach(() => {
    service = new PaymentsService();
  });

  it('records a payment and reports nothing outstanding', () => {
    const result = service.record(request, total);
    expect(result.duplicate).toBe(false);
    expect(result.outstanding.amount).toBe(0);
  });

  it('returns the first payment when the key repeats', () => {
    const first = service.record(request, total);
    const second = service.record(request, total);
    expect(second.duplicate).toBe(true);
    expect(second.payment.id).toBe(first.payment.id);
  });

  it('keeps the same key of two tenants apart', () => {
    service.record(request, total);
    const other = service.record({ ...request, tenantId: 'globex' }, total);
    expect(other.duplicate).toBe(false);
  });

  it('treats a partial payment as unsettled', () => {
    service.record({ ...request, amount: money(10000, 'EUR') }, total);
    expect(service.isSettled('acme', 'inv_1', total)).toBe(false);
  });
});
