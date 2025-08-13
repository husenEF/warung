import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './bank-account.entity';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  async create(bankAccount: Partial<BankAccount>): Promise<BankAccount> {
    const newBankAccount = this.bankAccountRepository.create(bankAccount);
    return this.bankAccountRepository.save(newBankAccount);
  }

  async findAll(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find();
  }

  async findOne(id: number): Promise<BankAccount | null> {
    return this.bankAccountRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    bankAccount: Partial<BankAccount>,
  ): Promise<BankAccount | null> {
    await this.bankAccountRepository.update(id, bankAccount);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.bankAccountRepository.delete(id);
  }

  async findActive(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({ where: { isActive: true } });
  }

  async toggleActive(id: number): Promise<BankAccount | null> {
    const bankAccount = await this.findOne(id);
    if (!bankAccount) return null;

    bankAccount.isActive = !bankAccount.isActive;
    await this.bankAccountRepository.save(bankAccount);
    return bankAccount;
  }
}
