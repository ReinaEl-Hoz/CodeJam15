import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "./ui/badge";
import { type Interaction } from "../types/data";
import { useRef } from "react";
import { exportToJPEG } from "../utils/exportUtils";

interface InteractionPlotProps {
  interaction: Interaction;
}

export function InteractionPlot({ interaction }: InteractionPlotProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const getCorrelationColor = (corr: number) => {
    const abs = Math.abs(corr);
    if (abs >= 0.7) return "bg-green-600 text-white";
    if (abs >= 0.5) return "bg-yellow-600 text-white";
    return "bg-orange-600 text-white";
  };

  const getCorrelationStrength = (corr: number) => {
    const abs = Math.abs(corr);
    if (abs >= 0.7) return "Strong";
    if (abs >= 0.5) return "Moderate";
    return "Weak";
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">
            {interaction.col1} vs {interaction.col2}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {getCorrelationStrength(interaction.correlation)}
            </Badge>
            <Badge className={`text-xs ${getCorrelationColor(interaction.correlation)}`}>
              r = {interaction.correlation.toFixed(2)}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToJPEG(contentRef.current, `interaction-${interaction.col1}-${interaction.col2}`)}
          className="gap-2 bg-blue-800 text-white"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={contentRef}>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="x" 
              name={interaction.col1}
              tick={{ fontSize: 11 }}
              label={{ 
                value: interaction.col1, 
                position: 'insideBottom', 
                offset: -15, 
                fontSize: 12,
                fill: '#6b7280'
              }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              dataKey="y" 
              name={interaction.col2}
              tick={{ fontSize: 11 }}
              label={{ 
                value: interaction.col2, 
                angle: -90, 
                position: 'insideLeft',
                fontSize: 12,
                fill: '#6b7280'
              }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: any) => 
                typeof value === 'number' ? value.toFixed(2) : value
              }
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Scatter 
              data={interaction.data} 
              fill="#2563eb" 
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
