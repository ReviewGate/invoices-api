import { Injectable } from '@nestjs/common';
import { Invoice } from './invoice.model';

/**
 * In-memory storage keeps the sample runnable without a database.
 * Every lookup takes the tenant, so a caller cannot reach foreign rows.
 */
@Injectable()
export class InvoicesRepository {
  private readonly rows = new Map<string, Invoice>();

  save(invoice: Invoice): Invoice {
    this.rows.set(invoice.id, invoice);
    return invoice;
  }

  findById(tenantId: string, id: string): Invoice | undefined {
    const found = this.rows.get(id);
    if (!found || found.tenantId !== tenantId) {
      return undefined;
    }
    return found;
  }

  findByCustomer(tenantId: string, customerId: string): Invoice[] {
    return this.list(tenantId).filter((invoice) => invoice.customerId === customerId);
  }

  list(tenantId: string): Invoice[] {
    return [...this.rows.values()].filter((invoice) => invoice.tenantId === tenantId);
  }

  clear(): void {
    this.rows.clear();
  }
}
