import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { CloudflareR2Module } from '../../utils/cloudflare-r2.module';

@Module({
  imports: [
    ProductsModule,
    UsersModule,
    OrdersModule,
    BankAccountsModule,
    CloudflareR2Module,
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
