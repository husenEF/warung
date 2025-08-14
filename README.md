# 🏪 Warung Telegram Bot

A modern e-commerce Telegram bot built with NestJS, featuring product catalog, shopping cart, order management, and cloud storage integration.

## ✨ Features

- 🤖 **Telegram Bot Interface** - User-friendly bot interaction
- 🛍️ **Product Management** - Add/view products with images
- 🛒 **Shopping Cart** - Add/remove items, checkout functionality  
- 📦 **Order Management** - Track orders, admin processing
- 💳 **Payment Information** - Bank account management for payments
- ☁️ **Cloud Storage** - Cloudflare R2 integration for images
- 🔐 **User Roles** - Admin and customer role management
- 📊 **Order Status Tracking** - Real-time order updates
- 🚀 **Production Ready** - Direct deployment with PM2/systemd

## 🛠️ Tech Stack

- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Bot Framework**: Telegraf
- **Storage**: Cloudflare R2
- **Deployment**: Direct VPS/Cloud deployment
- **ORM**: TypeORM
- **Process Manager**: PM2 / systemd

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL
- Telegram Bot Token
- Cloudflare R2 Account (optional)

### Local Development

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd warung_telegram
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**:
   ```bash
   # Install and start PostgreSQL
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Create database and user (see DEPLOYMENT.md for details)
   sudo -u postgres createdb warung_telegram
   ```

4. **Start Development**:
   ```bash
   npm run start:dev
   ```

## � Production Deployment

### Direct Server Deployment

```bash
# Build the application
npm run build

# Start with production server
npm start

# Or use the startup script
./start.sh

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

### VPS/Cloud Server Setup

1. **Prepare Environment**:
   ```bash
   # Copy and configure environment
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   npm run build
   ```

3. **Start Production Server**:
   ```bash
   # Using production server wrapper
   npm start
   
   # Using PM2 process manager
   pm2 start ecosystem.config.js
   
   # Using startup script
   ./start.sh
   ```

📖 **Detailed Instructions**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_HOST` | PostgreSQL host | ✅ | `localhost` |
| `DATABASE_USER` | Database username | ✅ | `user` |
| `DATABASE_PASSWORD` | Database password | ✅ | `password` |
| `DATABASE_NAME` | Database name | ✅ | `warung_telegram` |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | ✅ | `123456:ABC-DEF...` |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | ⚠️ | `https://account.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 access key | ⚠️ | `your_access_key` |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | ⚠️ | `your_secret_key` |
| `R2_BUCKET_NAME` | R2 bucket name | ⚠️ | `warung-telegram` |
| `R2_PUBLIC_URL` | Public URL for images | ⚠️ | `https://images.yourdomain.com` |

⚠️ = Required for image upload functionality

### Cloudflare R2 Setup

For image storage functionality, set up Cloudflare R2:

📖 **Setup Guide**: See [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md)

## 🤖 Bot Commands

### User Commands
- `/start` - Start the bot and show main menu
- `View Catalog` - Browse available products
- `My Cart` - View and manage shopping cart
- `My Orders` - View order history

### Admin Commands
- `/addproduct` - Add new product with image
- `/manageorders` - View and process orders
- `/bankaccounts` - Manage payment accounts

## 📱 Features Overview

### 🛍️ Shopping Experience
- Browse product catalog with images
- Add products to cart
- Remove items from cart
- Checkout with payment information
- Order tracking and notifications

### 👥 User Management
- Automatic user registration
- Role-based permissions (Admin/User)
- Order history tracking

### 📦 Order Management
- Order status tracking (Pending → Paid → Shipped → Delivered)
- Admin order processing panel
- Customer notifications for status changes
- Order details and product listings

### 💳 Payment Integration
- Bank account management
- Payment information display during checkout
- Active/inactive account management

### ☁️ Cloud Storage
- Automatic image upload to Cloudflare R2
- Global CDN delivery
- Cost-effective storage solution
- Public URL generation

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Project Structure

```
src/
├── modules/
│   ├── telegram/          # Bot logic and handlers
│   ├── products/          # Product management
│   ├── orders/            # Order processing
│   ├── users/             # User management
│   └── bank-accounts/     # Payment accounts
├── utils/
│   └── cloudflare-r2.service.ts  # R2 integration
├── helper/
│   └── string.ts          # Utility functions
└── main.ts                # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is [UNLICENSED](LICENSE).

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
