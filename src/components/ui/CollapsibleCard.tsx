
import { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    className?: string;
    description?: string;
}

export function CollapsibleCard({
    title,
    icon,
    children,
    defaultOpen = true,
    className,
    description
}: CollapsibleCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className={cn("transition-all duration-200", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center gap-2">
                        {icon}
                        <CardTitle className="text-xl font-bold">{title}</CardTitle>
                    </div>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle</span>
                </Button>
            </CardHeader>
            {isOpen && <CardContent>{children}</CardContent>}
        </Card>
    );
}
