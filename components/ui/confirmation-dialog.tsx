import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    warningItems?: string[];
    confirmText: string;
    requireTextMatch?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    warningItems,
    confirmText,
    requireTextMatch,
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (requireTextMatch && inputValue !== requireTextMatch) {
            setError(`Please type "${requireTextMatch}" exactly to confirm`);
            return;
        }
        setInputValue('');
        setError('');
        onConfirm();
    };

    const handleCancel = () => {
        setInputValue('');
        setError('');
        onCancel();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                <div className="p-6 border-b">
                    <DialogHeader className="text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                                {description && (
                                    <DialogDescription className="text-sm mt-1">
                                        {description}
                                    </DialogDescription>
                                )}
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4">
                    {warningItems && warningItems.length > 0 && (
                        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                            <p className="text-sm font-medium mb-2">This will permanently delete:</p>
                            <ul className="space-y-1">
                                {warningItems.map((item, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-destructive mt-0.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {requireTextMatch && (
                        <div className="space-y-2">
                            <Label htmlFor="confirmInput" className="text-sm font-medium">
                                To confirm, type <span className="font-bold text-destructive">"{requireTextMatch}"</span>
                            </Label>
                            <Input
                                id="confirmInput"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setError('');
                                }}
                                placeholder={`Type "${requireTextMatch}" to confirm`}
                                className="h-11 rounded-lg"
                                autoComplete="off"
                            />
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                        {confirmText}
                    </p>
                </div>

                <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        className="px-6"
                        disabled={!!(requireTextMatch && inputValue !== requireTextMatch)}
                    >
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
