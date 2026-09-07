import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [InvoicesModule, AccessModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
