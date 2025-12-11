import { Button } from './button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportButtonProps {
    onExport: () => Promise<boolean>;
    label?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export function ExportButton({
    onExport,
    label = 'Export to Excel',
    variant = 'outline',
    size = 'default',
    className = ''
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await onExport();
            toast.success('Export completed successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleExport}
            disabled={isExporting}
            className={className}
        >
            {isExporting ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    {label}
                </>
            )}
        </Button>
    );
}
