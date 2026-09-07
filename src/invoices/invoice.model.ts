import { Currency, Money } from '../common/money';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export interface InvoiceLine {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: Money;
}

export interface Invoice {
  readonly id: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly currency: Currency;
  readonly lines: readonly InvoiceLine[];
  readonly status: InvoiceStatus;
  /** Issue moment in UTC. Local presentation happens in the reports module. */
  readonly issuedAt: Date | null;
  readonly dueAt: Date | null;
  readonly paidAt: Date | null;
}

export interface InvoiceTotals {
  readonly net: Money;
  readonly discount: Money;
  readonly tax: Money;
  readonly gross: Money;
}
