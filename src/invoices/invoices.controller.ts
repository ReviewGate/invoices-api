import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TenantGuard, TenantRequest } from '../access/tenant.guard';
import { Tenant } from '../common/tenant';
import { CreateInvoiceCommand, InvoicesService } from './invoices.service';
import { Invoice } from './invoice.model';

@Controller('invoices')
@UseGuards(TenantGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  list(@Req() request: TenantRequest): Invoice[] {
    return this.invoices.list(tenantOf(request).id);
  }

  @Get(':id')
  byId(@Req() request: TenantRequest, @Param('id') id: string): Invoice {
    return this.invoices.require(tenantOf(request).id, id);
  }

  @Post()
  create(@Req() request: TenantRequest, @Body() body: Omit<CreateInvoiceCommand, 'tenantId'>): Invoice {
    return this.invoices.create({ ...body, tenantId: tenantOf(request).id });
  }

  @Post(':id/issue')
  issue(
    @Req() request: TenantRequest,
    @Param('id') id: string,
    @Body() body: Omit<CreateInvoiceCommand, 'tenantId'>,
  ): Invoice {
    return this.invoices.issue(tenantOf(request).id, id, { ...body, tenantId: tenantOf(request).id });
  }
}

export function tenantOf(request: TenantRequest): Tenant {
  if (!request.tenant) {
    throw new UnauthorizedException('Request has no tenant');
  }
  return request.tenant;
}
