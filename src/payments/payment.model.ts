import { Money } from '../common/money';

export type PaymentMethod = 'card' | 'transfer' | 'credit';

export interface Payment {
  readonly id: string;
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly idempotencyKey: string;
  readonly receivedAt: Date;
}
