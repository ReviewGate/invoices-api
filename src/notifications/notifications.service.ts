import { Injectable, Logger } from '@nestjs/common';
import { format } from '../common/money';
import { Invoice, InvoiceTotals } from '../invoices/invoice.model';

export interface Letter {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

/**
 * Sends the customer a letter about an issued invoice.
 * Payload of the outgoing request is never written to the log: it carries the
 * customer address and the amounts.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly outbox: Letter[] = [];

  invoiceIssued(invoice: Invoice, totals: InvoiceTotals, email: string): Letter {
    const letter: Letter = {
      to: email,
      subject: `Invoice ${invoice.id} is ready`,
      body: [
        `Invoice ${invoice.id} has been issued.`,
        `Amount due: ${format(totals.gross)}.`,
        invoice.dueAt ? `Please pay by ${invoice.dueAt.toISOString().slice(0, 10)}.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
    this.outbox.push(letter);
    this.logger.log(`Letter queued for invoice ${invoice.id}`);
    return letter;
  }

  sent(): readonly Letter[] {
    return this.outbox;
  }
}
