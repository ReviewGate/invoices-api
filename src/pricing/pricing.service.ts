import { Injectable } from '@nestjs/common';
import { Money, add, money, multiply, subtract } from '../common/money';
import { InvoiceLine, InvoiceTotals } from '../invoices/invoice.model';
import { Currency } from '../common/money';

export interface Discount {
  /** Percent off, 0..100. Applied to the net amount before tax. */
  readonly percent: number;
  readonly reason: string;
}

/** Tax rates the finance team maintains per country of the customer. */
const TAX_RATES: Record<string, number> = {
  DE: 0.19,
  FR: 0.2,
  NL: 0.21,
  GB: 0.2,
  US: 0,
};

@Injectable()
export class PricingService {
  net(lines: readonly InvoiceLine[], currency: Currency): Money {
    return lines.reduce(
      (total, line) => add(total, multiply(line.unitPrice, line.quantity)),
      money(0, currency),
    );
  }

  discountAmount(net: Money, discount: Discount | null): Money {
    if (!discount || discount.percent <= 0) {
      return money(0, net.currency);
    }
    if (discount.percent > 100) {
      throw new Error(`Discount percent out of range: ${discount.percent}`);
    }
    return multiply(net, discount.percent / 100);
  }

  taxAmount(taxable: Money, countryCode: string): Money {
    const rate = TAX_RATES[countryCode];
    if (rate === undefined) {
      throw new Error(`No tax rate configured for country ${countryCode}`);
    }
    return multiply(taxable, rate);
  }

  totals(
    lines: readonly InvoiceLine[],
    currency: Currency,
    countryCode: string,
    discount: Discount | null,
  ): InvoiceTotals {
    const net = this.net(lines, currency);
    const discountValue = this.discountAmount(net, discount);
    const taxable = subtract(net, discountValue);
    const tax = this.taxAmount(taxable, countryCode);
    return { net, discount: discountValue, tax, gross: add(taxable, tax) };
  }
}
