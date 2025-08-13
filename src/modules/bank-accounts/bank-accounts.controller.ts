import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccount } from './bank-account.entity';

@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  create(@Body() bankAccount: BankAccount): Promise<BankAccount> {
    return this.bankAccountsService.create(bankAccount);
  }

  @Get()
  findAll(): Promise<BankAccount[]> {
    return this.bankAccountsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BankAccount> {
    const bankAccount = await this.bankAccountsService.findOne(+id);
    if (!bankAccount) {
      throw new NotFoundException(`Bank account with id ${id} not found`);
    }
    return bankAccount;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() bankAccount: BankAccount,
  ): Promise<BankAccount> {
    const updatedBankAccount = await this.bankAccountsService.update(
      +id,
      bankAccount,
    );
    if (!updatedBankAccount) {
      throw new NotFoundException(`Bank account with id ${id} not found`);
    }
    return updatedBankAccount;
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.bankAccountsService.remove(+id);
  }
}
