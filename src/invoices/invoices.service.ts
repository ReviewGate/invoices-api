import { Injectable, NotFoundException } from '@nestjs/common';
import { Currency, Money, money } from '../common/money';
import { TenantMismatchError } from '../common/tenant';
import { NotificationsService } from '../notifications/notifications.service';
import { Discount, PricingService } from '../pricing/pricing.service';
import { Invoice, InvoiceLine, InvoiceTotals } from './invoice.model';
import { InvoicesRepository } from './invoices.repository';

export interface CreateInvoiceCommand {
  readonly tenantId: string;
  readonly customerId: string;
  readonly customerEmail: string;
  readonly countryCode: string;
  readonly currency: Currency;
  readonly lines: readonly InvoiceLine[];
  readonly discount: Discount | null;
  readonly dueInDays: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly repository: InvoicesRepository,
    private readonly pricing: PricingService,
    private readonly notifications: NotificationsService,
  ) {}

  create(command: CreateInvoiceCommand): Invoice {
    if (command.lines.length === 0) {
      throw new Error('An invoice needs at least one line');
    }
    const invoice: Invoice = {
      id: `inv_${Date.now().toString(36)}`,
      tenantId: command.tenantId,
      customerId: command.customerId,
      currency: command.currency,
      lines: command.lines,
      status: 'draft',
      issuedAt: null,
      dueAt: null,
      paidAt: null,
    };
    return this.repository.save(invoice);
  }

  issue(tenantId: string, id: string, command: CreateInvoiceCommand): Invoice {
    const invoice = this.require(tenantId, id);
    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + command.dueInDays * 24 * 60 * 60 * 1000);
    const issued: Invoice = { ...invoice, status: 'issued', issuedAt, dueAt };
    this.repository.save(issued);
    this.notifications.invoiceIssued(issued, this.totals(issued, command), command.customerEmail);
    return issued;
  }

  markPaid(tenantId: string, id: string): Invoice {
    const invoice = this.require(tenantId, id);
    const paid: Invoice = { ...invoice, status: 'paid', paidAt: new Date() };
    return this.repository.save(paid);
  }

  totals(invoice: Invoice, command: CreateInvoiceCommand): InvoiceTotals {
    return this.pricing.totals(invoice.lines, invoice.currency, command.countryCode, command.discount);
  }

  amountDue(invoice: Invoice, command: CreateInvoiceCommand): Money {
    if (invoice.status === 'void') {
      return money(0, invoice.currency);
    }
    return this.totals(invoice, command).gross;
  }

  list(tenantId: string): Invoice[] {
    return this.repository.list(tenantId);
  }

  require(tenantId: string, id: string): Invoice {
    const invoice = this.repository.findById(tenantId, id);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    if (invoice.tenantId !== tenantId) {
      throw new TenantMismatchError(id);
    }
    return invoice;
  }
}
