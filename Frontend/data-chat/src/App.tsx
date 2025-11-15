import { useState } from 'react';
import { Search, BarChart3, LineChart, TrendingUp, Plus, Sparkles, Calendar } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'area';
  data: any[];
  insight?: string;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Sales Analysis Q4',
      preview: 'Show me quarterly sales trends...',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      title: 'Customer Retention',
      preview: 'Analyze customer retention rates...',
      timestamp: new Date(Date.now() - 86400000),
    },
  ]);
  
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setCharts([]);
  };

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    // Create new conversation if none is active
    if (!activeConversation) {
      const newConvId = `conv-${Date.now()}`;
      const newConversation: Conversation = {
        id: newConvId,
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        preview: content,
        timestamp: new Date(),
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversation(newConvId);
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: 'I\'ve analyzed your query and generated the visualization. The data reveals interesting patterns that can help inform your decisions.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Generate sample chart
      const chartTypes: ('line' | 'bar' | 'area')[] = ['line', 'bar', 'area'];
      const newChart: ChartData = {
        id: `chart-${Date.now()}`,
        title: content.slice(0, 40),
        type: chartTypes[Math.floor(Math.random() * chartTypes.length)],
        data: Array.from({ length: 8 }, (_, i) => ({
          label: `Point ${i + 1}`,
          value: Math.floor(Math.random() * 500) + 100,
          secondary: Math.floor(Math.random() * 400) + 150,
        })),
        insight: 'The data shows significant growth with a 23% increase compared to the previous period.',
      };
      setCharts((prev) => [newChart, ...prev]);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

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
          <div className="text-xs font-semibold text-slate-500 px-3 mb-2">Recent</div>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                activeConversation === conv.id
                  ? 'bg-white shadow-sm border border-slate-200'
                  : 'hover:bg-white/60'
              }`}
            >
              <div className="font-medium text-sm text-slate-900 truncate">
                {conv.title}
              </div>
              <div className="text-xs text-slate-500 truncate mt-1">
                {conv.preview}
              </div>
            </button>
          ))}
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
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                  Ask anything about your data
                </h2>
                <p className="text-slate-600 mb-8 max-w-md">
                  Type a question or describe what you'd like to visualize, and I'll generate insights and charts instantly.
                </p>
                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  <button
                    onClick={() => handleSendMessage('Show me sales trends over time')}
                    className="p-4 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-900">Sales Trends</span>
                    </div>
                    <p className="text-sm text-slate-600">Analyze sales performance over time</p>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Compare revenue by category')}
                    className="p-4 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-900">Revenue Comparison</span>
                    </div>
                    <p className="text-sm text-slate-600">Break down revenue by different categories</p>
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
                        <Sparkles className="w-4 h-4 text-white" />
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
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="p-6 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your data..."
                className="w-full px-5 py-4 pr-12 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Visualizations */}
        <div className="w-1/2 flex flex-col bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-lg font-semibold text-slate-900">Visualizations</h2>
            <p className="text-sm text-slate-600 mt-1">
              {charts.length > 0
                ? `${charts.length} chart${charts.length !== 1 ? 's' : ''} generated`
                : 'Charts will appear here'}
            </p>
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
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {chart.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>Just now</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                        {chart.type}
                      </span>
                    </div>

                    {/* Simple Chart Visualization */}
                    <div className="h-48 flex items-end justify-between gap-2 mb-4">
                      {chart.data.map((point, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-600 hover:to-indigo-500"
                            style={{
                              height: `${(point.value / 600) * 100}%`,
                              minHeight: '8px',
                            }}
                          />
                          <span className="text-xs text-slate-500">{point.label}</span>
                        </div>
                      ))}
                    </div>

                    {chart.insight && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}