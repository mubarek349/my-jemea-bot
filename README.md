# Jemea Bot - Professional Telegram Bot Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=prisma&logoColor=white)](https://www.prisma.io/)

A comprehensive Telegram bot management platform built with Next.js, TypeScript, and Prisma. Manage your Telegram bot with ease through a modern web dashboard, automated messaging, user management, and real-time analytics.

## ✨ Features

### 🤖 Bot Management
- **Automated Messaging**: Send scheduled messages to users or groups
- **User Management**: Register, track, and manage bot users
- **Admin Controls**: Promote/demote users, manage permissions
- **Real-time Statistics**: Monitor bot performance and user engagement

### 🌐 Web Dashboard
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Admin Panel**: Comprehensive dashboard for bot management
- **Message Composer**: Rich text editor for creating messages
- **Analytics**: Detailed statistics and performance metrics
- **User Management**: View and manage registered users

### 🔧 Technical Features
- **TypeScript**: Full type safety and better developer experience
- **Database**: MySQL with Prisma ORM for data persistence
- **Authentication**: Secure admin authentication with NextAuth.js
- **Rate Limiting**: Built-in protection against spam and abuse
- **Error Handling**: Comprehensive error tracking and recovery
- **Scheduling**: Cron-based message scheduling system

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MySQL database
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/jemea-bot.git
   cd jemea-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/jemea_bot"
   
   # Telegram Bot
   TELEGRAM_BOT_TOKEN="your_bot_token_here"
   TELEGRAM_GROUP_ID="your_group_id_here" # Optional
   
   # NextAuth
   NEXTAUTH_SECRET="your_secret_here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Admin Panel
   ADMIN_PANEL_URL="http://localhost:3000/admin"
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**
```bash
npm run dev
   ```

6. **Start the bot**
   ```bash
   npm run bot
   ```

Visit [http://localhost:3000](http://localhost:3000) to access the web dashboard.

## 📖 Documentation

### Bot Commands

#### User Commands
- `/start` - Register with the bot
- `/help` - Show available commands
- `/status` - Check your account status

#### Admin Commands
- `/users` - List all registered users
- `/promote @username` - Promote user to admin
- `/demote @username` - Demote admin to user
- `/stats` - View bot statistics
- `/checkchats` - Check chat connectivity
- `/retryfailed` - Retry failed messages
- `/time` - Show system time information

### API Endpoints

#### Messages
- `GET /api/messages` - Get all messages
- `POST /api/messages` - Create a new message
- `GET /api/messages/[id]` - Get specific message
- `PUT /api/messages/[id]` - Update message
- `DELETE /api/messages/[id]` - Delete message

### Database Schema

#### Users Table
```sql
- id: String (Primary Key)
- chatId: String (Unique)
- username: String (Optional)
- firstName: String (Optional)
- lastName: String (Optional)
- isAdmin: Boolean
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### Messages Table
```sql
- id: String (Primary Key)
- content: String (Text)
- title: String (Optional)
- senderId: String (Foreign Key)
- scheduledFor: DateTime (Optional)
- sent: Boolean
- errorMessage: String (Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
jemea-bot/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── prisma/                # Database schema and migrations
├── services/              # Business logic services
├── actions/               # Server actions
├── botNew.ts             # Main bot implementation
├── botSingle.ts          # Bot startup script
└── middleware.ts         # Next.js middleware
```

## 🔒 Security

- **Authentication**: Secure admin authentication with NextAuth.js
- **Rate Limiting**: Built-in protection against spam and abuse
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **Environment Variables**: Sensitive data stored in environment variables

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

- `DATABASE_URL` - Your production database connection string
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `NEXTAUTH_SECRET` - A secure random string
- `NEXTAUTH_URL` - Your production URL
- `ADMIN_PANEL_URL` - Your admin panel URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/jemea-bot/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Grammy](https://grammy.dev/) - Telegram Bot API framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Heroicons](https://heroicons.com/) - Beautiful icons

---

Made with ❤️ by the Jemea Bot Team