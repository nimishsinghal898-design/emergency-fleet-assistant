import React, { useMemo } from 'react';
import { RunResult } from '../types/models';
import { Card } from './Card';
import { List } from 'lucide-react';

interface EventFeedProps {
    runResult: RunResult | null;
    currentMinute: number;
}

interface SimEvent {
    minute: number;
    type: 'REVEAL' | 'ASSIGN' | 'COMPLETE';
    priority: number;
    text: string;
    id: string; // unique key
}

export const EventFeed = React.memo(function EventFeed({ runResult, currentMinute }: EventFeedProps) {
    const allEvents = useMemo(() => {
        if (!runResult) return [];
        const events: SimEvent[] = [];

        // 1. Reveal events
        for (const inc of runResult.incidents) {
            events.push({
                minute: inc.arrival_minute,
                type: 'REVEAL',
                priority: inc.priority,
                text: `${inc.priority === 3 ? 'P3 ' : ''}Incident #${inc.id} revealed`,
                id: `reveal-${inc.id}`
            });
        }

        // 2. Assign & Complete events
        for (const a of runResult.assignments) {
            events.push({
                minute: a.dispatch_time,
                type: 'ASSIGN',
                priority: a.priority,
                text: `Vehicle #${a.vehicle_id} assigned to Incident #${a.incident_id}`,
                id: `assign-${a.assignment_id}`
            });
            events.push({
                minute: a.completion_time,
                type: 'COMPLETE',
                priority: a.priority,
                text: `Vehicle #${a.vehicle_id} completed assignment`,
                id: `complete-${a.assignment_id}`
            });
        }

        // Sort: minute asc, then REVEAL before ASSIGN before COMPLETE for same minute
        const typeOrder = { 'REVEAL': 1, 'ASSIGN': 2, 'COMPLETE': 3 };
        events.sort((a, b) => {
            if (a.minute !== b.minute) return a.minute - b.minute;
            if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
            return a.id.localeCompare(b.id);
        });

        return events;
    }, [runResult]);

    // Filter by current minute and reverse to show newest first
    const visibleEvents = allEvents.filter(e => e.minute <= currentMinute).reverse();

    return (
        <Card title="Operational Event Feed" action={<List className="w-4 h-4 text-slate-500" />} className="h-full">
            <div className="overflow-y-auto pr-2 h-[400px]">
                {visibleEvents.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm">No events yet</div>
                ) : (
                    <div className="space-y-2">
                        {visibleEvents.map(ev => {
                            let colorClass = 'text-slate-400';
                            if (ev.type === 'REVEAL' && ev.priority === 3) colorClass = 'text-red-400 font-semibold';
                            else if (ev.type === 'REVEAL' && ev.priority === 2) colorClass = 'text-amber-400';
                            else if (ev.type === 'ASSIGN') colorClass = 'text-blue-400';
                            else if (ev.type === 'COMPLETE') colorClass = 'text-emerald-400';

                            return (
                                <div key={ev.id} className="text-xs flex items-start space-x-2 border-b border-slate-800/50 pb-2">
                                    <span className="font-mono text-slate-500 shrink-0">
                                        [{ev.minute.toString().padStart(3, '0')}m]
                                    </span>
                                    <span className={colorClass}>{ev.text}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );
});
