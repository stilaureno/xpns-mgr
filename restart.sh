#!/bin/bash

# Expense Manager Restart Script

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║           💰 EXPENSE MANAGER - Restarting Server...          ║"
echo "║                  Using MariaDB Database                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Add Bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

# Change to project directory
cd /root/bun

# Stop any running server processes
echo "🛑 Stopping existing server processes..."

# Find and kill processes using port 3344
PORT_PID=$(lsof -ti:3344 2>/dev/null)
if [ -n "$PORT_PID" ]; then
    echo "   Found process on port 3344 (PID: $PORT_PID), stopping..."
    kill -9 $PORT_PID 2>/dev/null
    echo "   ✅ Process stopped"
else
    echo "   No process found on port 3344"
fi

# Also kill any bun processes related to the server
BUN_PIDS=$(pgrep -f "bun.*index.mariadb.ts\|bun.*dev" 2>/dev/null)
if [ -n "$BUN_PIDS" ]; then
    echo "   Found bun server processes, stopping..."
    pkill -f "bun.*index.mariadb.ts\|bun.*dev" 2>/dev/null
    echo "   ✅ Bun processes stopped"
fi

# Wait a moment for processes to fully terminate
echo "   Waiting for processes to terminate..."
sleep 2

# Verify port is free
if lsof -ti:3344 >/dev/null 2>&1; then
    echo "   ⚠️  Warning: Port 3344 may still be in use"
else
    echo "   ✅ Port 3344 is now free"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server using the start script
echo "🚀 Starting server..."
echo ""
bash start.sh
