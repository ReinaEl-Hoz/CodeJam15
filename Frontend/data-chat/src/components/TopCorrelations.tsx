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
    if (corr >= 0.7) return "text-green-700 bg-green-100";
    if (corr >= 0.5) return "text-yellow-700 bg-yellow-100";
    if (corr >= 0) return "text-orange-700 bg-orange-100";
    return "text-red-700 bg-red-100";
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Top Correlations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCorrelations.map((corr, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${corr.correlation >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {corr.correlation >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-700" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-700" />
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
                className={`${getCorrelationColor(corr.correlation)} text-sm px-3 py-1`}
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
