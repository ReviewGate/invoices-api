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
/** Credentials for the delivery provider come from the environment. */
const DELIVERY_ENDPOINT = process.env.DELIVERY_ENDPOINT ?? 'https://api.mailroute.example/v2/send';
const DELIVERY_TOKEN = process.env.DELIVERY_TOKEN ?? '';

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
    if (!DELIVERY_TOKEN) {
      this.logger.warn(`Delivery is not configured — letter for invoice ${invoice.id} stays in the outbox`);
      return letter;
    }
    fetch(DELIVERY_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${DELIVERY_TOKEN}` },
      body: JSON.stringify(letter),
    }).catch((error) => this.logger.error(`Delivery failed for invoice ${invoice.id}`, error));
    this.logger.log(`Letter queued for invoice ${invoice.id}`);
    return letter;
  }

  sent(): readonly Letter[] {
    return this.outbox;
  }
}
