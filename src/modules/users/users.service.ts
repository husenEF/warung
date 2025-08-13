import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureSuperAdmin();
  }

  createOrUpdate(user: Partial<User>): Promise<User> {
    return this.usersRepository.save(user);
  }

  async findByTelegramId(telegramId: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { telegramId } });
    return user ?? undefined;
  }

  private async ensureSuperAdmin() {
    const idStr = process.env.SUPER_ADMIN_TELEGRAM_ID;
    if (!idStr) return;
    const telegramId = parseInt(idStr, 10);
    if (isNaN(telegramId)) {
      return;
    }

    const superAdmin = await this.findByTelegramId(telegramId);
    if (!superAdmin) {
      const newSuperAdmin = this.usersRepository.create({
        telegramId,
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        role: UserRole.ADMIN,
      });
      await this.usersRepository.save(newSuperAdmin);
    }
  }
}
