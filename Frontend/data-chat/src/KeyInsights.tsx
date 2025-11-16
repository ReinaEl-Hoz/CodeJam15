import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { OverviewCards } from "./components/OverviewCards";
import { ColumnStatistics } from "./components/ColumnStatistics";
import { CorrelationMatrix } from "./components/CorrelationMatrix";
import { InteractionPlot } from "./components/InteractionPlot";
import { TopCorrelations } from "./components/TopCorrelations";
import { InsightsDisplay } from "./components/InsightsDisplay";
import { type KeyInsightsData } from "./types/data";
import { BarChart3 } from "lucide-react";
import { getKeyInsights, generateInsights } from "./services/api";
import "./KeyInsights.css";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function KeyInsights() {
    const { reportId } = useParams<{ reportId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<KeyInsightsData | null>(null);
    const [nlInsights, setNlInsights] = useState<string[]>([]);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const fetchedReportIdRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!reportId) return;
            
            // Prevent double-fetching in React StrictMode (only if same reportId)
            if (fetchedReportIdRef.current === reportId) return;
            fetchedReportIdRef.current = reportId;
            
            // Reset state for new reportId
            setData(null);
            setNlInsights([]);

            // reportId is the SQL query (URL encoded)
            const sqlQuery = decodeURIComponent(reportId);
            console.log("Calling getKeyInsights with query:", sqlQuery);

            // Call getKeyInsights (frontend) -> calls /api/key-insights -> calls get_key_insights (backend)
            const insightsData = await getKeyInsights(sqlQuery);
            console.log("Received insights data:", insightsData);
            console.log("Correlations:", insightsData.correlations);
            console.log("Correlation matrix:", insightsData.correlation_matrix);
            console.log("Columns:", insightsData.columns);
            console.log("Columns length:", insightsData.columns?.length);
            setData(insightsData as KeyInsightsData);

            // Generate NL insights
            setInsightsLoading(true);
            try {
                console.log("Generating NL insights...");
                const insightsText = await generateInsights(insightsData as KeyInsightsData, sqlQuery);
                console.log("=".repeat(70));
                console.log("NATURAL LANGUAGE INSIGHTS (from frontend):");
                console.log("=".repeat(70));
                console.log(insightsText);
                console.log("=".repeat(70));
                
                // Parse insights (format: "INSIGHT 1: ... INSIGHT 2: ... INSIGHT 3: ...")
                console.log("Raw insights text:", insightsText);
                console.log("Insights text length:", insightsText.length);
                
                // Try multiple parsing strategies
                let parsedInsights: string[] = [];
                
                // Strategy 1: Match pattern "INSIGHT X: ..." (captures everything until next INSIGHT or end)
                const insightMatches = insightsText.match(/INSIGHT \d+:\s*(.+?)(?=INSIGHT \d+:|$)/gis);
                if (insightMatches && insightMatches.length > 0) {
                    parsedInsights = insightMatches.map(match => {
                        // Remove the "INSIGHT X:" part and trim
                        return match.replace(/^INSIGHT \d+:\s*/i, '').trim();
                    });
                } else {
                    // Strategy 2: Split by pattern and filter
                    parsedInsights = insightsText
                        .split(/INSIGHT \d+:/i)
                        .filter(insight => insight.trim().length > 0)
                        .map(insight => insight.trim());
                    
                    // If first item is empty or very short (text before first "INSIGHT 1:"), remove it
                    if (parsedInsights.length > 0 && parsedInsights[0].length < 10) {
                        parsedInsights = parsedInsights.slice(1);
                    }
                }
                
                console.log("Parsed insights:", parsedInsights);
                console.log("Parsed insights length:", parsedInsights.length);
                
                setNlInsights(parsedInsights);
            } catch (error) {
                console.error("Error generating NL insights:", error);
                setNlInsights([]);
            } finally {
                setInsightsLoading(false);
            }
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
            <header className="bg-white border-b sticky top-0 shadow-sm">
                <div className="container mx-auto py-5">
                    <div className="flex gap-4">
                        <div className='pt-4 pl-4 flex flex-row gap-2'>
                            <div><button
                                onClick={() => navigate(-1)} // go back
                                className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
                            >
                                <ArrowLeft className="w-4 h-4" />

                            </button></div>
                            <div className='text-blue-800 font-bold'><p>Back to Search</p></div>
                        </div>
                        <div className="p-3 bg-blue-800 rounded-xl shadow-md">
                            <BarChart3 className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl">Data Analytics & Insights</h1>
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
                  <TabsTrigger value="insights" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
                      Insights
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

          <TabsContent value="insights" className="space-y-6">
              <InsightsDisplay insights={nlInsights} loading={insightsLoading} />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}