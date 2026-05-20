# Deployment Guide

This guide covers deploying the AidLink frontend application to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 20+ installed
- npm or yarn package manager
- Git repository access
- Environment variables configured
- Stellar network access (testnet or mainnet)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Stellar Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Contract Addresses
NEXT_PUBLIC_AID_TOKEN_CONTRACT=your_contract_id
NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT=your_contract_id
NEXT_PUBLIC_BENEFICIARY_REGISTRY_CONTRACT=your_contract_id

# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-url.com/api
NEXT_PUBLIC_WS_URL=wss://your-websocket-url.com

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
```

## Vercel Deployment

### Automatic Deployment

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel settings
4. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Vercel Configuration

The `vercel.json` file includes:

- Build command: `npm run build`
- Output directory: `.next`
- Environment variables
- Headers configuration
- Redirects configuration

## Docker Deployment

### Build Docker Image

```bash
# Build image
docker build -t aidlink-frontend:latest .

# Tag image
docker tag aidlink-frontend:latest your-registry/aidlink-frontend:latest

# Push to registry
docker push your-registry/aidlink-frontend:latest
```

### Run Docker Container

```bash
# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_STELLAR_NETWORK=testnet \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  aidlink-frontend:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_STELLAR_NETWORK=testnet
      - NEXT_PUBLIC_API_URL=https://api.example.com
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Manual Deployment

### Build Application

```bash
# Install dependencies
npm ci

# Build application
npm run build

# Start production server
npm start
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "aidlink-frontend" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Using Nginx

Configure Nginx reverse proxy:

```nginx
server {
    listen 80;
    server_name aidlink.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:

- Linting and type checking
- Unit testing with coverage
- Build verification
- E2E testing with Playwright
- Artifact upload for debugging

### Adding Deployment to CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoring

### Application Monitoring

Set up monitoring for:

- Performance metrics
- Error tracking (Sentry)
- User analytics (Google Analytics)
- Uptime monitoring

### Log Management

Configure log aggregation:

```javascript
// next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}
```

## Troubleshooting

### Build Errors

**Issue: Build fails due to missing dependencies**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm ci
```

**Issue: TypeScript errors**

```bash
# Check TypeScript configuration
npm run type-check

# Fix automatically
npm run lint -- --fix
```

### Runtime Errors

**Issue: Environment variables not loading**

- Ensure variables are prefixed with `NEXT_PUBLIC_`
- Restart the development server after adding variables
- Check `.env.local` is in `.gitignore`

**Issue: Wallet connection fails**

- Verify Stellar network configuration
- Check contract addresses are correct
- Ensure RPC URL is accessible

### Performance Issues

**Issue: Slow page load times**

- Enable image optimization
- Implement code splitting
- Use Next.js caching
- Optimize bundle size

**Issue: High memory usage**

- Check for memory leaks
- Optimize React components
- Use React.memo for expensive components
- Implement virtual scrolling for large lists

## Security Best Practices

- Never commit `.env.local` files
- Use HTTPS in production
- Implement rate limiting
- Keep dependencies updated
- Regular security audits
- Use Content Security Policy (CSP)
- Enable HTTP Strict Transport Security (HSTS)

## Support

For deployment issues:

1. Check the [GitHub Issues](https://github.com/BarryArinze/aidlink-frontend/issues)
2. Review the [API Documentation](./API.md)
3. Consult the [Architecture Guide](./ARCHITECTURE.md)
4. Contact the development team
