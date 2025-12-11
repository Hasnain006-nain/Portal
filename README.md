# 🎓 University Student Portal

A modern, full-stack university management system featuring student portal, hostel management, library system, course enrollment, and comprehensive admin dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)

## ✨ Features

### �‍🎓 rStudent Portal
- **Dashboard** - Personalized student dashboard with overview
- **Course Enrollment** - Browse and enroll in courses
- **Library System** - Search books, borrow/return management
- **Hostel Management** - View hostel assignments and room details
- **Announcements** - Receive important university notifications
- **Appointments** - Schedule appointments with faculty/admin
- **Profile Management** - Update personal information and settings

### �‍💼 Admin Dashboard
- **Student Management** - Add, edit, delete student records
- **Course Management** - Manage courses, enrollments, and schedules
- **Hostel Management** - Manage hostels, rooms, and assignments
- **Library Management** - Manage books, borrowings, and inventory
- **Announcements** - Create and broadcast announcements to students
- **Request Management** - Approve/reject student requests
- **User Management** - Create admin and teacher accounts
- **Analytics** - View statistics and reports

### � Autthentication & Security
- Secure login/registration system
- Role-based access control (Admin, Student, Teacher)
- Password strength validation
- Breach detection (HaveIBeenPwned API)
- JWT-based authentication

### 🎨 UI/UX Features
- Modern, responsive design
- Dark/Light mode support
- Professional animations (Framer Motion)
- Mobile-friendly interface
- Real-time notifications
- Toast notifications for user feedback

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 4.0** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible components
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm 9+
- MySQL 8.0+ (XAMPP recommended)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Hasnain006-nain/Portal.git
cd Portal
```

### 2. Setup Database
1. Start XAMPP and run MySQL
2. Open phpMyAdmin: `http://localhost/phpmyadmin`
3. Create database: `studentportal`
4. Tables will be created automatically on first run

### 3. Backend Setup
```bash
cd server
npm install
```

Create `.env` file in `server` folder:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=studentportal
DB_PORT=3306
PORT=5002
JWT_SECRET=your-secret-key-here
```

Start backend:
```bash
npm start
```

### 4. Frontend Setup
```bash
cd ..
npm install
npm run dev
```

### 5. Access Application
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5002`

## 🚀 Deployment

### Vercel (Frontend)
1. Push code to GitHub
2. Import project in Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Deploy!

### Backend Deployment
- Deploy on Railway, Render, or Heroku
- Update frontend API URL in environment variables

## 🎯 Usage

### Default Admin Login
```
Email: admin@university.edu
Password: admin123
```

### Creating Students
1. Admin logs in
2. Navigate to Students
3. Click "Add Student"
4. Fill in details and save

### Student Registration
1. Students can register via registration page
2. Admin approves registration requests
3. Student receives access

## 📱 Key Features Showcase

### For Students
- View personalized dashboard
- Enroll in courses
- Borrow/return library books
- View hostel assignments
- Receive announcements
- Schedule appointments
- Manage profile settings

### For Admins
- Manage all students
- Create/edit courses
- Assign hostels and rooms
- Manage library inventory
- Send announcements
- Approve requests
- Create admin accounts
- View analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � Licnense

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Hasnain Haider**

- GitHub: [@Hasnain006-nain](https://github.com/Hasnain006-nain)
- Email: hasnain1006@gmail.com

## 🙏 Acknowledgments

- React Team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Radix UI for accessible components
- All open-source contributors

## 📞 Support

For support, email hasnain1006@gmail.com or create an issue in the repository.

---

Made with ❤️ by Hasnain Haider
