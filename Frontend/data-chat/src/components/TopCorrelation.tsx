import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { type CorrelationPair } from "../types/data";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TopCorrelationsProps {
  correlations: CorrelationPair[];
}

export function TopCorrelations({ correlations }: TopCorrelationsProps) {
  const sortedCorrelations = [...correlations].sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
  );

  const getCorrelationColor = (corr: number) => {
    if (corr >= 0.7) return "text-green-600";
    if (corr >= 0.5) return "text-yellow-600";
    if (corr >= 0) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Correlations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCorrelations.map((corr, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white">
                  {corr.correlation >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm">
                    <span>{corr.col1}</span>
                    <span className="text-muted-foreground mx-2">↔</span>
                    <span>{corr.col2}</span>
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={getCorrelationColor(corr.correlation)}
              >
                {corr.correlation.toFixed(2)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
