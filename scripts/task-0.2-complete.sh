#!/bin/bash
# Task 0.2 Completion Script
# Run this script to complete the migration and seeding

set -e  # Exit on error

echo "🚀 Task 0.2: Completing bcrypt migration and seeding"
echo "=================================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")/.."
PROJECT_DIR=$(pwd)
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Step 1: Run Prisma Migration
echo "📝 Step 1: Running Prisma migration..."
echo "Command: npx prisma migrate dev --name add_auth_models"
echo ""

read -p "Press Enter to continue or Ctrl+C to cancel..."

npx prisma migrate dev --name add_auth_models

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "⚠️  Migration failed. Trying alternative approach..."
    echo "Creating migration without applying..."
    npx prisma migrate dev --create-only --name add_auth_models
    
    echo ""
    echo "Please review the migration SQL in prisma/migrations/"
    echo "Then run: npx prisma migrate resolve --applied [migration-name]"
    exit 1
fi

echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2: Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""

# Step 3: Create Test User
echo "👤 Step 3: Creating test user..."
npm run seed:auth

if [ $? -eq 0 ]; then
    echo "✅ Test user created successfully"
else
    echo "❌ Failed to create test user"
    exit 1
fi

echo ""

# Step 4: Verify Build
echo "🏗️  Step 4: Verifying build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Task 0.2 COMPLETED SUCCESSFULLY!"
echo "=================================================="
echo ""
echo "📋 Summary:"
echo "  - Migration created and applied"
echo "  - Prisma client generated"
echo "  - Test user created: test@ceoclaw.com / password123"
echo "  - Build verified"
echo ""
echo "📝 Next steps:"
echo "  1. Test login with credentials above"
echo "  2. Review changes"
echo "  3. Commit with message:"
echo "     'feat: add bcrypt password hashing and auth models migration'"
echo ""
