import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BookOpen } from 'lucide-react';

interface BookCardProps {
  book: any;
  onBorrow?: (bookId: string) => void;
  onReturn?: (bookId: string) => void;
  onClick?: (book: any) => void;
}

export function BookCard({ book, onBorrow, onReturn, onClick }: BookCardProps) {
  const isAvailable = book.available > 0;
  const bookId = book._id || book.id;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="overflow-hidden cursor-pointer"
        onClick={() => onClick && onClick(book)}
      >
        <motion.div
          className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="h-16 w-16 text-primary/40" />
          )}
        </motion.div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="line-clamp-2 text-sm font-semibold">{book.title}</h4>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {isAvailable ? (
                <Badge variant="outline" className="shrink-0 text-xs">Available</Badge>
              ) : (
                <Badge variant="destructive" className="shrink-0 text-xs">Out</Badge>
              )}
            </motion.div>
          </div>
          <p className="text-muted-foreground text-xs">{book.author}</p>
          <p className="text-muted-foreground text-xs mt-1">{book.category}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-muted-foreground text-xs">
              {book.available}/{book.total} copies
            </span>
          </div>
          {onBorrow && isAvailable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                className="w-full mt-2 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onBorrow(bookId);
                }}
              >
                Borrow
              </Button>
            </motion.div>
          )}
          {onReturn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                className="w-full mt-2 h-8 text-xs"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onReturn(bookId);
                }}
              >
                Return
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
