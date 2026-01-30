# 🌐 Network Access Configuration

## ✅ Server Configured for Network Access

The server is now configured to accept connections from other devices on your local network.

---

## 🚀 How to Access from Other Devices

### Step 1: Start the Server
```bash
./start.sh
```

The server will show:
```
🚀 Server starting on http://localhost:3000
📊 Using MariaDB database
🌐 Accessible from network on port 3000

Access the application at:
→ Local:  http://localhost:3000
→ Network: http://192.168.100.135:3000
```

### Step 2: Find Your Server's IP Address
```bash
hostname -I
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Step 3: Access from Other Devices

On any device connected to the same network:

1. **Open a web browser**
2. **Type in the address bar:**
   ```
   http://YOUR_SERVER_IP:3000
   ```
   
   Example: `http://192.168.100.135:3000`

3. **Press Enter**

---

## 📱 Access from Different Devices

### From Your Phone/Tablet
1. Connect to the same Wi-Fi network
2. Open browser
3. Go to: `http://192.168.100.135:3000` (use your server's IP)

### From Another Computer
1. Connect to the same network
2. Open browser
3. Go to: `http://192.168.100.135:3000` (use your server's IP)

### From a Different Browser on Same Machine
- Local: `http://localhost:3000`
- Network: `http://192.168.100.135:3000`

---

## 🔧 Configuration

### Server Configuration
- **Host**: `0.0.0.0` (listens on all network interfaces)
- **Port**: `3000` (configurable via `.env`)
- **CORS**: Enabled for all origins

### Frontend Configuration
- **Auto-detection**: Frontend automatically detects the current host
- **API Base URL**: Uses `window.location.host` to match current access method
- **Works for**: Both localhost and network IP access

---

## 🔒 Security Notes

### Current Configuration (Development)
- ✅ CORS enabled for all origins
- ✅ Accessible from local network
- ✅ No authentication required

### For Production
Consider adding:
- 🔐 Authentication (JWT)
- 🔒 HTTPS/TLS
- 🛡️ Firewall rules
- 📝 Rate limiting
- 🔍 Input validation
- 🚫 IP whitelisting (optional)

---

## 🐛 Troubleshooting

### Can't Access from Other Devices

1. **Check Firewall**
   ```bash
   # Allow port 3000
   sudo ufw allow 3000/tcp
   # or
   sudo firewall-cmd --add-port=3000/tcp --permanent
   sudo firewall-cmd --reload
   ```

2. **Verify Server is Listening on All Interfaces**
   ```bash
   netstat -tlnp | grep 3000
   # Should show: 0.0.0.0:3000
   ```

3. **Check Network Connection**
   - Ensure devices are on the same network
   - Try pinging the server IP from the other device

4. **Verify IP Address**
   ```bash
   hostname -I
   # Make sure you're using the correct IP
   ```

5. **Check Server Logs**
   - Look for connection attempts in server output
   - Check for any error messages

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it or use different port
PORT=3001 ./start.sh
```

### CORS Errors
- CORS is already enabled for all origins
- If you see CORS errors, check browser console
- Make sure you're accessing via `http://` not `file://`

---

## 📊 Network Information

### Your Server IP
```bash
hostname -I | awk '{print $1}'
```

### Test Connectivity
From another device:
```bash
# Ping test
ping YOUR_SERVER_IP

# Port test
telnet YOUR_SERVER_IP 3000
# or
nc -zv YOUR_SERVER_IP 3000
```

### Check Server Status
```bash
# On server
curl http://localhost:3000/health

# From another device
curl http://YOUR_SERVER_IP:3000/health
```

---

## 🎯 Quick Reference

### Start Server
```bash
./start.sh
```

### Access Locally
```
http://localhost:3000
```

### Access from Network
```
http://YOUR_SERVER_IP:3000
```

### Find Your IP
```bash
hostname -I
```

### Test API
```bash
curl http://YOUR_SERVER_IP:3000/api/categories
```

---

## ✅ Summary

Your Expense Manager is now accessible from:
- ✅ Same machine: `http://localhost:3000`
- ✅ Other devices: `http://YOUR_SERVER_IP:3000`

The frontend automatically detects the host and uses the correct API URL, so it works seamlessly whether accessed locally or from the network!

---

**Need help?** Check server logs or run `./start.sh` to see connection information.
