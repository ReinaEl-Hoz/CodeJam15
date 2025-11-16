import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { type CorrelationMatrix as CorrelationMatrixType } from "../types/data";
import { useRef } from "react";
import html2canvas from "html2canvas";

interface CorrelationMatrixProps {
  matrix: CorrelationMatrixType;
}

export function CorrelationMatrix({ matrix }: CorrelationMatrixProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
  if (!contentRef.current) return;

  // Clone the element
  const clone = contentRef.current.cloneNode(true) as HTMLElement;
  
  // Style the clone with padding
  clone.style.padding = '24px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  
  // Add to DOM temporarily
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.download = 'correlation-matrix.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    // Remove the clone
    document.body.removeChild(clone);
  }
};

  const getColor = (value: number) => {
    const absValue = Math.abs(value);
    if (value >= 0.7) return "#16a34a"; // green-600
    if (value >= 0.5) return "#84cc16"; // lime-500
    if (value >= 0.3) return "#eab308"; // yellow-500
    if (value >= 0) return "#f59e0b"; // amber-500
    if (value >= -0.3) return "#f97316"; // orange-500
    if (value >= -0.5) return "#ef4444"; // red-500
    return "#dc2626"; // red-600
  };

  const getTextColor = (value: number) => {
    const absValue = Math.abs(value);
    return absValue >= 0.5 ? "#ffffff" : "#1f2937";
  };

  const cellSize = 80;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Correlation Matrix</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 bg-blue-800 text-white"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={contentRef}>
          <div className="flex justify-center">
            <div className="inline-block">
            {/* Column headers */}
            <div className="flex ml-20">
              {matrix.columns.map((col, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-xs"
                  style={{ width: cellSize, height: 40 }}
                >
                  <span className="transform -rotate-45 origin-center whitespace-nowrap">
                    {col}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            {matrix.data.map((row, i) => (
              <div key={i} className="flex items-center">
                {/* Row header */}
                <div
                  className="flex items-center justify-end pr-3 text-xs"
                  style={{ width: 80 }}
                >
                  {matrix.columns[i]}
                </div>
                
                {/* Cells */}
                <div className="flex">
                  {row.map((value, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-center text-sm transition-all hover:scale-105 cursor-pointer border border-white"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(value),
                        color: getTextColor(value),
                      }}
                    >
                      {value.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: "#dc2626" }}></div>
            <span className="text-muted-foreground">-1.0 Strong Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
            <span className="text-muted-foreground">0.0 Weak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: "#16a34a" }}></div>
            <span className="text-muted-foreground">+1.0 Strong Positive</span>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}