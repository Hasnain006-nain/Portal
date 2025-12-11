import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Moon, Sun, LogOut, Search, Bell, LayoutDashboard, Home, BookOpen, Users, Menu, X, Settings as SettingsIcon, ClipboardList, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../lib/theme';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { requestsApi, notificationsApi } from '../../lib/apiClient';
import './navbar-fix.css';
import './responsive-fix.css';

interface NavbarProps {
  onLogout: () => void;
  onLogoClick?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavLink = ({ icon, label, active, onClick }: NavLinkProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};

export function Navbar({ onLogout, onLogoClick, activeTab = 'dashboard', onTabChange, onMenuClick, menuOpen = false }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const isAdmin = currentUser?.role === 'admin';

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = () => {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setCurrentUser(user);
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    handleUserUpdate(); // Load initial data

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Listen for announcement updates
  useEffect(() => {
    const updateNotificationCount = () => {
      const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
      const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');

      // Count only unread announcements
      const unreadCount = announcements.filter((a: any) =>
        !readAnnouncements.includes(a._id || a.id)
      ).length;

      setNotificationCount(unreadCount);
    };

    // Update on mount
    updateNotificationCount();

    // Listen for storage changes
    window.addEventListener('storage', updateNotificationCount);
    window.addEventListener('announcementsUpdated', updateNotificationCount);

    return () => {
      window.removeEventListener('storage', updateNotificationCount);
      window.removeEventListener('announcementsUpdated', updateNotificationCount);
    };
  }, []);

  // Listen for request updates (Admin only)
  useEffect(() => {
    if (!isAdmin) {
      setRequestCount(0);
      return;
    }

    const updateRequestCount = async () => {
      try {
        const pendingRequests = await requestsApi.getPending();
        setRequestCount(pendingRequests.length);
      } catch (error) {
        // Silently fail if not authorized (user might not be admin yet)
        if (error instanceof Error && error.message.includes('Admin access required')) {
          setRequestCount(0);
        } else {
          console.error('Failed to fetch pending requests:', error);
        }
      }
    };

    // Update on mount
    updateRequestCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(updateRequestCount, 30000);

    // Listen for custom events
    window.addEventListener('requestsUpdated', updateRequestCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('requestsUpdated', updateRequestCount);
    };
  }, [isAdmin]);

  // Listen for notification updates (All users)
  useEffect(() => {
    if (!currentUser?.email) return;

    const updateNotificationCount = async () => {
      try {
        const { count } = await notificationsApi.getUnreadCount(currentUser.email);
        setUnreadNotifications(count);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    // Update on mount
    updateNotificationCount();

    // Poll for updates every 10 seconds
    const interval = setInterval(updateNotificationCount, 10000);

    // Listen for custom events
    window.addEventListener('notificationsUpdated', updateNotificationCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', updateNotificationCount);
    };
  }, [currentUser?.email]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-14 sm:h-16 bg-card px-3 sm:px-4 md:px-6 flex items-center justify-between flex-shrink-0 overflow-hidden"
    >
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Mobile Menu Button */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          onClick={onLogoClick}
        >
          <motion.div
            className="h-8 w-8 sm:h-10 sm:w-10 bg-primary rounded-full flex items-center justify-center"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </motion.div>
          <h2 className="text-base sm:text-lg md:text-xl">StudentZero</h2>
        </motion.div>
      </div>

      {/* Navigation Links - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden lg:flex flex-1 items-center gap-1 mx-4 overflow-x-auto"
      >
        <NavLink
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onClick={() => onTabChange?.('dashboard')}
        />
        {isAdmin && (
          <NavLink
            icon={<Home className="h-4 w-4" />}
            label="Hostel"
            active={activeTab === 'hostel'}
            onClick={() => onTabChange?.('hostel')}
          />
        )}
        <NavLink
          icon={<BookOpen className="h-4 w-4" />}
          label="Library"
          active={activeTab === 'library'}
          onClick={() => onTabChange?.('library')}
        />
        <NavLink
          icon={<GraduationCap className="h-4 w-4" />}
          label="Faculties"
          active={activeTab === 'courses'}
          onClick={() => onTabChange?.('courses')}
        />
        {isAdmin && (
          <NavLink
            icon={<Users className="h-4 w-4" />}
            label="Students"
            active={activeTab === 'students'}
            onClick={() => onTabChange?.('students')}
          />
        )}
        <NavLink
          icon={<Calendar className="h-4 w-4" />}
          label="Appointments"
          active={activeTab === 'appointments'}
          onClick={() => onTabChange?.('appointments')}
        />
        {/* Removed Announcements from nav links - accessible via bell icon */}
        <NavLink
          icon={<SettingsIcon className="h-4 w-4" />}
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => onTabChange?.('settings')}
        />
      </motion.div>

      {/* Search Bar - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="hidden md:flex max-w-xs mx-2"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 h-9"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0"
      >
        {/* Admin Request Notifications */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => {
              onTabChange?.('requests');
              // Clear the badge immediately when opening requests page
              setRequestCount(0);
              // Refresh count after page loads to get accurate count
              setTimeout(() => {
                window.dispatchEvent(new Event('requestsUpdated'));
              }, 1000);
            }}
          >
            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
            {requestCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs bg-red-500 hover:bg-red-500">
                {requestCount}
              </Badge>
            )}
          </Button>
        )}

        {/* User Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => {
            onTabChange?.('notifications');
            // Trigger notification refresh
            setTimeout(() => {
              window.dispatchEvent(new Event('notificationsUpdated'));
            }, 500);
          }}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs bg-red-500 hover:bg-red-500">
              {unreadNotifications}
            </Badge>
          )}
        </Button>

        {/* Announcements Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => {
            onTabChange?.('announcements');
            // Mark all announcements as read when opening the page
            setTimeout(() => {
              const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
              const readIds = announcements.map((a: any) => a._id || a.id);
              localStorage.setItem('readAnnouncements', JSON.stringify(readIds));
              window.dispatchEvent(new Event('announcementsUpdated'));
            }, 500);
          }}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs">
              {notificationCount}
            </Badge>
          )}
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-10 sm:w-10">
          {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>

        {/* User Profile */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-2 md:gap-3 ml-1 md:ml-2">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-sm md:text-base">{currentUser.name || 'User'}</span>
              <span className="text-muted-foreground leading-none mt-1 text-xs">
                {currentUser.studentId || currentUser.email}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8 sm:h-10 sm:w-10">
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </motion.div>
    </motion.nav>
  );
}
