import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { OverviewCards } from "./components/OverviewCards";
import { ColumnStatistics } from "./components/ColumnStatistics";
import { CorrelationMatrix } from "./components/CorrelationMatrix";
import { InteractionPlot } from "./components/InteractionPlot";
import { TopCorrelations } from "./components/TopCorrelations";
import { type KeyInsightsData } from "./types/data";
import { BarChart3 } from "lucide-react";
import "./KeyInsights.css";

const sampleData: KeyInsightsData = {
  overview: {
    row_count: 1000,
    column_count: 8,
    memory_usage: 2.5,
    duplicate_rows: 15,
  },
  columns: [
    {
      name: "age",
      type: "int64",
      missing: 5,
      missing_percent: 0.5,
      unique: 45,
      min_samples: ["18", "19", "20", "21", "22"],
      max_samples: ["65", "64", "63", "62", "61"],
      stats: {
        mean: 35.2,
        median: 34,
        std: 12.3,
        min: 18,
        max: 65,
        q25: 27,
        q75: 45,
      },
      histogram: {
        counts: [
          45, 78, 120, 145, 160, 155, 140, 125, 95, 67, 45, 32, 20, 15, 10, 8,
          5, 3, 2, 1,
        ],
        bins: [
          18, 20.35, 22.7, 25.05, 27.4, 29.75, 32.1, 34.45, 36.8, 39.15, 41.5,
          43.85, 46.2, 48.55, 50.9, 53.25, 55.6, 57.95, 60.3, 62.65, 65,
        ],
      },
    },
    {
      name: "revenue",
      type: "float64",
      missing: 0,
      missing_percent: 0,
      unique: 876,
      min_samples: ["10000", "10250", "10500", "10750", "11000"],
      max_samples: ["125000", "124500", "124000", "123500", "123000"],
      stats: {
        mean: 52340.5,
        median: 48200,
        std: 23450.8,
        min: 10000,
        max: 125000,
        q25: 35000,
        q75: 68000,
      },
      histogram: {
        counts: [
          25, 48, 89, 124, 145, 167, 156, 132, 98, 72, 54, 38, 24, 16, 8, 4, 2,
          1, 1, 1,
        ],
        bins: [
          10000, 15750, 21500, 27250, 33000, 38750, 44500, 50250, 56000, 61750,
          67500, 73250, 79000, 84750, 90500, 96250, 102000, 107750, 113500,
          119250, 125000,
        ],
      },
    },
  ],
  correlations: [
    { col1: "age", col2: "revenue", correlation: 0.72 },
    { col1: "age", col2: "experience", correlation: 0.85 },
  ],
  correlation_matrix: {
    columns: ["age", "revenue", "experience", "satisfaction"],
    data: [
      [1.0, 0.72, 0.85, 0.45],
      [0.72, 1.0, 0.68, 0.55],
      [0.85, 0.68, 1.0, 0.52],
      [0.45, 0.55, 0.52, 1.0],
    ],
  },
  interactions: [
    {
      col1: "age",
      col2: "experience",
      correlation: 0.85,
      data: Array.from({ length: 100 }, () => ({
        x: Math.random() * 47 + 18,
        y: Math.random() * 30 + 1,
      })),
    },
    {
      col1: "age",
      col2: "revenue",
      correlation: 0.72,
      data: Array.from({ length: 100 }, () => ({
        x: Math.random() * 47 + 18,
        y: Math.random() * 115000 + 10000,
      })),
    },
  ],
};

export default function KeyInsights() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-800 rounded-xl shadow-md">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl">Data Analytics Platform</h1>
              <p className="text-sm text-muted-foreground">
                Advanced insights, correlations, and statistical analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white p-1.5 shadow-sm border-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="columns" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              Column Statistics
            </TabsTrigger>
            <TabsTrigger value="correlations" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              Correlations
            </TabsTrigger>
            <TabsTrigger value="interactions" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              Interactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <OverviewCards overview={sampleData.overview} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopCorrelations correlations={sampleData.correlations} />
              <CorrelationMatrix matrix={sampleData.correlation_matrix} />
            </div>
          </TabsContent>

          <TabsContent value="columns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sampleData.columns.map((column) => (
                <ColumnStatistics key={column.name} column={column} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            <CorrelationMatrix matrix={sampleData.correlation_matrix} />
            <TopCorrelations correlations={sampleData.correlations} />
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sampleData.interactions.map((interaction, index) => (
                <InteractionPlot key={index} interaction={interaction} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}