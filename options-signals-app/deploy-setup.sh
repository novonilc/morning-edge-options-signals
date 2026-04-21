#!/bin/bash

# Deployment setup script for Options Signals App
# This script helps prepare your app for deployment

echo "🚀 Options Signals App - Deployment Setup"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: Please run this script from the options-signals-app directory"
    exit 1
fi

echo "📦 Checking dependencies..."
if command -v npm &> /dev/null; then
    echo "✅ npm found"
else
    echo "⚠️  npm not found. Please install Node.js and npm first."
    exit 1
fi

echo "🔧 Installing dependencies..."
npm install

echo "🧪 Running tests..."
npm run test

echo "🔨 Building application..."
npm run build

echo "✅ Build successful!"

echo ""
echo "🎯 Deployment Options:"
echo "======================"
echo ""
echo "1. 🚀 Vercel (Recommended):"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Vercel will auto-detect Next.js"
echo ""
echo "2. 🌐 Netlify:"
echo "   - Go to https://netlify.com"
echo "   - Connect your GitHub repo"
echo "   - Build command: npm run build"
echo "   - Publish directory: .next"
echo ""
echo "3. 🚂 Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect your GitHub repo"
echo "   - Railway auto-detects Next.js"
echo ""
echo "4. 🐳 Docker:"
echo "   - Build: docker build -t options-signals ."
echo "   - Run: docker run -p 3000:3000 options-signals"
echo ""
echo "5. 📄 Static Export (GitHub Pages):"
echo "   - Run: npm run export"
echo "   - Deploy 'out' folder to GitHub Pages"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🎉 Ready to deploy!"