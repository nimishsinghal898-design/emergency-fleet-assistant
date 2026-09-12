import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface CardProps {
    title: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

export function Card({ title, children, className, action }: CardProps) {
    return (
        <div className={cn("bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col", className)}>
            <div className="bg-slate-950/50 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 uppercase tracking-wider text-sm">{title}</h3>
                {action && <div>{action}</div>}
            </div>
            <div className="p-4 flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
