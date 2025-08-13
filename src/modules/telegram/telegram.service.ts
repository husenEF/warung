import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { UserRole } from '../users/user.entity';
import { Product } from '../products/product.entity';
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

interface CartItem {
  productId: number;
  productName: string;
  price: number;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf<Context>;
  private addProductSessions: Map<number, AddProductSession> = new Map();
  private carts: Map<number, CartItem[]> = new Map(); // userId -> cart items

  constructor(
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
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
    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
  }

  private async handleTextMessage(ctx: Context) {
    console.log({ handleTextMessage: ctx.message });

    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const session = this.addProductSessions.get(chatId);
    if (!session) {
      return;
    }

    let text: string | undefined = '';
    if ('text' in (ctx.message ?? {})) {
      text = (ctx.message as { text: string }).text;
    }

    console.log({ text });

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
    console.log('Sending catalog...', ctx);
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

    // Clear cart
    this.carts.delete(telegramId);

    await ctx.reply(
      `Order created successfully! 🎉\n\nOrder ID: ${order.id}\nTotal: $${order.total}\nStatus: ${order.status}`,
    );
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
}
