import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './order.entity';
import { User, UserRole } from '../users/user.entity';
import { Product } from '../products/product.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: Repository<Order>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get<Repository<Order>>(getRepositoryToken(Order));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have repository injected', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const mockUser: Partial<User> = {
        id: 1,
        telegramId: 123456,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      const mockProducts: Partial<Product>[] = [
        {
          id: 1,
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          imageUrl: 'test.jpg',
          imageKey: 'test-key',
        },
      ];

      const mockOrder: Partial<Order> = {
        id: 1,
        user: mockUser as User,
        products: mockProducts as Product[],
        total: 100,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(
        mockUser as User,
        mockProducts as Product[],
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        products: mockProducts,
        total: 100,
        status: OrderStatus.PENDING,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);
    });
  });
});
