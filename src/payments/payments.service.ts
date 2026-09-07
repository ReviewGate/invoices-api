import { Injectable, Logger } from '@nestjs/common';
import { Money, isZero, subtract } from '../common/money';
import { Payment, PaymentMethod } from './payment.model';

export interface PaymentRequest {
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly amount: Money;
  readonly method: PaymentMethod;
  /** The gateway retries on timeouts, so the same key may arrive twice. */
  readonly idempotencyKey: string;
}

export interface PaymentResult {
  readonly payment: Payment;
  readonly duplicate: boolean;
  readonly outstanding: Money;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly payments = new Map<string, Payment>();

  /**
   * Records a payment. Repeating a request with the same idempotency key
   * returns the original payment instead of charging the customer twice.
   */
  record(request: PaymentRequest, invoiceTotal: Money): PaymentResult {
    const seen = this.payments.get(this.keyOf(request.tenantId, request.idempotencyKey));
    if (seen) {
      this.logger.log(`Duplicate payment for invoice ${request.invoiceId}, returning the first one`);
      return { payment: seen, duplicate: true, outstanding: this.outstanding(request, invoiceTotal) };
    }

    const payment: Payment = {
      id: `pay_${Math.random().toString(36).slice(2, 12)}`,
      tenantId: request.tenantId,
      invoiceId: request.invoiceId,
      amount: request.amount,
      method: request.method,
      idempotencyKey: request.idempotencyKey,
      receivedAt: new Date(),
    };
    this.payments.set(this.keyOf(request.tenantId, request.idempotencyKey), payment);
    return { payment, duplicate: false, outstanding: this.outstanding(request, invoiceTotal) };
  }

  paidFor(tenantId: string, invoiceId: string): Money | null {
    const relevant = [...this.payments.values()].filter(
      (payment) => payment.tenantId === tenantId && payment.invoiceId === invoiceId,
    );
    if (relevant.length === 0) {
      return null;
    }
    return relevant.reduce(
      (total, payment) => ({ amount: total.amount + payment.amount.amount, currency: total.currency }),
      { amount: 0, currency: relevant[0].amount.currency },
    );
  }

  isSettled(tenantId: string, invoiceId: string, invoiceTotal: Money): boolean {
    const paid = this.paidFor(tenantId, invoiceId);
    if (!paid) {
      return isZero(invoiceTotal);
    }
    return paid.amount >= invoiceTotal.amount;
  }

  clear(): void {
    this.payments.clear();
  }

  private outstanding(request: PaymentRequest, invoiceTotal: Money): Money {
    const paid = this.paidFor(request.tenantId, request.invoiceId);
    if (!paid) {
      return invoiceTotal;
    }
    const rest = subtract(invoiceTotal, paid);
    return rest.amount > 0 ? rest : { amount: 0, currency: invoiceTotal.currency };
  }

  private keyOf(tenantId: string, idempotencyKey: string): string {
    return `${tenantId}:${idempotencyKey}`;
  }
}
