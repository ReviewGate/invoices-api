import { Module } from '@nestjs/common';
import { AccessModule } from './access/access.module';
import { InvoicesModule } from './invoices/invoices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PricingModule } from './pricing/pricing.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    AccessModule,
    PricingModule,
    InvoicesModule,
    PaymentsModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
