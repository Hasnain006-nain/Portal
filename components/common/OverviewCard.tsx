import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  onClick?: () => void;
}

export function OverviewCard({ title, value, icon: Icon, description, onClick }: OverviewCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05, y: -5 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={`p-6 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground">{title}</p>
            <motion.h2
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="mt-2"
            >
              {value}
            </motion.h2>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <motion.div
            className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="h-6 w-6 text-primary" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
