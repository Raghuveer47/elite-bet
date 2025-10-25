#!/bin/bash

echo "🚀 Setting up Elite Bet Backend..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please update the MongoDB URI if needed."
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is installed"
else
    echo "❌ MongoDB is not installed. Please install MongoDB first."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

echo ""
echo "🎯 Setup complete! To start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "📊 The API will be available at:"
echo "   http://localhost:5000"
echo "   Health check: http://localhost:5000/health"
echo "   Betting API: http://localhost:5000/api/betting"
echo ""
echo "🔧 Make sure MongoDB is running before starting the server!"
