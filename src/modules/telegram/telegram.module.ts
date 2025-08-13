import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ProductsModule, UsersModule, OrdersModule],
  providers: [TelegramService],
})
export class TelegramModule {}
