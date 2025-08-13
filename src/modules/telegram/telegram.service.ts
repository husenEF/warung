import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { UserRole } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { OrderStatus } from '../orders/order.entity';
import { moneyFormat } from 'src/helper/string';

interface AddProductSession {
  step: 'name' | 'description' | 'price' | 'imageUrl';
  product: {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  };
}

interface AddBankAccountSession {
  step: 'bankName' | 'accountNumber' | 'accountHolderName';
  bankAccount: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  };
}

interface CartItem {
  productId: number;
  productName: string;
  price: number;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf<Context>;
  private addProductSessions: Map<number, AddProductSession> = new Map();
  private addBankAccountSessions: Map<number, AddBankAccountSession> =
    new Map();
  private carts: Map<number, CartItem[]> = new Map(); // userId -> cart items

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new Telegraf(token);
    this.registerCommands();
    await this.bot.launch();
  }

  private registerCommands() {
    this.bot.start((ctx) => this.sendMainMenu(ctx));
    this.bot.action('catalog', (ctx) => this.sendCatalog(ctx));
    this.bot.action('cart', (ctx) => this.showCart(ctx));
    this.bot.action('orders', (ctx) => this.showOrders(ctx));
    this.bot.action(/^addToCart_(\d+)$/, (ctx) => this.addToCart(ctx));
    this.bot.action('checkout', (ctx) => this.checkout(ctx));
    this.bot.action(/^removeFromCart_(\d+)$/, (ctx) =>
      this.removeFromCart(ctx),
    );
    this.bot.action('main_menu', (ctx) => this.sendMainMenu(ctx));
    this.bot.command('addproduct', (ctx) => this.handleAddProduct(ctx));
    this.bot.command('manageorders', (ctx) => this.handleManageOrders(ctx));
    this.bot.command('bankaccounts', (ctx) => this.handleBankAccounts(ctx));
    this.bot.command('addbankaccount', (ctx) => this.handleAddBankAccount(ctx));
    this.bot.action(/^viewOrder_(\d+)$/, (ctx) => this.viewOrderDetails(ctx));
    this.bot.action(/^updateOrderStatus_(\d+)_(.+)$/, (ctx) =>
      this.updateOrderStatus(ctx),
    );
    this.bot.action('pending_orders', (ctx) => this.showPendingOrders(ctx));
    this.bot.action('all_orders', (ctx) => this.showAllOrders(ctx));
    this.bot.action('view_bank_accounts', (ctx) => this.viewBankAccounts(ctx));
    this.bot.action('add_bank_account', (ctx) =>
      this.handleAddBankAccount(ctx),
    );
    this.bot.action(/^toggleBankAccount_(\d+)$/, (ctx) =>
      this.toggleBankAccount(ctx),
    );
    this.bot.action(/^deleteBankAccount_(\d+)$/, (ctx) =>
      this.deleteBankAccount(ctx),
    );
    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
  }

  private async handleTextMessage(ctx: Context) {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    // Check for add product session
    const productSession = this.addProductSessions.get(chatId);
    if (productSession) {
      await this.handleAddProductText(ctx, productSession, chatId);
      return;
    }

    // Check for add bank account session
    const bankAccountSession = this.addBankAccountSessions.get(chatId);
    if (bankAccountSession) {
      await this.handleAddBankAccountText(ctx, bankAccountSession, chatId);
      return;
    }
  }

  private async handleAddProductText(
    ctx: Context,
    session: AddProductSession,
    chatId: number,
  ) {
    let text: string | undefined = '';
    if ('text' in (ctx.message ?? {})) {
      text = (ctx.message as { text: string }).text;
    }

    switch (session.step) {
      case 'name':
        session.product.name = text;
        session.step = 'description';
        await ctx.reply('Please enter the product description.');
        break;
      case 'description':
        session.product.description = text;
        session.step = 'price';
        await ctx.reply('Please enter the product price.');
        break;
      case 'price': {
        const price = parseFloat(text);
        if (isNaN(price)) {
          await ctx.reply('Invalid price. Please enter a number.');
          return;
        }
        session.product.price = price;
        session.step = 'imageUrl';
        await ctx.reply('Please enter the product image URL.');
        break;
      }
      case 'imageUrl':
        session.product.imageUrl = text;
        await this.productsService.create({
          name: session.product.name!,
          description: session.product.description!,
          price: session.product.price!,
          imageUrl: session.product.imageUrl,
        });
        this.addProductSessions.delete(chatId);
        await ctx.reply('Product added successfully!');
        break;
    }
  }

  private async handleAddBankAccountText(
    ctx: Context,
    session: AddBankAccountSession,
    chatId: number,
  ) {
    let text: string | undefined = '';
    if ('text' in (ctx.message ?? {})) {
      text = (ctx.message as { text: string }).text;
    }

    switch (session.step) {
      case 'bankName':
        session.bankAccount.bankName = text;
        session.step = 'accountNumber';
        await ctx.reply('Please enter the account number.');
        break;
      case 'accountNumber':
        session.bankAccount.accountNumber = text;
        session.step = 'accountHolderName';
        await ctx.reply('Please enter the account holder name.');
        break;
      case 'accountHolderName':
        session.bankAccount.accountHolderName = text;
        await this.bankAccountsService.create({
          bankName: session.bankAccount.bankName!,
          accountNumber: session.bankAccount.accountNumber!,
          accountHolderName: session.bankAccount.accountHolderName,
        });
        this.addBankAccountSessions.delete(chatId);
        await ctx.reply('Bank account added successfully!');
        await this.handleBankAccounts(ctx);
        break;
    }
  }

  private async handleAddProduct(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;
    const user = await this.usersService.findByTelegramId(telegramId);

    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) return;
    this.addProductSessions.set(chatId, {
      step: 'name',
      product: {},
    });

    await ctx.reply('Please enter the product name.');
  }

  private async sendMainMenu(ctx: Context) {
    await ctx.reply('Welcome to Warung Telegram!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'View Catalog', callback_data: 'catalog' }],
          [{ text: 'My Cart', callback_data: 'cart' }],
          [{ text: 'My Orders', callback_data: 'orders' }],
        ],
      },
    });
  }

  private async sendCatalog(ctx: Context) {
    const products = await this.productsService.findAll();
    if (products.length === 0) {
      await ctx.reply('Our catalog is empty at the moment.');
      return;
    }

    await ctx.reply('Here is our catalog:');
    for (const product of products) {
      const caption = `
        *${product.name}*
        ${product.description}
        Price: ${moneyFormat(+product.price)}
      `;

      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Add to Cart', `addToCart_${product.id}`),
      ]);
      await ctx.replyWithPhoto(
        { url: product.imageUrl },
        { caption, parse_mode: 'Markdown', ...keyboard },
      );
    }
  }

  async sendMessage(chatId: string, message: string) {
    await this.bot.telegram.sendMessage(chatId, message);
  }

  private async addToCart(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const callbackData = callbackQuery.data;
    const match = callbackData.match(/^addToCart_(\d+)$/);
    if (!match) return;

    const productId = parseInt(match[1], 10);
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const product = await this.productsService.findOne(productId);
    if (!product) {
      await ctx.answerCbQuery('Product not found');
      return;
    }

    const userCart = this.carts.get(telegramId) || [];
    const existingItem = userCart.find((item) => item.productId === productId);

    if (existingItem) {
      await ctx.answerCbQuery('Product already in cart');
    } else {
      userCart.push({
        productId,
        productName: product.name,
        price: Number(product.price),
      });
      this.carts.set(telegramId, userCart);
      await ctx.answerCbQuery('Added to cart!');
    }
    await this.showCart(ctx);
  }

  private async showCart(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const userCart = this.carts.get(telegramId) || [];
    if (userCart.length === 0) {
      await ctx.reply('Your cart is empty.');
      return;
    }

    const total = userCart.reduce((sum, item) => sum + item.price, 0);
    let cartText = '*Your Cart:*\n\n';

    userCart.forEach((item, index) => {
      cartText += `${index + 1}. ${item.productName} - ${moneyFormat(item.price)}\n`;
    });

    cartText += `\n*Total: ${moneyFormat(total)}*`;

    const keyboard = Markup.inlineKeyboard([
      userCart.map((item) =>
        Markup.button.callback(
          `Remove ${item.productName}`,
          `removeFromCart_${item.productId}`,
        ),
      ),
      [Markup.button.callback('Checkout', 'checkout')],
      [Markup.button.callback('Back to Menu', 'main_menu')],
    ]);

    await ctx.reply(cartText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async removeFromCart(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const callbackData = callbackQuery.data;
    const match = callbackData.match(/^removeFromCart_(\d+)$/);
    if (!match) return;

    const productId = parseInt(match[1], 10);
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    let userCart = this.carts.get(telegramId) || [];
    userCart = userCart.filter((item) => item.productId !== productId);
    this.carts.set(telegramId, userCart);

    await ctx.answerCbQuery('Removed from cart');
    await this.showCart(ctx);
  }

  private async checkout(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const userCart = this.carts.get(telegramId) || [];
    if (userCart.length === 0) {
      await ctx.reply('Your cart is empty.');
      return;
    }

    // Create or find user
    let user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      const username = ctx.from?.username || 'Unknown';
      const firstName = ctx.from?.first_name || 'Unknown';
      user = await this.usersService.createOrUpdate({
        telegramId,
        username,
        firstName,
        role: UserRole.USER,
      });
    }

    // Get products for the order
    const products: Product[] = [];
    for (const cartItem of userCart) {
      const product = await this.productsService.findOne(cartItem.productId);
      if (product) {
        products.push(product);
      }
    }

    if (products.length === 0) {
      await ctx.reply('No valid products found in cart.');
      return;
    }

    // Create order
    const order = await this.ordersService.create(user, products);

    // Get active bank accounts for payment information
    const bankAccounts = await this.bankAccountsService.findActive();

    // Clear cart
    this.carts.delete(telegramId);

    let orderMessage = `Order created successfully! 🎉\n\nOrder ID: ${order.id}\nTotal: ${moneyFormat(order.total)}\nStatus: ${order.status}`;

    if (bankAccounts.length > 0) {
      orderMessage +=
        '\n\n💳 *Payment Information:*\nPlease transfer to one of the following accounts:\n\n';
      bankAccounts.forEach((account, index) => {
        orderMessage += `${index + 1}. *${account.bankName}*\n`;
        orderMessage += `   Account: ${account.accountNumber}\n`;
        orderMessage += `   Name: ${account.accountHolderName}\n\n`;
      });
      orderMessage +=
        '_Please send payment confirmation to admin after transfer._';
    } else {
      orderMessage += '\n\n_Payment details will be provided by admin._';
    }

    await ctx.reply(orderMessage, { parse_mode: 'Markdown' });
    await this.sendMainMenu(ctx);
  }

  private async showOrders(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      await ctx.reply('Please place an order first.');
      return;
    }

    const orders = await this.ordersService.findByUser(user);
    if (orders.length === 0) {
      await ctx.reply('You have no orders yet.');
      return;
    }

    let ordersText = '*Your Orders:*\n\n';
    orders.forEach((order) => {
      ordersText += `Order #${order.id}\n`;
      ordersText += `Total: ${moneyFormat(order.total)}\n`;
      ordersText += `Status: ${order.status}\n`;
      ordersText += `Date: ${order.createdAt.toLocaleDateString()}\n\n`;
    });

    await ctx.reply(ordersText, { parse_mode: 'Markdown' });
  }

  // Order Management for SuperAdmin
  private async handleManageOrders(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 View Pending Orders', 'pending_orders')],
      [Markup.button.callback('📊 View All Orders', 'all_orders')],
      [Markup.button.callback('🏠 Back to Menu', 'main_menu')],
    ]);

    await ctx.reply('*Order Management Panel*\nChoose an option:', {
      parse_mode: 'Markdown',
      ...keyboard,
    });
  }

  private async showPendingOrders(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const pendingOrders = await this.ordersService.findPendingOrders();
    if (pendingOrders.length === 0) {
      await ctx.reply('No pending orders found.');
      return;
    }

    let ordersText = '*📋 Pending Orders:*\n\n';
    const buttons: any[] = [];

    for (const order of pendingOrders) {
      ordersText += `Order #${order.id}\n`;
      ordersText += `Customer: ${order.user.firstName} - ${order.user.lastName}\n`;
      ordersText += `Total: ${moneyFormat(Number(order.total))}\n`;
      ordersText += `Date: ${order.createdAt.toLocaleDateString()}\n\n`;

      buttons.push([
        Markup.button.callback(
          `📝 View Order #${order.id}`,
          `viewOrder_${order.id}`,
        ),
      ]);
    }

    buttons.push([Markup.button.callback('🏠 Back to Menu', 'main_menu')]);
    const keyboard = Markup.inlineKeyboard(
      buttons as Parameters<typeof Markup.inlineKeyboard>[0],
    );

    await ctx.reply(ordersText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showAllOrders(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const allOrders = await this.ordersService.findAll();
    if (allOrders.length === 0) {
      await ctx.reply('No orders found.');
      return;
    }

    let ordersText = '*📊 All Orders:*\n\n';
    const buttons: any[] = [];

    // Show only first 10 orders
    for (const order of allOrders.slice(0, 10)) {
      ordersText += `Order #${order.id}\n`;
      ordersText += `Customer: ${order.user.firstName}\n`;
      ordersText += `Total: ${moneyFormat(Number(order.total))}\n`;
      ordersText += `Status: ${order.status.toUpperCase()}\n`;
      ordersText += `Date: ${order.createdAt.toLocaleDateString()}\n\n`;

      buttons.push([
        Markup.button.callback(
          `📝 View Order #${order.id}`,
          `viewOrder_${order.id}`,
        ),
      ]);
    }

    if (allOrders.length > 10) {
      ordersText += `_... and ${allOrders.length - 10} more orders_\n\n`;
    }

    buttons.push([Markup.button.callback('🏠 Back to Menu', 'main_menu')]);
    const keyboard = Markup.inlineKeyboard(
      buttons as Parameters<typeof Markup.inlineKeyboard>[0],
    );

    await ctx.reply(ordersText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async viewOrderDetails(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const callbackData = callbackQuery.data;
    const match = callbackData.match(/^viewOrder_(\d+)$/);
    if (!match) return;

    const orderId = parseInt(match[1], 10);
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.answerCbQuery("You don't have permission to do that.");
      return;
    }

    const order = await this.ordersService.findById(orderId);
    if (!order) {
      await ctx.answerCbQuery('Order not found');
      return;
    }

    let orderText = `*📦 Order Details #${order.id}*\n\n`;
    orderText += `👤 Customer: ${order.user.firstName}\n`;
    orderText += `📱 Telegram: @${order.user.username || 'N/A'}\n`;
    orderText += `📅 Date: ${order.createdAt.toLocaleDateString()}\n`;
    orderText += `💰 Total: ${moneyFormat(Number(order.total))}\n`;
    orderText += `📋 Status: ${order.status.toUpperCase()}\n\n`;
    orderText += `*🛍️ Products:*\n`;

    order.products.forEach((product, index) => {
      orderText += `${index + 1}. ${product.name} - ${moneyFormat(+product.price)}\n`;
    });

    const statusButtons: any[] = [];

    // Only show status change buttons if order is not delivered or canceled
    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.CANCELED
    ) {
      if (order.status === OrderStatus.PENDING) {
        statusButtons.push([
          Markup.button.callback(
            '✅ Mark as Paid',
            `updateOrderStatus_${order.id}_paid`,
          ),
        ]);
      }
      if (order.status === OrderStatus.PAID) {
        statusButtons.push([
          Markup.button.callback(
            '🚚 Mark as Shipped',
            `updateOrderStatus_${order.id}_shipped`,
          ),
        ]);
      }
      if (order.status === OrderStatus.SHIPPED) {
        statusButtons.push([
          Markup.button.callback(
            '📦 Mark as Delivered',
            `updateOrderStatus_${order.id}_delivered`,
          ),
        ]);
      }
      statusButtons.push([
        Markup.button.callback(
          '❌ Cancel Order',
          `updateOrderStatus_${order.id}_canceled`,
        ),
      ]);
    }

    statusButtons.push([
      Markup.button.callback('📋 Back to Orders', 'pending_orders'),
      Markup.button.callback('🏠 Main Menu', 'main_menu'),
    ]);

    const keyboard = Markup.inlineKeyboard(
      statusButtons as Parameters<typeof Markup.inlineKeyboard>[0],
    );
    await ctx.reply(orderText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async updateOrderStatus(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const callbackData = callbackQuery.data;
    const match = callbackData.match(/^updateOrderStatus_(\d+)_(.+)$/);
    if (!match) return;

    const orderId = parseInt(match[1], 10);
    const newStatus = match[2] as OrderStatus;
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.answerCbQuery("You don't have permission to do that.");
      return;
    }

    const updatedOrder = await this.ordersService.updateOrderStatus(
      orderId,
      newStatus,
    );
    if (!updatedOrder) {
      await ctx.answerCbQuery('Failed to update order');
      return;
    }

    // Notify customer about status change
    const customerTelegramId = updatedOrder.user.telegramId;
    const statusMessage = `🔔 *Order Update*\n\nYour order #${updatedOrder.id} status has been updated to: *${newStatus.toUpperCase()}*\n\nTotal: ${moneyFormat(Number(updatedOrder.total))}`;

    try {
      await this.bot.telegram.sendMessage(customerTelegramId, statusMessage, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      console.error('Failed to notify customer:', error);
    }

    await ctx.answerCbQuery(`Order status updated to ${newStatus}`);

    // Refresh the order details view
    await this.viewOrderDetails(ctx);
  }

  // Bank Account Management for SuperAdmin
  private async handleBankAccounts(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💳 View Bank Accounts', 'view_bank_accounts')],
      [Markup.button.callback('➕ Add Bank Account', 'add_bank_account')],
      [Markup.button.callback('🏠 Back to Menu', 'main_menu')],
    ]);

    await ctx.reply('*Bank Account Management*\nChoose an option:', {
      parse_mode: 'Markdown',
      ...keyboard,
    });
  }

  private async handleAddBankAccount(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) return;

    this.addBankAccountSessions.set(chatId, {
      step: 'bankName',
      bankAccount: {},
    });

    await ctx.reply('Please enter the bank name (e.g., BCA, Mandiri, BNI).');
  }

  private async viewBankAccounts(ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.reply("You don't have permission to do that.");
      return;
    }

    const bankAccounts = await this.bankAccountsService.findAll();
    if (bankAccounts.length === 0) {
      await ctx.reply('No bank accounts found.');
      return;
    }

    let accountsText = '*💳 Bank Accounts:*\n\n';
    const buttons: any[] = [];

    bankAccounts.forEach((account) => {
      const status = account.isActive ? '✅ Active' : '❌ Inactive';
      accountsText += `*${account.bankName}*\n`;
      accountsText += `Account: ${account.accountNumber}\n`;
      accountsText += `Name: ${account.accountHolderName}\n`;
      accountsText += `Status: ${status}\n\n`;

      buttons.push([
        Markup.button.callback(
          account.isActive
            ? `❌ Deactivate ${account.bankName}`
            : `✅ Activate ${account.bankName}`,
          `toggleBankAccount_${account.id}`,
        ),
        Markup.button.callback(`🗑️ Delete`, `deleteBankAccount_${account.id}`),
      ]);
    });

    buttons.push([Markup.button.callback('🏠 Back to Menu', 'main_menu')]);
    const keyboard = Markup.inlineKeyboard(
      buttons as Parameters<typeof Markup.inlineKeyboard>[0],
    );

    await ctx.reply(accountsText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async toggleBankAccount(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const callbackData = callbackQuery.data;
    const match = callbackData.match(/^toggleBankAccount_(\d+)$/);
    if (!match) return;

    const accountId = parseInt(match[1], 10);
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.answerCbQuery("You don't have permission to do that.");
      return;
    }

    const updatedAccount =
      await this.bankAccountsService.toggleActive(accountId);
    if (!updatedAccount) {
      await ctx.answerCbQuery('Bank account not found');
      return;
    }

    const status = updatedAccount.isActive ? 'activated' : 'deactivated';
    await ctx.answerCbQuery(`Bank account ${status}`);

    // Refresh the bank accounts view
    await this.viewBankAccounts(ctx);
  }

  private async deleteBankAccount(ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const callbackData = callbackQuery.data;
    const match = callbackData.match(/^deleteBankAccount_(\d+)$/);
    if (!match) return;

    const accountId = parseInt(match[1], 10);
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user || user.role !== UserRole.ADMIN) {
      await ctx.answerCbQuery("You don't have permission to do that.");
      return;
    }

    await this.bankAccountsService.remove(accountId);
    await ctx.answerCbQuery('Bank account deleted');

    // Refresh the bank accounts view
    await this.viewBankAccounts(ctx);
  }
}
