# Setup Instructions - MySQL with XAMPP

## Current Status
✅ Frontend dependencies installed
✅ Backend dependencies installed (MySQL)
✅ Development servers configured
✅ All routes converted to MySQL
❌ XAMPP MySQL needs to be running

## Prerequisites

1. **Install XAMPP**
   - Download from: https://www.apachefriends.org/
   - Install and start XAMPP Control Panel
   - Start **MySQL** service (Apache is optional)

## Database Setup

### Step 1: Start XAMPP MySQL
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. MySQL should be running on port 3306

### Step 2: Create Database
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Click "New" to create a new database
3. Database name: `studentportal`
4. Collation: `utf8mb4_general_ci`
5. Click "Create"

**OR** use command line:
```bash
mysql -u root -p
CREATE DATABASE studentportal;
exit;
```

### Step 3: Configure Backend
The `.env` file in `portal-main/server/` is already configured for XAMPP:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=studentportal
DB_PORT=3306
```

**Note:** Default XAMPP MySQL has no password. If you set a password, update `DB_PASSWORD`.

## Running the Application

### 1. Start Backend Server
```bash
cd portal-main/server
npm start
```

The server will:
- Connect to MySQL
- Automatically create all required tables
- Start on http://localhost:5000

### 2. Start Frontend Server
```bash
cd portal-main
npm run dev
```

Frontend will run on: http://localhost:5173

## Database Tables

The backend automatically creates these tables:
- `users` - User authentication
- `students` - Student information
- `courses` - Course catalog
- `enrollments` - Student course enrollments
- `hostels` - Hostel information
- `rooms` - Room details
- `room_residents` - Room occupancy
- `books` - Library books
- `borrowings` - Book borrowing records
- `requests` - Student requests
- `notifications` - User notifications
- `announcements` - System announcements

## Testing the Setup

1. Check backend health: http://localhost:5000/api/health
2. Check database tables: http://localhost:5000/api/test-db
3. Open frontend: http://localhost:5173

## Troubleshooting

### MySQL Connection Error
- Make sure XAMPP MySQL is running
- Check port 3306 is not blocked
- Verify database name is `studentportal`

### Port Already in Use
- Backend (5000): Change `PORT` in `server/.env`
- Frontend (5173): Change in `vite.config.ts`

### Tables Not Created
- Check MySQL user has CREATE TABLE permissions
- Manually run SQL from `server/config/database.js`

## Next Steps

1. ✅ Start XAMPP MySQL
2. ✅ Create `studentportal` database
3. ✅ Start backend server (tables auto-create)
4. ✅ Start frontend server
5. ✅ Access http://localhost:5173

## Default Configuration

- **Database:** MySQL (XAMPP)
- **DB Host:** localhost:3306
- **DB Name:** studentportal
- **DB User:** root
- **DB Password:** (empty)
- **Backend API:** http://localhost:5000/api
- **Frontend:** http://localhost:5173
