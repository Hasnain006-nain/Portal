# 📁 SQL Scripts & Database Management

This folder contains all database-related scripts for the Student Portal system.

---

## 📂 Folder Contents

### 🔧 Migration Scripts
Scripts to update/modify existing database schema:

- **`migrate-add-gpa.js`** - Adds GPA field to students table
- **`migrate-add-names.js`** - Adds name fields to various tables
- **`migrate-complete-schema.js`** - Complete schema migration
- **`migrate-requests-table.js`** - Updates requests table structure

### 🌱 Seed Scripts
Scripts to populate database with sample data:

- **`seed.js`** - Main seed script (general data)
- **`seed-mysql.js`** - MySQL-specific seed data
- **`seed-books.js`** - Populates library books
- **`seed-appointments.js`** - Populates appointment services and sample appointments
- **`seed-sample-data.js`** - Additional sample data

### ⚙️ Setup Scripts
Scripts for initial database setup:

- **`setup-database.js`** - Initial database setup and table creation

---

## 🚀 How to Use

### Initial Setup (First Time)
```bash
# From server directory
cd server
node sql/setup-database.js
```

### Seed Database with Sample Data
```bash
# Seed general data
node sql/seed.js

# Seed books
node sql/seed-books.js

# Seed appointments
node sql/seed-appointments.js

# Seed MySQL-specific data
node sql/seed-mysql.js
```

### Run Migrations
```bash
# Add GPA field
node sql/migrate-add-gpa.js

# Add name fields
node sql/migrate-add-names.js

# Complete schema migration
node sql/migrate-complete-schema.js

# Update requests table
node sql/migrate-requests-table.js
```

---

## 📋 Script Descriptions

### Migration Scripts

#### `migrate-add-gpa.js`
- Adds `gpa` column to students table
- Type: DECIMAL(3,2)
- Default: NULL

#### `migrate-add-names.js`
- Adds name fields to various tables
- Updates existing records
- Ensures data consistency

#### `migrate-complete-schema.js`
- Complete database schema update
- Adds all missing tables and columns
- Safe to run multiple times (uses IF NOT EXISTS)

#### `migrate-requests-table.js`
- Updates requests table structure
- Adds new columns for request management
- Modifies existing column types

### Seed Scripts

#### `seed.js`
- Seeds basic system data
- Creates admin user
- Adds sample students
- Populates courses

#### `seed-mysql.js`
- MySQL-specific seed data
- Optimized for MySQL database
- Includes all core data

#### `seed-books.js`
- Populates library with books
- Includes various categories
- Sets available copies

#### `seed-appointments.js`
- Creates appointment services
- Adds sample appointments
- Sets up appointment system

#### `seed-sample-data.js`
- Additional sample data
- Testing data
- Demo purposes

### Setup Scripts

#### `setup-database.js`
- Creates database if not exists
- Creates all required tables
- Sets up initial schema
- Run this first!

---

## ⚠️ Important Notes

### Before Running Scripts:

1. **XAMPP MySQL must be running**
   - Start MySQL in XAMPP Control Panel
   - Ensure port 3306 is available

2. **Database Configuration**
   - Check `server/.env` for database settings
   - Default database name: `studentportal`
   - Default user: `root`
   - Default password: (empty)

3. **Backup First**
   - Always backup your database before running migrations
   - Use phpMyAdmin or MySQL Workbench to export

### Running Order (First Time Setup):

```bash
# 1. Setup database and tables
node sql/setup-database.js

# 2. Seed basic data
node sql/seed-mysql.js

# 3. Seed books (optional)
node sql/seed-books.js

# 4. Seed appointments (optional)
node sql/seed-appointments.js
```

---

## 🔍 Troubleshooting

### Error: "Cannot connect to database"
**Solution:**
- Make sure XAMPP MySQL is running
- Check database credentials in `server/.env`
- Verify port 3306 is not blocked

### Error: "Table already exists"
**Solution:**
- This is normal for setup scripts
- Scripts use `IF NOT EXISTS` to prevent errors
- Safe to ignore this message

### Error: "Duplicate entry"
**Solution:**
- Seed scripts may fail if data already exists
- Drop and recreate database for fresh start
- Or modify seed scripts to update instead of insert

### Error: "Unknown column"
**Solution:**
- Run migration scripts first
- Check if table structure is up to date
- Run `migrate-complete-schema.js`

---

## 📊 Database Schema

### Main Tables:
- `users` - User accounts (students, admins)
- `students` - Student information
- `courses` - Course catalog
- `enrollments` - Student course enrollments
- `books` - Library books
- `borrowings` - Book borrowing records
- `hostels` - Hostel information
- `rooms` - Hostel rooms
- `appointments` - Appointment bookings
- `services` - Appointment services
- `notifications` - System notifications
- `announcements` - System announcements
- `requests` - Student requests

---

## 🛠️ Development

### Adding New Migration:
1. Create new file: `migrate-your-feature.js`
2. Follow existing migration pattern
3. Use `IF NOT EXISTS` for safety
4. Test on development database first
5. Document in this README

### Adding New Seed Data:
1. Create new file: `seed-your-data.js`
2. Follow existing seed pattern
3. Use try-catch for error handling
4. Check for duplicates before inserting
5. Document in this README

---

## 📝 Best Practices

### Migrations:
- ✅ Always use `IF NOT EXISTS` for tables
- ✅ Always use `IF NOT EXISTS` for columns (ALTER TABLE)
- ✅ Test on development database first
- ✅ Backup production database before running
- ✅ Make migrations reversible when possible

### Seed Scripts:
- ✅ Check for existing data before inserting
- ✅ Use transactions for data consistency
- ✅ Handle errors gracefully
- ✅ Log success/failure messages
- ✅ Make scripts idempotent (safe to run multiple times)

### General:
- ✅ Keep scripts in this folder
- ✅ Document all changes
- ✅ Use meaningful file names
- ✅ Follow naming convention: `action-description.js`
- ✅ Test thoroughly before committing

---

## 🎯 Quick Reference

### Common Commands:
```bash
# Setup fresh database
node sql/setup-database.js

# Seed all data
node sql/seed-mysql.js

# Run all migrations
node sql/migrate-complete-schema.js

# Seed appointments
node sql/seed-appointments.js

# Seed books
node sql/seed-books.js
```

### File Naming Convention:
- `migrate-*.js` - Database migrations
- `seed-*.js` - Data seeding scripts
- `setup-*.js` - Initial setup scripts

---

## 📞 Need Help?

If you encounter issues:
1. Check XAMPP MySQL is running
2. Verify database credentials in `server/.env`
3. Check console output for error messages
4. Review this README for troubleshooting
5. Check main project documentation

---

**All database scripts are now organized in this folder!** 🎉
