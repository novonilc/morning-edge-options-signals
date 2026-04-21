# Deployment Guide

This Next.js app can be deployed to various platforms. Here are the recommended options:

## 🚀 Quick Deploy Options

### 1. **Vercel** (Recommended - Easiest)
Vercel is built by the Next.js team and offers the best experience.

#### One-Click Deploy:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/options-signals-app)

#### Manual Deploy:
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js and deploy

**Pros**: Free tier, automatic deployments, great Next.js support
**Cons**: Limited free bandwidth

### 2. **Netlify**
Good alternative with excellent Next.js support.

#### Deploy Steps:
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect your GitHub repo
4. Set build command: `npm run build`
5. Set publish directory: `.next` (Netlify handles this automatically for Next.js)

**Pros**: Generous free tier, great for static sites
**Cons**: Slightly more complex setup than Vercel

### 3. **Railway**
Excellent for full-stack apps with databases.

#### Deploy Steps:
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Railway auto-detects Next.js

**Pros**: Free tier, persistent databases, easy scaling
**Cons**: Less generous free tier than Vercel

### 4. **Render**
Simple and reliable hosting.

#### Deploy Steps:
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repo
5. Set build command: `npm run build`
6. Set start command: `npm start`

**Pros**: Free tier, persistent free tier
**Cons**: Slower cold starts

## 📁 GitHub Pages (Static Export - Limited)

For GitHub Pages, we need to create a static export since it doesn't support server-side rendering.

### Setup Static Export:

1. Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

2. Update `package.json` scripts:
```json
{
  "scripts": {
    "export": "next build",
    "deploy": "next export"
  }
}
```

3. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Export
        run: npm run export

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

**⚠️ Limitations**: No API routes, no server-side rendering, limited to static content only.

## 🐙 GitHub Actions (CI/CD)

Add this workflow for automated testing and deployment:

```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

## 🌐 Environment Variables

If you add environment variables (like API keys), create a `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Add other environment variables here
```

## 📊 Performance Optimization

Before deploying, consider:

1. **Enable compression** in `next.config.js`:
```javascript
const nextConfig = {
  reactStrictMode: true,
  compress: true,
};
```

2. **Optimize images** - already configured with Next.js Image component

3. **Enable caching** headers for API routes

## 🔧 Troubleshooting

### Build Fails
- Check Node.js version (18+ recommended)
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run lint`

### Runtime Errors
- Check browser console for errors
- Verify environment variables are set
- Check server logs on your hosting platform

### Yahoo Finance Issues
- The app works with or without `yahoo-finance2`
- Falls back to mock data automatically
- For production, ensure the package is installed

## 🎯 Recommended Deployment Order

1. **Development**: `npm run dev` locally
2. **Staging**: Deploy to Vercel/Netlify from a `staging` branch
3. **Production**: Deploy to Vercel/Netlify from `main` branch

Choose Vercel for the easiest experience, or Netlify for more control over the build process!