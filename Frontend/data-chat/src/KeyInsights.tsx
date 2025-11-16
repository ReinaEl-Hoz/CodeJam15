import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { OverviewCards } from "./components/OverviewCards";
import { ColumnStatistics } from "./components/ColumnStatistics";
import { CorrelationMatrix } from "./components/CorrelationMatrix";
import { InteractionPlot } from "./components/InteractionPlot";
import { TopCorrelations } from "./components/TopCorrelations";
import { type KeyInsightsData } from "./types/data";
import { BarChart3 } from "lucide-react";
import { getKeyInsights } from "./services/api";
import "./KeyInsights.css";

export default function KeyInsights() {
  const { reportId } = useParams<{ reportId: string }>();
  const [data, setData] = useState<KeyInsightsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) return;

      // reportId is the SQL query (URL encoded)
      const sqlQuery = decodeURIComponent(reportId);
      console.log("Calling getKeyInsights with query:", sqlQuery);

      // Call getKeyInsights (frontend) -> calls /api/key-insights -> calls get_key_insights (backend)
      const insightsData = await getKeyInsights(sqlQuery);
      console.log("Received insights data:", insightsData);
      console.log("Correlations:", insightsData.correlations);
      console.log("Correlation matrix:", insightsData.correlation_matrix);
      setData(insightsData as KeyInsightsData);
    };

    fetchData();
  }, [reportId]);

  // Show loading state while data is being fetched
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

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
            <OverviewCards overview={data.overview} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.correlations && data.correlations.length > 0 ? (
                <TopCorrelations correlations={data.correlations} />
              ) : (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <p className="text-sm text-slate-600">
                    Correlations require at least 2 numeric columns in your query.
                  </p>
                </div>
              )}
              {data.correlation_matrix ? (
                <CorrelationMatrix matrix={data.correlation_matrix} />
              ) : (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <p className="text-sm text-slate-600">
                    Correlation matrix requires at least 2 numeric columns in your query.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="columns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.columns.map((column) => (
                <ColumnStatistics key={column.name} column={column} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            {data.correlation_matrix && <CorrelationMatrix matrix={data.correlation_matrix} />}
            {data.correlations && <TopCorrelations correlations={data.correlations} />}
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            {data.interactions && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.interactions.map((interaction, index) => (
                  <InteractionPlot key={index} interaction={interaction} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}