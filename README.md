# 📰 Article Feeds App

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> A modern, full-stack article management platform built with Next.js 15, TypeORM, and PostgreSQL. Create, manage, and discover articles with a robust authentication system and personalized user preferences.

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📖 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#️-database-schema)
- [🏗️ Project Structure](#️-project-structure)
- [🔧 Development](#-development)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure token-based authentication system
- **Password Reset** - Email-based password recovery with OTP verification
- **Email Verification** - Account verification system
- **Protected Routes** - Route-level authentication guards

### 📝 Content Management
- **Article CRUD Operations** - Create, read, update, and delete articles
- **Rich Text Editor** - Full-featured article content editor
- **Image Upload** - Cloudinary integration for media management
- **Category Management** - Organize articles with custom categories
- **Tag System** - Flexible tagging for better content organization

### 👤 User Experience
- **User Profiles** - Comprehensive profile management
- **Personalized Preferences** - Custom category preferences
- **Article Interactions** - Like, dislike, and block functionality
- **Responsive Design** - Mobile-first, responsive UI
- **Dark/Light Theme** - Theme switching capability

### 🎨 Modern UI/UX
- **Tailwind CSS** - Utility-first CSS framework
- **Component Library** - Reusable UI components
- **Loading States** - Smooth loading indicators
- **Error Handling** - User-friendly error messages
- **Search & Filter** - Advanced content discovery

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Serverless API endpoints
- **[TypeORM](https://typeorm.io/)** - TypeScript ORM for database operations
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database

### External Services
- **[Cloudinary](https://cloudinary.com/)** - Image and video management
- **[JWT](https://jwt.io/)** - JSON Web Tokens for authentication
- **[Nodemailer](https://nodemailer.com/)** - Email delivery service

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **PostgreSQL** 12.0 or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/article-feeds-app.git
   cd article-feeds-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Configure your environment variables in `.env.local`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_secure_password
   DB_NAME=article_feeds
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
   JWT_REFRESH_SECRET=your_refresh_token_secret_key
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb article_feeds
   
   # Or using psql
   psql -U postgres -c "CREATE DATABASE article_feeds;"
   ```

5. **Run Database Migrations**
   ```bash
   # Generate initial migration
   npm run db:generate
   
   # Apply migrations
   npm run db:run
   ```

6. **Start Development Server**
```bash
npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | User registration | ❌ |
| `POST` | `/api/auth/login` | User login | ❌ |
| `POST` | `/api/auth/logout` | User logout | ✅ |
| `POST` | `/api/auth/refresh` | Refresh access token | ❌ |
| `POST` | `/api/auth/forgot-password` | Request password reset | ❌ |
| `POST` | `/api/auth/reset-password` | Reset password | ❌ |
| `POST` | `/api/auth/verify-reset-otp` | Verify reset OTP | ❌ |

### Article Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/articles` | List articles (paginated) | ❌ |
| `POST` | `/api/articles` | Create new article | ✅ |
| `GET` | `/api/articles/[id]` | Get article by ID | ❌ |
| `PUT` | `/api/articles/[id]` | Update article | ✅ |
| `DELETE` | `/api/articles/[id]` | Delete article | ✅ |
| `POST` | `/api/articles/bulk-delete` | Bulk delete articles | ✅ |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/users/profile` | Get user profile | ✅ |
| `PUT` | `/api/users/profile` | Update user profile | ✅ |
| `POST` | `/api/users/profile/upload` | Upload profile picture | ✅ |
| `GET` | `/api/users/preferences` | Get user preferences | ✅ |
| `POST` | `/api/users/preferences` | Add preference | ✅ |
| `DELETE` | `/api/users/preferences` | Remove preference | ✅ |
| `PUT` | `/api/users/change-password` | Change password | ✅ |

### Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/categories` | List categories | ❌ |
| `POST` | `/api/categories` | Create category | ✅ |
| `POST` | `/api/upload` | Upload file to Cloudinary | ✅ |
| `GET` | `/api/dashboard` | Dashboard statistics | ✅ |

### Authentication Header

Include the JWT token in the Authorization header for protected endpoints:

```http
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Articles Table
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  tags TEXT[],
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);
```

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── articles/             # Article management
│   │   │   ├── [id]/
│   │   │   └── bulk-delete/
│   │   ├── users/                # User management
│   │   │   ├── profile/
│   │   │   ├── preferences/
│   │   │   └── change-password/
│   │   ├── categories/           # Category management
│   │   └── upload/               # File upload
│   ├── (auth)/                   # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── articles/                 # Article pages
│   │   ├── [id]/
│   │   ├── create/
│   │   ├── edit/
│   │   └── list/
│   ├── dashboard/                # Dashboard
│   ├── profile/                  # User profile
│   ├── settings/                 # User settings
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── CommandPalette.tsx
│   └── ui/                       # UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── LoadingSpinner.tsx
├── contexts/                     # React contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── QueryProvider.tsx
├── entities/                     # TypeORM entities
│   ├── User.ts
│   ├── Article.ts
│   ├── Category.ts
│   └── UserPreference.ts
├── hooks/                        # Custom React hooks
│   ├── useArticles.ts
│   ├── useUser.ts
│   └── useInteractions.ts
├── lib/                          # Utility libraries
│   ├── database.ts
│   ├── jwt.ts
│   ├── email.ts
│   └── utils.ts
├── schemas/                      # Validation schemas
│   ├── auth/
│   ├── articles/
│   └── user/
└── types/                        # TypeScript definitions
    ├── api.ts
    ├── auth.ts
    ├── article.ts
    └── user.ts
```

## 🔧 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate database migration |
| `npm run db:run` | Run database migrations |
| `npm run db:revert` | Revert last migration |
| `npm run db:show` | Show migration status |
| `npm run db:sync` | Sync database schema |

### Adding New Features

1. **Create Entity**
   ```bash
   # Create new entity in src/entities/
   # Add to ormconfig.ts
   npm run db:generate
   npm run db:run
   ```

2. **Create API Routes**
   ```bash
   # Add new route in src/app/api/
   # Follow existing patterns for error handling
   ```

3. **Create Frontend Components**
   ```bash
   # Add components in src/components/
   # Create pages in src/app/
   ```

### Code Style

- **ESLint** configuration for code quality
- **TypeScript** strict mode enabled
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | Database host | ✅ |
| `DB_PORT` | Database port | ✅ |
| `DB_USERNAME` | Database username | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `DB_NAME` | Database name | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `EMAIL_HOST` | SMTP host | ❌ |
| `EMAIL_PORT` | SMTP port | ❌ |
| `EMAIL_USER` | SMTP username | ❌ |
| `EMAIL_PASS` | SMTP password | ❌ |

## 🚀 Deployment

### Production Build

```bash
# Install dependencies
npm ci

# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup

1. Set production environment variables
2. Configure PostgreSQL database
3. Set up Cloudinary account
4. Configure email service (optional)

### Deployment Platforms

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**

### Docker Deployment

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

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure all tests pass

### Reporting Issues

- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include environment information
- Add screenshots if applicable

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [TypeORM](https://typeorm.io/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Cloudinary](https://cloudinary.com/) - Media management

---

<div align="center">
  <p>Made with ❤️ by the Article Feeds Team</p>
  <p>
    <a href="#-article-feeds-app">⬆️ Back to Top</a>
  </p>
</div>
