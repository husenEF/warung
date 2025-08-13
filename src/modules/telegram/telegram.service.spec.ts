import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { CloudflareR2Service } from '../../utils/cloudflare-r2.service';

describe('TelegramService', () => {
  let service: TelegramService;

  // Mock services
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: { [key: string]: string } = {
        TELEGRAM_BOT_TOKEN: 'mock_bot_token',
        R2_ENDPOINT: 'mock_endpoint',
        R2_ACCESS_KEY_ID: 'mock_key',
        R2_SECRET_ACCESS_KEY: 'mock_secret',
        R2_BUCKET_NAME: 'mock_bucket',
        R2_PUBLIC_URL: 'mock_url',
      };
      return config[key];
    }),
  };

  const mockProductsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
  };

  const mockUsersService = {
    findByTelegramId: jest.fn().mockResolvedValue(null),
    createOrUpdate: jest.fn().mockResolvedValue({}),
  };

  const mockOrdersService = {
    create: jest.fn().mockResolvedValue({}),
    findByUser: jest.fn().mockResolvedValue([]),
    findPendingOrders: jest.fn().mockResolvedValue([]),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    updateOrderStatus: jest.fn().mockResolvedValue({}),
  };

  const mockBankAccountsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findActive: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    toggleActive: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockCloudflareR2Service = {
    uploadImageFromUrl: jest.fn().mockResolvedValue({
      key: 'mock_key',
      publicUrl: 'mock_url',
      presignedUrl: 'mock_presigned_url',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: BankAccountsService,
          useValue: mockBankAccountsService,
        },
        {
          provide: CloudflareR2Service,
          useValue: mockCloudflareR2Service,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);

    // Mock the onModuleInit to prevent bot initialization during testing
    jest.spyOn(service, 'onModuleInit').mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be an instance of TelegramService', () => {
    expect(service).toBeInstanceOf(TelegramService);
  });

  it('should have mocked dependencies', () => {
    expect(mockConfigService.get).toBeDefined();
    expect(mockProductsService.findAll).toBeDefined();
    expect(mockUsersService.findByTelegramId).toBeDefined();
    expect(mockOrdersService.create).toBeDefined();
    expect(mockBankAccountsService.findAll).toBeDefined();
    expect(mockCloudflareR2Service.uploadImageFromUrl).toBeDefined();
  });
});
