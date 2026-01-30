# ⚠️ IMPORTANT: How to Access the Application

## ❌ WRONG WAY (Will Not Work)

**DO NOT** open the HTML file directly from your file system:
- ❌ `file:///root/bun/public/index.html`
- ❌ Double-clicking the HTML file
- ❌ Opening from file explorer

This causes CORS errors and "Failed to fetch" because browsers block file:// from making HTTP requests.

---

## ✅ CORRECT WAY (Must Use)

### Step 1: Start the Server
```bash
cd /root/bun
./start.sh
```

Or manually:
```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run dev
```

You should see:
```
✅ Database 'expense_manager' ready
✅ All tables created successfully
🚀 Server starting on http://localhost:3000
📊 Using MariaDB database
```

### Step 2: Open in Browser
Open your web browser and navigate to:

**→ http://localhost:3000**

NOT file:///root/bun/public/index.html ❌

---

## 🔍 Verify Server is Running

### Check if server is running:
```bash
lsof -i :3000
```

Should show:
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
bun     12345 root   65u  IPv6 xxxxxxxx      0t0  TCP *:3000 (LISTEN)
```

### Test API directly:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "name": "Expense Manager API (MariaDB)",
  "version": "1.0.0",
  "database": "MariaDB",
  "status": "healthy"
}
```

### Test categories:
```bash
curl http://localhost:3000/api/categories
```

Should return array of 6 categories.

---

## 🐛 Troubleshooting

### "Failed to fetch" Error

**Cause**: You're accessing via file:// instead of http://localhost:3000

**Solution**:
1. Make sure server is running: `./start.sh`
2. Access via: http://localhost:3000
3. NOT via: file:///...

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 bun run dev
# Then access: http://localhost:3001
```

### Server Not Starting

```bash
# Check Bun is installed
bun --version

# Reinstall if needed
curl -fsSL https://bun.sh/install | bash

# Add to PATH
export PATH="$HOME/.bun/bin:$PATH"
```

### Categories Still Empty

1. **Verify data exists**:
   ```bash
   mysql -u root -e "USE expense_manager; SELECT * FROM categories;"
   ```

2. **Check browser console** (F12):
   - Should see: "Categories loaded: (6) [...]"
   - If you see "Failed to fetch", you're using file:// URL

3. **Hard refresh browser**:
   - Chrome/Firefox: Ctrl + Shift + R
   - Safari: Cmd + Shift + R

---

## 📱 Access from Another Computer

If you want to access from another computer on the same network:

1. Find your IP address:
   ```bash
   hostname -I
   ```

2. Start server on all interfaces:
   ```bash
   # Edit .env
   PORT=3000
   HOST=0.0.0.0
   ```

3. Access from other computer:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

---

## ✅ Quick Checklist

Before opening the browser:

- [ ] Server is running (`./start.sh`)
- [ ] Can see "Server starting on http://localhost:3000"
- [ ] Can curl http://localhost:3000/health successfully
- [ ] Opening http://localhost:3000 in browser (NOT file://)
- [ ] Browser console (F12) shows no CORS errors

---

## 🎯 Summary

**The Golden Rule**: 

Always access the application through the web server:
- ✅ http://localhost:3000
- ❌ file:///root/bun/public/index.html

The server MUST be running for the application to work!

---

Need help? Check the logs:
```bash
# View server output
./start.sh

# Or run in foreground to see logs
bun run dev
```
