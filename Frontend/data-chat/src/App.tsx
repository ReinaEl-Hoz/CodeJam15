import { useState, useEffect } from 'react';
import { Search, BarChart3, LineChart, TrendingUp, Plus, Calendar, Download, Trash2 } from 'lucide-react';
import Plot from 'react-plotly.js';
import { fetchChartData } from './services/api';
import type { PlotlyData } from './services/api';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChartData {
  id: string;
  title: string;
  plotlyData: PlotlyData | PlotlyData[];
  insight?: string;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
  charts: ChartData[];
}

type ChartType = 'bar' | 'line' | 'scatter';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dataAnalyticsConversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('dataAnalyticsConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Load active conversation
  useEffect(() => {
    if (activeConversation) {
      const conv = conversations.find(c => c.id === activeConversation);
      if (conv) {
        setMessages(conv.messages);
        setCharts(conv.charts);
      }
    }
  }, [activeConversation, conversations]);

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setCharts([]);
    setCompareMode(false);
    setSelectedCharts([]);
  };

  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation === convId) {
      setActiveConversation(null);
      setMessages([]);
      setCharts([]);
      setCompareMode(false);
      setSelectedCharts([]);
    }
  };

  // Map user queries to backend query types
  const mapQueryToType = (query: string): string => {
    const lowercaseQuery = query.toLowerCase();
    
    if (lowercaseQuery.includes('daily') || lowercaseQuery.includes('day')) {
      return 'daily_revenue';
    } else if (lowercaseQuery.includes('product')) {
      return 'revenue_by_product';
    } else if (lowercaseQuery.includes('customer')) {
      return 'revenue_by_customer';
    } else if (lowercaseQuery.includes('payroll') || lowercaseQuery.includes('salary') || lowercaseQuery.includes('department')) {
      return 'payroll_by_department';
    } else if (lowercaseQuery.includes('expense')) {
      return 'expenses_over_time';
    } else if (lowercaseQuery.includes('compare') || lowercaseQuery.includes('vs')) {
      return 'revenue_vs_expenses';
    }
    
    // Default to revenue by product
    return 'revenue_by_product';
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let currentConvId = activeConversation;

    // Create new conversation if none is active
    if (!currentConvId) {
      currentConvId = `conv-${Date.now()}`;
      const newConversation: Conversation = {
        id: currentConvId,
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        preview: content,
        timestamp: new Date(),
        messages: [],
        charts: [],
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(currentConvId);
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Update conversation with new message
    setConversations(prev => prev.map(conv => 
      conv.id === currentConvId 
        ? { ...conv, messages: newMessages }
        : conv
    ));

    try {
      // Determine which query to run based on user input
      const queryType = mapQueryToType(content);
      
      // Fetch real data from backend
      const plotlyData = await fetchChartData(queryType);
      
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: `I've analyzed your query and generated a visualization showing ${queryType.replace(/_/g, ' ')}. The data has been fetched from the database.`,
        timestamp: new Date(),
      };
      
      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);

      // Create chart with real Plotly data
      const newChart: ChartData = {
        id: `chart-${Date.now()}`,
        title: content.slice(0, 60),
        plotlyData: plotlyData,
        insight: 'Data retrieved from company database and visualized using Plotly.',
      };
      
      const updatedCharts = [newChart, ...charts];
      setCharts(updatedCharts);

      // Update conversation
      setConversations(prev => prev.map(conv => 
        conv.id === currentConvId 
          ? { ...conv, messages: updatedMessages, charts: updatedCharts }
          : conv
      ));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'ai',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the backend server is running.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadChart = (chart: ChartData, chartId: string) => {
    const plotlyDiv = document.getElementById(chartId);
    if (plotlyDiv) {
      // @ts-ignore - Plotly is available on window
      window.Plotly.downloadImage(plotlyDiv, {
        format: 'png',
        width: 1200,
        height: 800,
        filename: `${chart.title.replace(/\s+/g, '_')}`
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // === Chart type switching helpers ===
  const setChartTypeForChart = (chartId: string, type: ChartType) => {
    setChartTypes(prev => ({
      ...prev,
      [chartId]: type,
    }));
  };

  const getDisplayTypeLabel = (chart: ChartData): string => {
    const override = chartTypes[chart.id];
    if (override) return override;
    const base = Array.isArray(chart.plotlyData)
      ? 'multi-series'
      : (chart.plotlyData as PlotlyData).type || 'chart';
    return base;
  };

  const getTransformedData = (chart: ChartData): any[] => {
    const baseDataArray: any[] = Array.isArray(chart.plotlyData)
      ? (chart.plotlyData as any[])
      : [chart.plotlyData as any];

    const override = chartTypes[chart.id];
    if (!override) return baseDataArray;

    return baseDataArray.map(trace => {
      const newTrace = { ...trace };
      if (override === 'bar') {
        newTrace.type = 'bar';
        delete newTrace.mode;
      } else if (override === 'scatter') {
        newTrace.type = 'scatter';
        newTrace.mode = newTrace.mode || 'markers';
      } else if (override === 'line') {
        newTrace.type = 'scatter';
        newTrace.mode = 'lines';
      }
      return newTrace;
    });
  };

  // === Compare mode helpers ===
  const toggleCompareMode = () => {
    setCompareMode(prev => !prev);
    setSelectedCharts([]);
  };

  const toggleChartSelection = (chartId: string) => {
    setSelectedCharts(prev => {
      if (prev.includes(chartId)) {
        return prev.filter(id => id !== chartId);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection with the new one
        return [prev[1], chartId];
      }
      return [...prev, chartId];
    });
  };

  const selectedChartObjects: ChartData[] = charts.filter(c =>
    selectedCharts.includes(c.id)
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs font-semibold text-slate-500 px-3 mb-2">
            Recent ({conversations.length})
          </div>
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-slate-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative mb-1 rounded-lg transition-all ${
                  activeConversation === conv.id
                    ? 'bg-white shadow-sm border border-slate-200'
                    : 'hover:bg-white/60'
                }`}
              >
                <button
                  onClick={() => setActiveConversation(conv.id)}
                  className="w-full text-left p-3 pr-10"
                >
                  <div className="font-medium text-sm text-slate-900 truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-1">
                    {conv.preview}
                  </div>
                </button>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <BarChart3 className="w-4 h-4" />
            <span>Data Analytics</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Chat/Search */}
        <div className="w-1/2 flex flex-col border-r border-slate-200">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  Ask anything about your data
                </h2>
                <p className="text-slate-600 mb-8 max-w-md">
                  Type a question or describe what you'd like to visualize, and I'll generate insights and charts from the database.
                </p>
                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  <button
                    onClick={() => handleSendMessage('Show me daily revenue trends')}
                    className="p-4 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-900">Daily Revenue</span>
                    </div>
                    <p className="text-sm text-slate-600">Analyze daily revenue trends</p>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Show me revenue by product')}
                    className="p-4 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-900">Product Revenue</span>
                    </div>
                    <p className="text-sm text-slate-600">Break down revenue by product</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'ai' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-slate-100 text-slate-900">
                      <p className="text-sm">Analyzing your data...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your data..."
                disabled={isLoading}
                className="w-full px-5 py-4 pr-12 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Visualizations */}
        <div className="w-1/2 flex flex-col bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Visualizations</h2>
              <p className="text-sm text-slate-600 mt-1">
                {charts.length > 0
                  ? `${charts.length} chart${charts.length !== 1 ? 's' : ''} generated`
                  : 'Charts will appear here'}
              </p>
            </div>
            {charts.length > 0 && (
              <button
                onClick={toggleCompareMode}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-full transition-all ${
                  compareMode
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                {compareMode ? 'Compare: ON' : 'Compare charts'}
                {compareMode && selectedCharts.length > 0 && (
                  <span className="ml-1 text-[10px] text-slate-500">
                    ({selectedCharts.length}/2)
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {charts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-24 h-24 bg-slate-200 rounded-2xl flex items-center justify-center mb-6">
                  <LineChart className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No visualizations yet
                </h3>
                <p className="text-slate-600">
                  Start by asking a question about your data
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Comparison block */}
                {compareMode && selectedChartObjects.length === 2 && (
                  <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Side-by-side comparison
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Comparing: {selectedChartObjects[0].title} vs {selectedChartObjects[1].title}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedChartObjects.map(chart => {
                        const chartDivId = `compare-${chart.id}`;
                        const plotData = getTransformedData(chart);

                        return (
                          <div key={chart.id} className="border border-slate-200 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-slate-900 truncate pr-2">
                                {chart.title}
                              </h4>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-medium rounded-full">
                                {getDisplayTypeLabel(chart)}
                              </span>
                            </div>
                            <div id={chartDivId}>
                              <Plot
                                data={plotData}
                                layout={{
                                  autosize: true,
                                  margin: { l: 40, r: 20, t: 20, b: 40 },
                                  paper_bgcolor: 'rgba(0,0,0,0)',
                                  plot_bgcolor: 'rgba(0,0,0,0)',
                                  font: { family: 'system-ui, sans-serif', size: 10 }
                                }}
                                config={{
                                  responsive: true,
                                  displayModeBar: true,
                                  displaylogo: false
                                }}
                                style={{ width: '100%', height: '300px' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Individual charts */}
                {charts.map((chart) => {
                  const chartDivId = `chart-${chart.id}`;
                  const isSelected = selectedCharts.includes(chart.id);
                  const plotData = getTransformedData(chart);

                  return (
                    <div
                      key={chart.id}
                      className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                        compareMode
                          ? isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                            : 'border-slate-200 hover:border-indigo-200 hover:shadow-md cursor-pointer'
                          : 'border-slate-200'
                      }`}
                      onClick={() => {
                        if (compareMode) {
                          toggleChartSelection(chart.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {chart.title}
                            </h3>
                            {compareMode && (
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full border ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-400 border-slate-300'
                                }`}
                              >
                                {isSelected ? selectedCharts.indexOf(chart.id) + 1 : '+'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>Just now</span>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Chart type switcher */}
                          <div className="inline-flex items-center bg-slate-50 rounded-full border border-slate-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setChartTypeForChart(chart.id, 'bar')}
                              className={`p-1.5 border-r border-slate-200 ${
                                chartTypes[chart.id] === 'bar'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title="Bar chart"
                            >
                              <BarChart3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartTypeForChart(chart.id, 'line')}
                              className={`p-1.5 border-r border-slate-200 ${
                                chartTypes[chart.id] === 'line'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title="Line chart"
                            >
                              <LineChart className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartTypeForChart(chart.id, 'scatter')}
                              className={`p-1.5 ${
                                chartTypes[chart.id] === 'scatter'
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              title="Scatter plot"
                            >
                              <TrendingUp className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                            {getDisplayTypeLabel(chart)}
                          </span>
                          <button
                            onClick={() => downloadChart(chart, chartDivId)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            title="Download chart"
                          >
                            <Download className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </div>

                      {/* Plotly Chart */}
                      <div id={chartDivId} onClick={e => e.stopPropagation()}>
                        <Plot
                          data={plotData}
                          layout={{
                            autosize: true,
                            margin: { l: 50, r: 30, t: 30, b: 50 },
                            paper_bgcolor: 'rgba(0,0,0,0)',
                            plot_bgcolor: 'rgba(0,0,0,0)',
                            font: { family: 'system-ui, sans-serif' }
                          }}
                          config={{
                            responsive: true,
                            displayModeBar: true,
                            displaylogo: false
                          }}
                          style={{ width: '100%', height: '400px' }}
                        />
                      </div>

                      {chart.insight && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-slate-700 mb-1">
                                Key Insight
                              </div>
                              <p className="text-sm text-slate-600">{chart.insight}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
