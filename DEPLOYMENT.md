# Deployment Guide for University Portal

## Prerequisites

1. **Database Setup**: You'll need a MySQL database. Recommended options:
   - [PlanetScale](https://planetscale.com/) (Free tier available)
   - [Railway](https://railway.app/) (MySQL service)
   - [Aiven](https://aiven.io/) (MySQL service)

2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Step 1: Database Setup (PlanetScale Recommended)

### Using PlanetScale:
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database named `studentportal`
3. Get your connection details from the dashboard
4. Note down:
   - Host
   - Username
   - Password
   - Database name

### Database Schema:
The application will automatically create tables on first run. The schema includes:
- users (students, admins)
- hostels, rooms
- books, borrowings
- courses, enrollments
- requests, notifications
- announcements
- appointments, services

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

## Step 3: Environment Variables

In your Vercel dashboard, go to Settings > Environment Variables and add:

```
DB_HOST=your-database-host
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=studentportal
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

**Important**: 
- Use a strong, unique JWT_SECRET (at least 32 characters)
- Keep your database credentials secure

## Step 4: Domain Configuration

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain (optional)
3. Vercel will provide a `.vercel.app` domain by default

## Step 5: Test Deployment

1. Visit your deployed URL
2. Try to register a new account
3. Login with admin credentials:
   - Email: `admin@university.edu`
   - Password: `admin123`

## Step 6: Post-Deployment Setup

### Create Admin Account:
1. The system creates a default admin on first run
2. Login and change the default password immediately
3. Create additional admin accounts as needed

### Configure Application:
1. Add hostels and rooms
2. Add courses
3. Add books to library
4. Configure services for appointments

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Check environment variables
   - Ensure database is accessible from Vercel
   - Verify SSL settings if required

2. **Build Errors**:
   - Check Node.js version (should be 18+)
   - Clear cache: `vercel --prod --force`

3. **API Routes Not Working**:
   - Check `vercel.json` configuration
   - Verify API routes are in `/api` directory

4. **CORS Issues**:
   - API is configured for same-origin requests
   - No additional CORS setup needed

### Performance Optimization:

1. **Database**:
   - Use connection pooling
   - Add indexes for frequently queried fields
   - Consider read replicas for high traffic

2. **Frontend**:
   - Images are optimized automatically
   - Code splitting is configured
   - Static assets are cached

## Monitoring

1. **Vercel Analytics**: Enable in dashboard for performance insights
2. **Error Tracking**: Check Vercel Functions logs for API errors
3. **Database Monitoring**: Use your database provider's monitoring tools

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **JWT Secret**: Use a strong, unique secret
3. **Database**: Use strong passwords and enable SSL
4. **HTTPS**: Vercel provides HTTPS by default
5. **Rate Limiting**: Consider adding rate limiting for production

## Scaling

1. **Database**: Upgrade plan as needed
2. **Vercel**: Pro plan for higher limits
3. **CDN**: Vercel provides global CDN automatically
4. **Caching**: Implement Redis for session storage if needed

## Support

For deployment issues:
- Check Vercel documentation
- Review build logs in Vercel dashboard
- Contact support if needed

For application issues:
- Check server logs in Vercel Functions
- Review database logs
- Test API endpoints directly