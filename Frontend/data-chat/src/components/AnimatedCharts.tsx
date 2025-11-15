import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

export interface AnimatedChartProps {
  data: any[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  index: number;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnimatedChart({ data, type, index }: AnimatedChartProps) {
  switch (type) {
    case 'line':
      return (
        <div className="w-full h-full bg-white p-4 rounded-lg">
          <h3 className="text-sm text-slate-700 mb-2">Revenue Trend #{index}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ fill: '#4f46e5', r: 3 }}
                animationDuration={1000}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    case 'bar':
      return (
        <div className="w-full h-full bg-white p-4 rounded-lg">
          <h3 className="text-sm text-slate-700 mb-2">Sales Data #{index}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Bar
                dataKey="value"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'area':
      return (
        <div className="w-full h-full bg-white p-4 rounded-lg">
          <h3 className="text-sm text-slate-700 mb-2">Growth Metrics #{index}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={1000}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );

    case 'pie':
      return (
        <div className="w-full h-full bg-white p-4 rounded-lg flex flex-col items-center">
          <h3 className="text-sm text-slate-700 mb-2">Distribution #{index}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
                isAnimationActive={true}
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      );

    case 'radar':
      return (
        <div className="w-full h-full bg-white p-4 rounded-lg flex flex-col items-center">
          <h3 className="text-sm text-slate-700 mb-2">Performance #{index}</h3>
          <ResponsiveContainer width="100%" height="85%">
            <RadarChart data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
              <Radar
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.5}
                animationDuration={1000}
                isAnimationActive={true}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );

    default:
      return null;
  }
}
