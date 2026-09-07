import { Injectable } from '@nestjs/common';
import { Invoice } from '../invoices/invoice.model';

export interface Period {
  readonly from: Date;
  readonly to: Date;
}

/**
 * Reports are cut by the customer's local month, while invoices carry UTC
 * timestamps. An invoice issued at 23:30 in Berlin belongs to the next day
 * in UTC, so the boundaries are computed in the requested zone.
 */
@Injectable()
export class ReportsService {
  monthPeriod(year: number, month: number, timeZone: string): Period {
    const from = this.zonedStartOfDay(new Date(Date.UTC(year, month - 1, 1)), timeZone);
    const to = this.zonedStartOfDay(new Date(Date.UTC(year, month, 1)), timeZone);
    return { from, to };
  }

  issuedWithin(invoices: readonly Invoice[], period: Period): Invoice[] {
    return invoices.filter((invoice) => {
      if (!invoice.issuedAt) {
        return false;
      }
      return invoice.issuedAt >= period.from && invoice.issuedAt < period.to;
    });
  }

  /** Offset of the zone at the given instant, in minutes east of UTC. */
  private offsetMinutes(instant: Date, timeZone: string): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const part = formatter.formatToParts(instant).find((item) => item.type === 'timeZoneName');
    const text = part?.value ?? 'GMT+00:00';
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(text);
    if (!match) {
      return 0;
    }
    const sign = match[1] === '-' ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3]));
  }

  private zonedStartOfDay(utcMidnight: Date, timeZone: string): Date {
    const offset = this.offsetMinutes(utcMidnight, timeZone);
    return new Date(utcMidnight.getTime() - offset * 60_000);
  }
}
