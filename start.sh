#!/bin/bash

# Expense Manager Start Script

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║           💰 EXPENSE MANAGER - Starting Server...            ║"
echo "║                  Using MariaDB Database                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

# Change to project directory
cd /root/bun

# Check if MariaDB database exists
DB_EXISTS=$(mysql -u root -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'expense_manager';" 2>/dev/null | grep expense_manager)

if [ -z "$DB_EXISTS" ]; then
    echo "📦 MariaDB database not found. Initializing..."
    bun run db:migrate
    bun run db:seed
    echo "✅ Database initialized!"
    echo ""
else
    echo "✅ MariaDB database 'expense_manager' ready"
    echo ""
fi

echo "🚀 Starting Expense Manager..."
echo ""

# Get network IP address
NETWORK_IP=$(hostname -I | awk '{print $1}')

echo "   Access the application at:"
echo "   → Local:  http://localhost:3344"
echo "   → Network: http://${NETWORK_IP}:3344"
echo ""
echo "   Other devices on the same network can access via:"
echo "   → http://${NETWORK_IP}:3344"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
bun run dev
