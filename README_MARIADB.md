# 💰 Expense Manager - MariaDB Edition

## ✅ MariaDB Integration Complete!

Your expense manager has been successfully configured to use **MariaDB** instead of SQLite!

---

## 🎉 What's Been Set Up

✅ **MariaDB Database**: `expense_manager`  
✅ **5 Tables Created**:
   - `users` (3 sample users)
   - `categories` (6 sample categories)
   - `expenses` (empty, ready for data)
   - `expense_history` (audit trail)
   - `receipts` (file attachments)

✅ **Connection**: Using Unix socket (`/var/run/mysqld/mysqld.sock`)  
✅ **Sample Data**: 3 users and 6 categories seeded

---

## 🗄️ Database Information

### Connection Details
```
Database: expense_manager
User: root
Socket: /var/run/mysqld/mysqld.sock
```

### Tables Created
```sql
-- Users table
users (id, name, email, role, created_at)

-- Categories table  
categories (id, name, description, color, created_at)

-- Expenses table
expenses (id, title, description, amount, currency, 
          category_id, date, state, created_by, 
          created_at, updated_at)

-- Expense history (audit trail)
expense_history (id, expense_id, from_state, to_state,
                 event_type, event_data, performed_by, timestamp)

-- Receipts table
receipts (id, expense_id, filename, filepath,
          mimetype, size, uploaded_at)
```

---

## 🚀 How to Start

### Option 1: Using the start script
```bash
./start.sh
```

### Option 2: Manual start
```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run dev
```

Then open: **http://localhost:3000**

---

## 🔧 Database Commands

### View Database
```bash
mysql -u root -e "USE expense_manager; SHOW TABLES;"
```

### View Users
```bash
mysql -u root -e "USE expense_manager; SELECT * FROM users;"
```

### View Categories
```bash
mysql -u root -e "USE expense_manager; SELECT * FROM categories;"
```

### View Expenses
```bash
mysql -u root -e "USE expense_manager; SELECT * FROM expenses;"
```

### View Expense History
```bash
mysql -u root -e "USE expense_manager; SELECT * FROM expense_history;"
```

### Count Records
```bash
mysql -u root -e "USE expense_manager; 
  SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM expenses) as expenses;"
```

---

## 📊 Sample Data

### Users (3)
```
1. John Doe (user) - john@example.com
2. Jane Smith (approver) - jane@example.com  
3. Admin User (admin) - admin@example.com
```

### Categories (6)
```
1. Travel (#3B82F6)
2. Food (#10B981)
3. Office Supplies (#F59E0B)
4. Software (#8B5CF6)
5. Entertainment (#EC4899)
6. Other (#6B7280)
```

---

## 🔄 Database Management

### Reset Database
```bash
# Drop and recreate
mysql -u root -e "DROP DATABASE IF EXISTS expense_manager;"
bun run db:migrate
bun run db:seed
```

### Backup Database
```bash
mysqldump -u root expense_manager > expense_manager_backup.sql
```

### Restore Database
```bash
mysql -u root expense_manager < expense_manager_backup.sql
```

### Export to CSV
```bash
mysql -u root -e "USE expense_manager; 
  SELECT * FROM expenses INTO OUTFILE '/tmp/expenses.csv' 
  FIELDS TERMINATED BY ',' 
  ENCLOSED BY '\"' 
  LINES TERMINATED BY '\n';"
```

---

## ⚙️ Configuration

### Environment Variables (.env)
```env
PORT=3000
NODE_ENV=development

# MariaDB Configuration
DB_SOCKET=/var/run/mysqld/mysqld.sock
DB_USER=root
DB_PASSWORD=
DB_NAME=expense_manager
```

### Change Database Name
Edit `.env` and change `DB_NAME`, then run:
```bash
bun run db:migrate
bun run db:seed
```

### Use Different User
Edit `.env`:
```env
DB_USER=your_user
DB_PASSWORD=your_password
```

---

## 🎯 API Endpoints (Same as Before)

All API endpoints work exactly the same:

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "name": "Expense Manager API (MariaDB)",
  "version": "1.0.0",
  "database": "MariaDB",
  "status": "healthy"
}
```

### List Expenses
```bash
curl http://localhost:3000/api/expenses
```

### Create Expense
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Client Dinner",
    "amount": 125.50,
    "category": "<category-id>",
    "date": "2025-12-31",
    "createdBy": "<user-id>"
  }'
```

