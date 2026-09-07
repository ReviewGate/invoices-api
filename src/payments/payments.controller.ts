import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { TenantGuard, TenantRequest } from '../access/tenant.guard';
import { Money } from '../common/money';
import { CreateInvoiceCommand, InvoicesService } from '../invoices/invoices.service';
import { tenantOf } from '../invoices/invoices.controller';
import { PaymentMethod } from './payment.model';
import { PaymentsService } from './payments.service';

interface PayBody {
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly idempotencyKey: string;
  readonly invoice: Omit<CreateInvoiceCommand, 'tenantId'>;
}

@Controller('payments')
@UseGuards(TenantGuard)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly invoices: InvoicesService,
  ) {}

  @Post(':invoiceId')
  pay(@Req() request: TenantRequest, @Body() body: PayBody & { invoiceId: string }) {
    const tenantId = tenantOf(request).id;
    const invoice = this.invoices.require(tenantId, body.invoiceId);
    const due = this.invoices.amountDue(invoice, { ...body.invoice, tenantId });
    const result = this.payments.record(
      {
        tenantId,
        invoiceId: invoice.id,
        amount: body.amount,
        method: body.method,
        idempotencyKey: body.idempotencyKey,
      },
      due,
    );
    if (result.outstanding.amount === 0) {
      this.invoices.markPaid(tenantId, invoice.id);
    }
    return { paymentId: result.payment.id, duplicate: result.duplicate, outstanding: result.outstanding };
  }
}
