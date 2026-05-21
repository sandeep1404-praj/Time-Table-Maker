#!/bin/bash

# Academy Timetable - Quick Start Guide

echo "🎓 Academy Timetable Management System"
echo "========================================"
echo ""

# Check if MongoDB is running
echo "✓ Checking MongoDB..."
if ! command -v mongosh &> /dev/null; then
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is running on localhost:27017"
else
    echo "✓ MongoDB CLI found"
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd server
npm install
echo "✓ Backend dependencies installed"

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd ../client
npm install
echo "✓ Frontend dependencies installed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start MongoDB (if not running)"
echo "2. Terminal 1: cd server && npm run dev"
echo "3. Terminal 2: cd server && node seed.js (seed sample data)"
echo "4. Terminal 3: cd client && npm run dev"
echo "5. Open browser: http://localhost:5173"
echo ""