See `docs/API_EXAMPLES.md` for complete API documentation.

---

## 🆚 MariaDB vs SQLite

### Advantages of MariaDB

✅ **Better Performance**: Handles concurrent requests better  
✅ **Scalability**: Can handle millions of records  
✅ **ACID Compliance**: Full transaction support  
✅ **Replication**: Master-slave replication support  
✅ **Advanced Features**: Stored procedures, triggers, views  
✅ **Production Ready**: Used by major companies  
✅ **Better Indexing**: More efficient query optimization  
✅ **JSON Support**: Native JSON data type  

### When to Use Each

**Use MariaDB when:**
- Building production applications
- Need high concurrency
- Require replication/clustering
- Need advanced SQL features
- Handling large datasets (>1GB)

**Use SQLite when:**
- Prototyping/development
- Single-user applications
- Embedded applications
- Simple requirements
- No separate database server needed

---

## 🔀 Switch Between SQLite and MariaDB

### Use MariaDB (Current)
```bash
bun run dev          # Uses MariaDB
bun run db:migrate   # MariaDB migrations
bun run db:seed      # MariaDB seeding
```

### Use SQLite
```bash
bun run dev:sqlite          # Uses SQLite
bun run db:migrate:sqlite   # SQLite migrations
bun run db:seed:sqlite      # SQLite seeding
```

---

## 🛠️ Troubleshooting

### Connection Error
```bash
# Check MariaDB is running
systemctl status mariadb

# Start MariaDB if needed
sudo systemctl start mariadb
```

### Permission Denied
```bash
# Grant permissions to root user
mysql -u root -e "GRANT ALL PRIVILEGES ON expense_manager.* TO 'root'@'localhost';"
```

### Socket Not Found
```bash
# Find socket location
mysql_config --socket

# Update .env with correct path
DB_SOCKET=/path/to/mysql.sock
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📈 Performance Tips

### Add Indexes
```sql
USE expense_manager;

-- Index for faster queries
CREATE INDEX idx_expense_state_date ON expenses(state, date);
CREATE INDEX idx_expense_amount ON expenses(amount);
CREATE INDEX idx_history_timestamp ON expense_history(timestamp);
```

### Optimize Tables
```sql
USE expense_manager;

OPTIMIZE TABLE expenses;
OPTIMIZE TABLE expense_history;
```

### Check Table Status
```sql
USE expense_manager;

SHOW TABLE STATUS;
```

---

## 🔐 Security Recommendations

### For Production

1. **Create Dedicated User**
```sql
CREATE USER 'expense_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON expense_manager.* TO 'expense_app'@'localhost';
FLUSH PRIVILEGES;
```

2. **Update .env**
```env
DB_USER=expense_app
DB_PASSWORD=strong_password
```

3. **Restrict Permissions**
```sql
REVOKE ALL PRIVILEGES ON *.* FROM 'expense_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON expense_manager.* TO 'expense_app'@'localhost';
```

4. **Enable SSL**
```env
DB_SSL=true
DB_SSL_CA=/path/to/ca.pem
```

---

## 📊 Monitoring

### Check Database Size
```bash
mysql -u root -e "
  SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.tables 
  WHERE table_schema = 'expense_manager'
  GROUP BY table_schema;
"
```

### Show Table Sizes
```bash
mysql -u root -e "
  SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'expense_manager'
  ORDER BY (data_length + index_length) DESC;
"
```

### Check Connections
```bash
mysql -u root -e "SHOW PROCESSLIST;"
```

---

## 🎓 Next Steps

1. **Start the server**: `./start.sh`
2. **Open browser**: http://localhost:3000
3. **Create expenses**: Use the web UI
4. **View in database**: `mysql -u root expense_manager`
5. **Read docs**: `cat docs/QUICKSTART.md`

---

## 📚 Additional Resources

- **Main README**: `README.md`
- **API Examples**: `docs/API_EXAMPLES.md`
- **BHVR Pattern**: `docs/BHVR_PATTERN.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Commands**: `COMMANDS.md`

---

## ✅ Summary

Your expense manager is now using **MariaDB** for data storage!

**Database**: `expense_manager`  
**Tables**: 5 tables created  
**Sample Data**: 3 users, 6 categories  
**Status**: ✅ Ready to use!

**Start the server**: `./start.sh`  
**Access**: http://localhost:3000

---

Built with ❤️ using Bun, TypeScript, BHVR Pattern, and MariaDB
