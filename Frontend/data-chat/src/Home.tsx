import React, { useState, useEffect } from 'react';
import {
  Search,
  BarChart3,
  LineChart,
  TrendingUp,
  Plus,
  Calendar,
  Download,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import Plot from 'react-plotly.js';
import { sendChatMessage } from './services/api';
import type { PlotlyData } from './services/api';
import { useNavigate } from 'react-router-dom';

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

  // === Analytics state ===
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [copiedChartId, setCopiedChartId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Predefined suggestions
  const allSuggestions = [
    'Show me daily revenue trends',
    'Show me revenue by product',
    'Show me revenue by customer',
    'Show payroll by department',
    'Show expenses over time',
    'Compare revenue vs expenses',
    'Analyze sales performance',
    'Show quarterly revenue',
    'Display customer analytics',
    'Show department spending',
  ];

  // === Load / save conversations ===
  useEffect(() => {
    const saved = localStorage.getItem('dataAnalyticsConversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: (conv.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          charts: conv.charts || [],
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('dataAnalyticsConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (activeConversation) {
      const conv = conversations.find(c => c.id === activeConversation);
      if (conv) {
        setCharts(conv.charts);
      }
    } else {
      setCharts([]);
    }
  }, [activeConversation, conversations]);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSuggestions(allSuggestions);
    } else {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  }, [inputValue]);

  const handleNewConversation = () => {
    setActiveConversation(null);
    setCharts([]);
    setCompareMode(false);
    setSelectedCharts([]);
    setInputValue('');
  };

  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation === convId) {
      setActiveConversation(null);
      setCharts([]);
      setCompareMode(false);
      setSelectedCharts([]);
    }
  };

  // === Search handling ===
  const handleSearch = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Hide suggestions when searching
    setShowSuggestions(false);
    // Clear any previous error
    setErrorMessage(null);

    let currentConvId = activeConversation;

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

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConvId
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      )
    );

    setInputValue('');
    setIsLoading(true);

    try {
      // Call chat API
      const response = await sendChatMessage(content);

      // Check for error response
      if (!response.success || response.error) {
        const errorMsg = response.error || 'Sorry, I couldn\'t process your request. Please try asking about the database tables: customers, products, orders, departments, payroll, expenses, or daily_revenue. \nOnly simple line or bar charts are supported.';
        setErrorMessage(errorMsg);
        return;
      }

      if (response.success && response.queries && response.queries.length > 0) {
        // Process all queries (handle multiple charts)
        const updatedCharts: ChartData[] = [...charts];
        const aiMessages: Message[] = [];
        let hasQueryError = false;
        let queryErrorMsg = '';

        for (const query of response.queries) {
          // Add AI message with SQL query
          const dataInfo = query.data && query.data.length > 0 
            ? `\n\nData: ${query.data.length} rows returned`
            : query.error 
              ? `\n\nError: ${query.error}`
              : '\n\nNo data returned';

          aiMessages.push({
            id: `msg-${Date.now()}-${query.name}`,
            role: 'ai',
            content: `I've generated a SQL query for your request:\n\n\`\`\`sql\n${query.sql}\n\`\`\`\n\nChart Type: ${query.suggested_chart.type}\nTitle: ${query.suggested_chart.title}${dataInfo}`,
            timestamp: new Date(),
          });

          // Use Plotly data from backend
          if (query.plotly_data) {
            updatedCharts.push({
              id: `chart-${Date.now()}-${query.name}`,
              title: query.suggested_chart.title,
              plotlyData: query.plotly_data,
              insight: query.error ? `Error: ${query.error}` : `${query.sql}`,
            });
          } else if (query.error) {
            // Query had an error
            hasQueryError = true;
            queryErrorMsg = query.error;
            aiMessages.push({
              id: `msg-${Date.now()}-error-${query.name}`,
              role: 'ai',
              content: `Error executing query: ${query.error}`,
              timestamp: new Date(),
            });
          }
        }

        // Show error popup if any query failed, otherwise clear error
        if (hasQueryError) {
          setErrorMessage(`Error executing query: ${queryErrorMsg}`);
        } else {
          setErrorMessage(null); // Clear error on success
        }

        // Update conversations with messages and charts
        setConversations(prev =>
          prev.map(conv =>
            conv.id === currentConvId
              ? { 
                  ...conv, 
                  messages: [...conv.messages, ...aiMessages],
                  charts: updatedCharts
                }
              : conv
          )
        );

        setCharts(updatedCharts);
      } else {
        // Error response
        setErrorMessage(`Sorry, I encountered an error: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setErrorMessage(`Sorry, I couldn't process your request. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadChart = (chart: ChartData, chartId: string) => {
    const plotlyDiv = document.getElementById(chartId);
    if (plotlyDiv) {
      // @ts-ignore
      window.Plotly.downloadImage(plotlyDiv, {
        format: 'png',
        width: 1200,
        height: 800,
        filename: `${chart.title.replace(/\s+/g, '_')}`,
      });
    }
  };

  // === Chart type switching ===
  const setChartTypeForChart = (chartId: string, type: ChartType) => {
    setChartTypes(prev => ({
      ...prev,
      [chartId]: type,
    }));
  };

  const getDisplayTypeLabel = (chart: ChartData): string => {
    const override = chartTypes[chart.id];
    if (override) return override;

    if (Array.isArray(chart.plotlyData)) {
      return 'multi-series';
    }

    const plotlyData = chart.plotlyData as PlotlyData;
    // If it's scatter with lines mode, display as 'line'
    if (plotlyData.type === 'scatter' && plotlyData.mode === 'lines') {
      return 'line';
    }
    // Otherwise use the type directly
    return plotlyData.type || 'chart';
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

  // === Compare mode ===
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
        return [prev[1], chartId];
      }
      return [...prev, chartId];
    });
  };

  const selectedChartObjects: ChartData[] = charts.filter(c =>
    selectedCharts.includes(c.id)
  );

  // 🔹 Main analytics UI with iOS Siri Search
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            New Search
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs font-semibold text-slate-500 px-3 mb-2">
            Recent ({conversations.length})
          </div>
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-slate-500">
              No searches yet
            </div>
          ) : (
            conversations.map(conv => (
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
                  onClick={e => handleDeleteConversation(conv.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                  title="Delete search"
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
      <div className="flex-1 flex flex-col">
        {/* iOS-style Siri Search Header */}
        <div className="p-8 pb-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          {/* Flex Container for Search Bar and Button */}
          <div className="flex items-center justify-center max-w-4xl mx-auto gap-4"> 
            <div className="flex-1 search-container"> 
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowSuggestions(true)}
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  placeholder="Ask about your data"
                  disabled={isLoading}
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl focus:shadow-2xl backdrop-blur-sm cursor-pointer"
                  style={{
                    background: showSuggestions 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.95) 100%)'
                      : 'white'
                  }}
                />

                {/* Dynamic Suggestions Dropdown */}
                {showSuggestions && !isLoading && filteredSuggestions.length > 0 && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                    }}
                  >
                    <div className="p-2 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                      <p className="text-xs font-semibold text-slate-500 px-3 py-1">SUGGESTIONS</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 flex items-center gap-3 border-b border-slate-50/50 last:border-b-0 group"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <Search className="w-4 h-4 text-blue-800 flex-shrink-0" />
                          </div>
                          <span className="text-sm text-slate-700 group-hover:text-blue-900 font-medium">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Loading State (for the search bar area) */}
              {isLoading && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-800 rounded-full animate-pulse"></div>
                    <p className="text-sm text-blue-900">Searching your data...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* DASHBOARD BUTTON */}
            <button
              onClick={() => navigate('/dashboard-builder')}
              className="flex items-center gap-2 px-4 py-4 bg-blue-800 hover:bg-blue-700 text-white rounded-2xl transition-all font-medium shadow-lg hover:shadow-xl whitespace-nowrap text-base"
            >
          
              <span>Dashboard Designer</span>
            </button>
          </div>

          {/* Error State */}
          {errorMessage && !isLoading && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-4xl mx-auto">
              <p className="text-sm text-red-900">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Visualizations */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            {charts.length === 0 && !isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
                <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mb-6">
                  <LineChart className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No results yet
                </h3>
                <p className="text-slate-600">
                  Search for data to see visualizations
                </p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Results</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {charts.length} visualization{charts.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  {charts.length > 0 && (
                    <button
                      onClick={toggleCompareMode}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full transition-all ${
                        compareMode
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      {compareMode ? 'Compare: ON' : 'Compare'}
                      {compareMode && selectedCharts.length > 0 && (
                        <span className="ml-1 text-xs text-slate-500">
                          ({selectedCharts.length}/2)
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Compare block */}
                  {compareMode && selectedChartObjects.length === 2 && (
                    <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Side-by-side comparison
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Comparing: {selectedChartObjects[0].title} vs{' '}
                            {selectedChartObjects[1].title}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedChartObjects.map(chart => {
                          const chartDivId = `compare-${chart.id}`;
                          const plotData = getTransformedData(chart);
                          return (
                            <div
                              key={chart.id}
                              className="border border-slate-200 rounded-xl p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-900 truncate pr-2">
                                  {chart.title}
                                </h4>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
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
                                    font: {
                                      family: 'system-ui, sans-serif',
                                      size: 10,
                                    },
                                  }}
                                  config={{
                                    responsive: true,
                                    displayModeBar: false,
                                    displaylogo: false,
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
                  {charts.map(chart => {
                    const chartDivId = `chart-${chart.id}`;
                    const isSelected = selectedCharts.includes(chart.id);
                    const plotData = getTransformedData(chart);

                    return (
                      <div
                        key={chart.id}
                        className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                          compareMode
                            ? isSelected
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-slate-200 hover:border-blue-200 hover:shadow-md cursor-pointer'
                            : 'border-slate-200'
                        }`}
                        onClick={() => {
                          if (compareMode) toggleChartSelection(chart.id);
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
                                      ? 'bg-blue-800 text-white border-blue-800'
                                      : 'bg-white text-slate-400 border-slate-300'
                                  }`}
                                >
                                  {isSelected
                                    ? selectedCharts.indexOf(chart.id) + 1
                                    : '+'}
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
                        <button
                              onClick={() => navigate(`/report/${chart.id}`)}
                              className="flex items-center gap-1 px-4 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-2xl transition-all text-xs font-semibold shadow-lg hover:shadow-xl whitespace-nowrap text-base"
                            >
                              <TrendingUp className="w-4 h-4" />
                              View Key Insights
                            </button>
                            {/* Chart type switcher */}
                            <div className="inline-flex items-center bg-slate-50 rounded-full border border-slate-200 overflow-hidden">
                              
                              <button
                                type="button"
                                onClick={() => setChartTypeForChart(chart.id, 'bar')}
                                className={`p-1.5 border-r border-slate-200 ${
                                  chartTypes[chart.id] === 'bar'
                                    ? 'bg-blue-800 text-white'
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
                                    ? 'bg-blue-800 text-white'
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
                                    ? 'bg-blue-800 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                title="Scatter plot"
                              >
                                <TrendingUp className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
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

                        <div id={chartDivId} onClick={e => e.stopPropagation()}>
                          <Plot
                            data={plotData}
                            layout={{
                              autosize: true,
                              margin: { l: 50, r: 30, t: 30, b: 50 },
                              paper_bgcolor: 'rgba(0,0,0,0)',
                              plot_bgcolor: 'rgba(0,0,0,0)',
                              font: { family: 'system-ui, sans-serif' },
                            }}
                            config={{
                              responsive: true,
                              displayModeBar: false,
                              displaylogo: false,
                            }}
                            style={{ width: '100%', height: '400px' }}
                          />
                        </div>

                        {chart.insight && (
                          <div className="flex items-start gap-4 mt-4">
                            <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-semibold text-slate-700">
                                  SQL Query
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(chart.insight || '');
                                    setCopiedChartId(chart.id);
                                    setTimeout(() => setCopiedChartId(null), 2000);
                                  }}
                                  className="p-1.5 hover:bg-slate-200 rounded transition-all"
                                  title="Copy SQL query"
                                >
                                  {copiedChartId === chart.id ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <pre className="text-xs text-slate-800 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                  <code>{chart.insight}</code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}