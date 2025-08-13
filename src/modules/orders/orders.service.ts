import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async create(user: User, products: Product[]): Promise<Order> {
    const total = products.reduce(
      (sum, product) => sum + Number(product.price),
      0,
    );

    const order = this.ordersRepository.create({
      user,
      products,
      total,
      status: OrderStatus.PENDING,
    });

    return this.ordersRepository.save(order);
  }

  async findByUser(user: User): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { user: { id: user.id } },
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Order | undefined> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'products'],
    });
    return order ?? undefined;
  }
}
