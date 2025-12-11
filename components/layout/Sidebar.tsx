import { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Home,
  BookOpen,
  GraduationCap,
  Bell,
  Settings,
  Users,
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { SupportRequest } from '../dashboard/SupportRequest';
import './sidebar-fix.css';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
    >
      <motion.div
        animate={active ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0"
      >
        {icon}
      </motion.div>
      <span className="truncate">{label}</span>
    </motion.button>
  );
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <aside className="w-64 border-r border-border bg-card p-3 sm:p-4 flex flex-col h-full overflow-y-auto">
      <motion.nav
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 space-y-1 sm:space-y-2"
      >
        <motion.div variants={itemVariants}>
          <NavItem
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => onTabChange('dashboard')}
          />
        </motion.div>
        {isAdmin && (
          <motion.div variants={itemVariants}>
            <NavItem
              icon={<Home className="h-5 w-5" />}
              label="Hostel"
              active={activeTab === 'hostel'}
              onClick={() => onTabChange('hostel')}
            />
          </motion.div>
        )}
        <motion.div variants={itemVariants}>
          <NavItem
            icon={<BookOpen className="h-5 w-5" />}
            label="Library"
            active={activeTab === 'library'}
            onClick={() => onTabChange('library')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <NavItem
            icon={<GraduationCap className="h-5 w-5" />}
            label="Faculties"
            active={activeTab === 'courses'}
            onClick={() => onTabChange('courses')}
          />
        </motion.div>
        {isAdmin && (
          <motion.div variants={itemVariants}>
            <NavItem
              icon={<Users className="h-5 w-5" />}
              label="Students"
              active={activeTab === 'students'}
              onClick={() => onTabChange('students')}
            />
          </motion.div>
        )}
        <motion.div variants={itemVariants}>
          <NavItem
            icon={<Calendar className="h-5 w-5" />}
            label="Appointments"
            active={activeTab === 'appointments'}
            onClick={() => onTabChange('appointments')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <NavItem
            icon={<Bell className="h-5 w-5" />}
            label="Announcements"
            active={activeTab === 'announcements'}
            onClick={() => onTabChange('announcements')}
          />
        </motion.div>

        {isAdmin && (
          <motion.div variants={itemVariants}>
            <NavItem
              icon={<ClipboardList className="h-5 w-5" />}
              label="Requests"
              active={activeTab === 'requests'}
              onClick={() => onTabChange('requests')}
            />
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="my-4 border-t border-border"
        />
        <motion.div variants={itemVariants}>
          <NavItem
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => onTabChange('settings')}
          />
        </motion.div>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        className="mt-3 sm:mt-4 p-3 sm:p-4 bg-muted rounded-lg"
      >
        <p className="text-muted-foreground text-xs sm:text-sm">Need help?</p>
        <div className="mt-2">
          <SupportRequest />
        </div>
      </motion.div>
    </aside>
  );
}
