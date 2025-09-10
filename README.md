# Article Feeds App

A full-stack Next.js application with TypeORM and PostgreSQL for managing articles and user preferences.

## Features

- 🔐 JWT Authentication System
- 📝 Article Management (CRUD operations)
- 🏷️ Category Management
- 👤 User Profile Management
- ⭐ User Preferences
- 👍 Article Interactions (Like/Dislike/Block)
- 📁 File Upload (Cloudinary integration)
- 🎨 Responsive UI with Tailwind CSS
- 🗄️ PostgreSQL Database with TypeORM

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeORM
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **State Management**: React Query (TanStack Query)

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd article-feeds-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=article_feeds
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb article_feeds
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE article_feeds;
   ```

5. **Run database migrations**
   ```bash
   # Generate initial migration
   npm run db:generate
   
   # Run migrations
   npm run db:run
   ```

6. **Start the development server**
```bash
npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migration
- `npm run db:run` - Run database migrations
- `npm run db:revert` - Revert last migration
- `npm run db:show` - Show migration status
- `npm run db:sync` - Sync database schema

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Articles
- `GET /api/articles` - List articles (with pagination and filters)
- `POST /api/articles` - Create article
- `GET /api/articles/[id]` - Get article by ID
- `PUT /api/articles/[id]` - Update article
- `DELETE /api/articles/[id]` - Delete article

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/preferences` - Get user preferences
- `POST /api/users/preferences` - Add preference
- `DELETE /api/users/preferences` - Remove preference

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

### File Upload
- `POST /api/upload` - Upload file to Cloudinary

## Database Schema

### Users
- id (UUID, Primary Key)
- firstName, lastName, phone, email
- dateOfBirth, password
- createdAt, updatedAt

### Categories
- id (UUID, Primary Key)
- name, description
- createdAt, updatedAt

### Articles
- id (UUID, Primary Key)
- title, description, content
- imageUrl, tags
- authorId, categoryId (Foreign Keys)
- createdAt, updatedAt

### UserPreferences
- id (UUID, Primary Key)
- userId, categoryId (Foreign Keys)
- createdAt


## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── articles/  # Article endpoints
│   │   ├── users/     # User endpoints
│   │   ├── categories/# Category endpoints
│   │   └── upload/    # File upload endpoint
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── entities/           # TypeORM entities
├── lib/               # Utility libraries
├── middleware/        # Authentication middleware
└── types/             # TypeScript type definitions
```

## Development

### Adding New Entities

1. Create entity file in `src/entities/`
2. Add to `ormconfig.ts`
3. Generate and run migration
4. Create corresponding API routes

### Authentication

The app uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Error Handling

All API endpoints include proper error handling and return appropriate HTTP status codes with error messages.

## Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Start production server: `npm run start`
4. Ensure PostgreSQL is accessible from your deployment environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
