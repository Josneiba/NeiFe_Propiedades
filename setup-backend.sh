#!/bin/bash
# NeiFe Backend Setup & Testing Script

echo "🚀 NeiFe Backend Setup"
echo "===================="

# Step 1: Verify environment
echo "✓ Step 1: Checking environment..."
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local not found. Creating template..."
  cp .env.example .env.local 2>/dev/null || echo "Create .env.local manually with your credentials"
fi

# Step 2: Install/update dependencies
echo "✓ Step 2: Installing dependencies..."
pnpm install

# Step 3: Generate Prisma client
echo "✓ Step 3: Generating Prisma client..."
npx prisma generate

# Step 4: Run migrations
echo "✓ Step 4: Running database migrations..."
npx prisma migrate dev --name init

# Step 5: Seed demo data
echo "✓ Step 5: Seeding demo data..."
npx prisma db seed

# Step 6: Start dev server
echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. pnpm dev"
echo "2. Open http://localhost:3000/login"
echo ""
echo "📧 Demo Accounts:"
echo "   Arrendador:  owner@neife.cl / demo1234"
echo "   Arrendatario: tenant1@neife.cl / demo1234"
echo ""
echo "📚 Documentation:"
echo "   See BACKEND_IMPLEMENTATION.md for detailed guide"
