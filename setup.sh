#!/bin/bash

set -e

echo "=== Glenigan Project Browser Setup ==="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

echo "Step 1: Installing backend dependencies..."
cd backend
npm install

echo "Step 2: Building backend..."
npm run build
cd ..

echo "Step 3: Installing frontend dependencies..."
cd frontend
npm install

echo "Step 4: Building frontend..."
npm run build
cd ..

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To start the server, run:"
echo "  cd backend && npm start"
echo ""
echo "Then open http://localhost:3000 in your browser"