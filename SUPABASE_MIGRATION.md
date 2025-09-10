# Supabase Migration Guide

This guide will help you migrate your existing Next.js + TypeORM + PostgreSQL project to use Supabase as your cloud PostgreSQL database.

## 🚀 What's Been Updated

### 1. Configuration Files
- ✅ `ormconfig.ts` - Updated for Supabase connection string
- ✅ `src/lib/database.ts` - Enhanced connection management
- ✅ `next.config.ts` - Added Supabase optimizations
- ✅ `env.example` - Updated with Supabase variables

### 2. New Features
- ✅ `/api/test-db` endpoint for connection testing
- ✅ Enhanced error handling for cloud deployments
- ✅ Connection pooling for serverless environments
- ✅ SSL configuration for production

## 📋 Migration Steps

### Step 1: Set Up Supabase Project

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create a new project

2. **Get Database Connection String**
   - Go to Project Settings → Database
   - Copy the connection string (URI format)

### Step 2: Update Environment Variables

1. **Copy environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Update `.env.local` with your Supabase details:**
   ```env
   # Supabase Database Configuration
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   
   # Optional: Supabase Client (for future features)
   SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # App Configuration
   NODE_ENV=development
   ```

### Step 3: Test Database Connection

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the connection:**
   ```bash
   # Health check
   curl http://localhost:3000/api/test-db
   
   # Detailed test
   curl -X POST http://localhost:3000/api/test-db \
     -H "Content-Type: application/json" \
     -d '{"action": "ping"}'
   ```

### Step 4: Generate and Run Migrations

1. **Generate initial migration:**
   ```bash
   npm run db:generate
   ```

2. **Run migrations:**
   ```bash
   npm run db:run
   ```

## 🔧 Configuration Details

### TypeORM Configuration (`ormconfig.ts`)

The configuration now includes:
- **SSL Support**: Automatic SSL for production environments
- **Connection Pooling**: Optimized for serverless deployments
- **Timeouts**: 30-second connection and idle timeouts
- **Environment-based Logging**: Reduced logging in production

### Database Connection (`src/lib/database.ts`)

Enhanced features:
- **Connection Management**: Prevents multiple simultaneous initializations
- **Health Checks**: Built-in database health monitoring
- **Error Handling**: Better error reporting for cloud environments

### API Testing Endpoint (`/api/test-db`)

Two testing methods:
- **GET**: Simple health check
- **POST**: Detailed connection test with database info

## 🌐 Supabase Connection String Format

Your Supabase connection string should look like:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Example:**
```
postgresql://postgres:mypassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## 🚨 Important Notes

### SSL Configuration
- **Development**: SSL disabled for local development
- **Production**: SSL enabled with `rejectUnauthorized: false`

### Connection Limits
- **Max Connections**: 20 (configurable via environment variables)
- **Timeout**: 30 seconds for connection and idle

### Environment Variables
- **Required**: `DATABASE_URL`
- **Optional**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## 🧪 Testing Your Migration


## 🔍 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check your `DATABASE_URL` format
   - Verify Supabase project is active
   - Check firewall settings

2. **SSL Errors**
   - Ensure `NODE_ENV` is set correctly
   - Check SSL configuration in `ormconfig.ts`

3. **Authentication Failed**
   - Verify password in connection string
   - Check if database user exists in Supabase

4. **Timeout Errors**
   - Increase timeout values in `ormconfig.ts`
   - Check network connectivity

### Debug Commands

```bash
# Check environment variables
echo $DATABASE_URL

# Test database connection manually
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# View TypeORM logs
NODE_ENV=development npm run dev
```

## 🚀 Next Steps

After successful migration:

1. **Deploy to Production**
   - Set production environment variables
   - Ensure SSL is enabled
   - Test production connection

2. **Monitor Performance**
   - Use Supabase dashboard for monitoring
   - Check connection pool usage
   - Monitor query performance

3. **Future Enhancements**
   - Add Supabase client for real-time features
   - Implement Row Level Security (RLS)
   - Use Supabase Auth if needed

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment variables
3. Test with the `/api/test-db` endpoint
4. Check Supabase project status
5. Review TypeORM logs in development mode

Your migration to Supabase is now complete! 🎉
