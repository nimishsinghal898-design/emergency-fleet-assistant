import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CoverageRecord } from '../types/models';
import { Card } from './Card';

interface PerformanceChartsProps {
    coverage: CoverageRecord[];
}

export function PerformanceCharts({ coverage }: PerformanceChartsProps) {
    if (!coverage || coverage.length === 0) {
        return null;
    }

    return (
        <Card title="Idle Vehicles Over Time">
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={coverage}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorIdles" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                            dataKey="minute" 
                            stroke="#64748b" 
                            fontSize={12}
                            tickFormatter={(v) => `t=${v}`} 
                        />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                            itemStyle={{ color: '#f1f5f9' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area 
                            type="stepAfter" 
                            dataKey={(d) => d.idle_LL + d.idle_LR + d.idle_UL + d.idle_UR} 
                            name="Total Idle Vehicles"
                            stroke="#10b981" 
                            fillOpacity={1} 
                            fill="url(#colorIdles)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
