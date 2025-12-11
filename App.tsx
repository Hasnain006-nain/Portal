import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './lib/theme';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { HostelManagement } from './components/dashboard/HostelManagement';
import { LibrarySystem } from './components/dashboard/LibrarySystem';
import { StudentLibrary } from './components/dashboard/StudentLibrary';
import { Courses } from './components/dashboard/Courses';
import { StudentCourses } from './components/dashboard/StudentCourses';
import { Students } from './components/dashboard/Students';
import { Announcements } from './components/dashboard/Announcements';
import { AdminPanel } from './components/dashboard/AdminPanel';
import { RequestsManagement } from './components/dashboard/RequestsManagement';
import { Settings } from './components/dashboard/Settings';
import { PendingApproval } from './components/dashboard/PendingApproval';
import { Notifications } from './components/dashboard/Notifications';
import Appointments from './components/dashboard/Appointments';
import AdminAppointments from './components/dashboard/AdminAppointments';
import { Toaster } from './components/ui/sonner';
import { authApi } from './lib/apiClient';
import { toast } from 'sonner';

type AuthView = 'login' | 'register';
type DashboardTab = 'dashboard' | 'hostel' | 'library' | 'courses' | 'students' | 'announcements' | 'admin' | 'requests' | 'settings' | 'notifications' | 'appointments';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isAdmin = currentUser?.role === 'admin';

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      setCurrentUser(data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setIsAuthenticated(true);
      toast.success(`Welcome back, ${data.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const handleRegister = async (name: string, email: string, password: string, phone?: string, department?: string, year?: number) => {
    try {
      const result = await authApi.register(email, password, name, phone, department, year);
      toast.success(result.message || 'Registration submitted! Awaiting admin approval.');
      setAuthView('login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const handleLogout = () => {
    authApi.logout();
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    toast.success('Logged out successfully');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as DashboardTab);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  // Render authentication views
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Toaster />
        <AnimatePresence mode="wait">
          {authView === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Login
                onLogin={handleLogin}
                onSwitchToRegister={() => setAuthView('register')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Register
                onRegister={handleRegister}
                onSwitchToLogin={() => setAuthView('login')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ThemeProvider>
    );
  }

  // Check if user is approved (admins are always approved)
  const isApproved = currentUser?.approved !== false || currentUser?.role === 'admin';

  // Show pending approval screen for unapproved users
  if (isAuthenticated && !isApproved) {
    return (
      <ThemeProvider>
        <Toaster />
        <PendingApproval />
      </ThemeProvider>
    );
  }

  // Render main dashboard
  return (
    <ThemeProvider>
      <Toaster />
      <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
        {/* Navbar */}
        <Navbar
          onLogout={handleLogout}
          onLogoClick={() => setActiveTab('dashboard')}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          menuOpen={sidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Sidebar - Mobile/Tablet only (hidden on desktop lg+) */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                {/* Sidebar */}
                <motion.div
                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed inset-y-0 left-0 z-40 lg:hidden"
                >
                  <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main Content - Full width on all screen sizes */}
          <main className="flex-1 overflow-y-auto w-full max-w-full ml-0">
            <div className="w-full h-full max-w-full ml-0">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StudentDashboard onTabChange={handleTabChange} />
                  </motion.div>
                )}
                {activeTab === 'hostel' && (
                  <motion.div
                    key="hostel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HostelManagement onTabChange={handleTabChange} />
                  </motion.div>
                )}
                {activeTab === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isAdmin ? (
                      <LibrarySystem onTabChange={handleTabChange} />
                    ) : (
                      <StudentLibrary onTabChange={handleTabChange} />
                    )}
                  </motion.div>
                )}
                {activeTab === 'courses' && (
                  <motion.div
                    key="courses"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isAdmin ? (
                      <Courses onTabChange={handleTabChange} />
                    ) : (
                      <StudentCourses onTabChange={handleTabChange} />
                    )}
                  </motion.div>
                )}
                {activeTab === 'students' && (
                  <motion.div
                    key="students"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Students onTabChange={handleTabChange} />
                  </motion.div>
                )}
                {activeTab === 'appointments' && (
                  <motion.div
                    key="appointments"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isAdmin ? (
                      <AdminAppointments />
                    ) : (
                      <Appointments />
                    )}
                  </motion.div>
                )}
                {activeTab === 'announcements' && (
                  <motion.div
                    key="announcements"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Announcements onTabChange={handleTabChange} />
                  </motion.div>
                )}
                {activeTab === 'admin' && (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdminPanel onTabChange={handleTabChange} />
                  </motion.div>
                )}
                {activeTab === 'requests' && (
                  <motion.div
                    key="requests"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RequestsManagement onTabChange={handleTabChange} />
                  </motion.div>
                )}
                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Settings onTabChange={handleTabChange} onUserUpdate={handleUserUpdate} />
                  </motion.div>
                )}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Notifications onTabChange={handleTabChange} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
