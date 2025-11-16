import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { type ColumnInfo } from "../types/data";
import { useRef } from "react";
import { exportToJPEG } from "../utils/exportUtils";

interface ColumnStatisticsProps {
  column: ColumnInfo;
}

export function ColumnStatistics({ column }: ColumnStatisticsProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const histogramData = column.histogram
    ? column.histogram.counts.map((count, i) => ({
        bin: column.histogram!.bins[i].toFixed(1),
        count,
      }))
    : [];

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">{column.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {column.type}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToJPEG(contentRef.current, `column-${column.name}`)}
          className="gap-2 bg-blue-800 text-white"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={contentRef} className="space-y-6 p-6 bg-white">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Missing Values
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl">{column.missing}</span>
                <span className="text-sm text-muted-foreground">
                  ({column.missing_percent}%)
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Unique Values
              </div>
              <div className="text-xl">{column.unique}</div>
            </div>
          </div>

          {column.stats && (
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                Statistical Summary
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Mean</div>
                  <div>{column.stats.mean != null ? column.stats.mean.toLocaleString() : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Median</div>
                  <div>{column.stats.median != null ? column.stats.median.toLocaleString() : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Std Dev</div>
                  <div>{column.stats.std != null ? column.stats.std.toLocaleString() : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Min</div>
                  <div>{column.stats.min != null ? column.stats.min.toLocaleString() : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Q25</div>
                  <div>{column.stats.q25 != null ? column.stats.q25.toLocaleString() : 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Q75</div>
                  <div>{column.stats.q75 != null ? column.stats.q75.toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {column.histogram && histogramData.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
                Distribution
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="bin" 
                    tick={{ fontSize: 10 }} 
                    interval="preserveStartEnd"
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}