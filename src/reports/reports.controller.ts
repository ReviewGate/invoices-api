import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard, TenantRequest } from '../access/tenant.guard';
import { InvoicesService } from '../invoices/invoices.service';
import { tenantOf } from '../invoices/invoices.controller';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(TenantGuard)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly invoices: InvoicesService,
  ) {}

  @Get('month')
  month(
    @Req() request: TenantRequest,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('tz') timeZone = 'UTC',
  ) {
    const period = this.reports.monthPeriod(Number(year), Number(month), timeZone);
    const issued = this.reports.issuedWithin(this.invoices.list(tenantOf(request).id), period);
    return { period, count: issued.length, invoices: issued.map((invoice) => invoice.id) };
  }
}
