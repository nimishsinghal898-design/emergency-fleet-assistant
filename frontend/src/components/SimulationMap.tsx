import React from 'react';
import { Vehicle, Incident } from '../types/models';
import { Card } from './Card';
import { Crosshair } from 'lucide-react';

interface SimulationMapProps {
    vehicles: Vehicle[];
    incidents: Incident[];
    selectedVehicleId?: string | null;
}

export const SimulationMap = React.memo(function SimulationMap({ vehicles, incidents, selectedVehicleId }: SimulationMapProps) {
    // Transform coordinates from 0-100 (where 0,0 is lower left) 
    // to SVG viewbox 0-100 (where 0,0 is upper left)
    const tx = (x: number) => x;
    const ty = (y: number) => 100 - y;

    return (
        <Card title="Operational Region Map" action={<Crosshair className="w-4 h-4 text-slate-500" />}>
            <div className="w-full aspect-square relative bg-slate-950 border border-slate-800 rounded-md overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Grid Lines */}
                    <g className="text-slate-800" strokeWidth="0.5" stroke="currentColor">
                        {[25, 50, 75].map(v => (
                            <line key={`v-${v}`} x1={v} y1="0" x2={v} y2="100" strokeDasharray={v === 50 ? "" : "2,2"} />
                        ))}
                        {[25, 50, 75].map(v => (
                            <line key={`h-${v}`} x1="0" y1={v} x2="100" y2={v} strokeDasharray={v === 50 ? "" : "2,2"} />
                        ))}
                    </g>
                    
                    {/* Quadrant Labels */}
                    <g className="text-slate-700 text-[6px] font-bold fill-currentColor" style={{ userSelect: 'none' }}>
                        <text x="5" y="10">UL</text>
                        <text x="55" y="10">UR</text>
                        <text x="5" y="95">LL</text>
                        <text x="55" y="95">LR</text>
                    </g>

                    {/* Incidents */}
                    {incidents.map(inc => {
                        let colorClass = 'fill-blue-500'; // Default P1/P2
                        let r = 1.2;
                        if (inc.priority === 3) {
                            colorClass = 'fill-red-500 animate-pulse'; // P3 is prominent
                            r = 1.8;
                        } else if (inc.priority === 2) {
                            colorClass = 'fill-amber-500';
                            r = 1.5;
                        }

                        if (inc.status === 'COMPLETED') {
                            colorClass = 'fill-slate-600';
                            r = 1;
                        } else if (inc.status === 'ASSIGNED') {
                            colorClass = 'fill-blue-400 opacity-50';
                        }

                        return (
                            <circle 
                                key={inc.id}
                                cx={tx(inc.x)}
                                cy={ty(inc.y)}
                                r={r}
                                className={colorClass}
                            >
                                <title>{`${inc.id} (P${inc.priority}) - ${inc.status}`}</title>
                            </circle>
                        );
                    })}

                    {/* Vehicles */}
                    {vehicles.map(v => {
                        const isSelected = selectedVehicleId === v.id;
                        const isBusy = v.status === 'BUSY';
                        
                        return (
                            <g key={v.id} transform={`translate(${tx(v.x)}, ${ty(v.y)})`}>
                                {/* Pulse ring if selected */}
                                {isSelected && (
                                    <circle cx="0" cy="0" r="4" className="fill-none stroke-emerald-400 opacity-50" strokeWidth="0.5" />
                                )}
                                <rect 
                                    x="-1.5" y="-1.5" 
                                    width="3" height="3" 
                                    className={isBusy ? "fill-amber-500" : "fill-emerald-500"} 
                                />
                                {isSelected && (
                                    <text x="2" y="-2" className="text-[4px] fill-slate-200">{v.id}</text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            
            <div className="flex justify-between items-center mt-3 text-xs text-slate-400 px-2">
                <div className="flex items-center"><div className="w-2 h-2 bg-emerald-500 mr-1.5 rounded-sm"></div> Idle Vehicle</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-amber-500 mr-1.5 rounded-sm"></div> Busy Vehicle</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-red-500 mr-1.5 rounded-full"></div> P3 Incident</div>
            </div>
        </Card>
    );
});
