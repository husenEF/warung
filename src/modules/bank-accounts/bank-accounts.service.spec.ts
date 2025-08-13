import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccount } from './bank-account.entity';

describe('BankAccountsService', () => {
  let service: BankAccountsService;
  let repository: Repository<BankAccount>;

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
        BankAccountsService,
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BankAccountsService>(BankAccountsService);
    repository = module.get<Repository<BankAccount>>(
      getRepositoryToken(BankAccount),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have repository injected', () => {
    expect(repository).toBeDefined();
  });
});
