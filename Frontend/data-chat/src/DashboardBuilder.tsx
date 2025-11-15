import React, { useState, useRef } from 'react';
import {type Layout} from 'react-grid-layout';
import { Responsive, WidthProvider} from 'react-grid-layout';
import { Type, BarChart3, LineChart, PieChart, Activity, TrendingUp, X, Heading1, FileText, Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, LineChart as RechartsLine, Line, PieChart as RechartsPie, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Types
interface ChartData {
  [key: string]: string | number;
}

interface ChartDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: () => JSX.Element;
}

interface DashboardItem {
  id: string;
  type: 'chart' | 'text' | 'title';
  chart?: ChartDefinition;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface PositionControlProps {
  layout: Layout;
  onUpdate: (updates: Partial<Layout>) => void;
}

// Sample data for charts
const salesData: ChartData[] = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { month: 'Mar', sales: 2000, profit: 9800 },
  { month: 'Apr', sales: 2780, profit: 3908 },
  { month: 'May', sales: 1890, profit: 4800 },
  { month: 'Jun', sales: 2390, profit: 3800 }
];

const revenueData: ChartData[] = [
  { month: 'Jan', revenue: 6000 },
  { month: 'Feb', revenue: 5500 },
  { month: 'Mar', revenue: 7000 },
  { month: 'Apr', revenue: 8100 },
  { month: 'May', revenue: 7500 },
  { month: 'Jun', revenue: 9000 }
];

const categoryData: ChartData[] = [
  { name: 'Electronics', value: 4500 },
  { name: 'Clothing', value: 3200 },
  { name: 'Food', value: 2800 },
  { name: 'Books', value: 1500 },
  { name: 'Other', value: 2000 }
];

const trafficData: ChartData[] = [
  { day: 'Mon', visitors: 3400 },
  { day: 'Tue', visitors: 2800 },
  { day: 'Wed', visitors: 4200 },
  { day: 'Thu', visitors: 3800 },
  { day: 'Fri', visitors: 4600 },
  { day: 'Sat', visitors: 5200 },
  { day: 'Sun', visitors: 4800 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Pre-built chart components
const CHART_LIBRARY: ChartDefinition[] = [
  {
    id: 'sales-overview',
    name: 'Sales Overview',
    icon: BarChart3,
    component: () => (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sales" fill="#3b82f6" />
          <Bar dataKey="profit" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    )
  },
  {
    id: 'revenue-trend',
    name: 'Revenue Trend',
    icon: TrendingUp,
    component: () => (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  {
    id: 'category-distribution',
    name: 'Category Distribution',
    icon: PieChart,
    component: () => (
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPie>
      </ResponsiveContainer>
    )
  },
  {
    id: 'traffic-line',
    name: 'Weekly Traffic',
    icon: LineChart,
    component: () => (
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={trafficData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="visitors" stroke="#f59e0b" strokeWidth={2} />
        </RechartsLine>
      </ResponsiveContainer>
    )
  }
];

// Position control component
const PositionControl: React.FC<PositionControlProps> = ({ layout, onUpdate }) => {
  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-xs font-semibold text-gray-700 uppercase">Position & Size</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">X Position</label>
          <input
            type="number"
            min="0"
            max="11"
            value={layout.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Y Position</label>
          <input
            type="number"
            min="0"
            value={layout.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Width</label>
          <input
            type="number"
            min={layout.minW || 1}
            max="12"
            value={layout.w}
            onChange={(e) => onUpdate({ w: parseInt(e.target.value) || 1 })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Height</label>
          <input
            type="number"
            min={layout.minH || 1}
            value={layout.h}
            onChange={(e) => onUpdate({ h: parseInt(e.target.value) || 1 })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// Chart wrapper component
interface ChartWidgetProps {
  chart: ChartDefinition;
  onRemove: () => void;
  isSelected: boolean;
  onClick: () => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ chart, onRemove, isSelected, onClick }) => {
  const ChartComponent = chart.component;

  return (
    <div
      onClick={onClick}
      className={`h-full bg-white rounded-lg shadow-lg border-2 p-4 relative group transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-200'
        }`}
    >
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{chart.name}</h3>
      <div className="h-[calc(100%-2rem)]">
        <ChartComponent />
      </div>
    </div>
  );
};

// Title box component
interface TitleWidgetProps {
  content: string;
  onChange: (content: string) => void;
  onRemove: () => void;
  isSelected: boolean;
  onClick: () => void;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
}

const TitleWidget: React.FC<TitleWidgetProps> = ({
  content,
  onChange,
  onRemove,
  isSelected,
  onClick,
  fontSize = 32,
  textAlign = 'left'
}) => {
  return (
    <div
      onClick={onClick}
      className={`h-full bg-white rounded-lg shadow-lg border-2 p-4 relative group transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-200'
        }`}
    >
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>
      <input
        type="text"
        className="w-full h-full resize-none border-0 focus:outline-none focus:ring-0 bg-transparent font-bold"
        style={{ fontSize: `${fontSize}px`, textAlign }}
        placeholder="Enter title..."
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// Text box component
interface TextWidgetProps {
  content: string;
  onChange: (content: string) => void;
  onRemove: () => void;
  isSelected: boolean;
  onClick: () => void;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
}

const TextWidget: React.FC<TextWidgetProps> = ({
  content,
  onChange,
  onRemove,
  isSelected,
  onClick,
  fontSize = 14,
  textAlign = 'left'
}) => {
  return (
    <div
      onClick={onClick}
      className={`h-full bg-white rounded-lg shadow-lg border-2 p-4 relative group transition-colors ${isSelected ? 'border-blue-500' : 'border-gray-200'
        }`}
    >
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <X className="w-4 h-4" />
      </button>
      <textarea
        className="w-full h-full resize-none border-0 focus:outline-none focus:ring-0 bg-transparent"
        style={{ fontSize: `${fontSize}px`, textAlign }}
        placeholder="Enter your text here..."
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const DashboardBuilder: React.FC = () => {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const addChart = (chart: ChartDefinition): void => {
    const id = `${chart.id}-${Date.now()}`;
    const newItem: DashboardItem = {
      id,
      type: 'chart',
      chart
    };

    const newLayout: Layout = {
      i: id,
      x: (items.length * 2) % 12,
      y: Infinity,
      w: 6,
      h: 4,
      minW: 3,
      minH: 3
    };

    setItems([...items, newItem]);
    setLayout([...layout, newLayout]);
    setSelectedItemId(id);
  };

  const addTextBox = (): void => {
    const id = `text-${Date.now()}`;
    const newItem: DashboardItem = {
      id,
      type: 'text',
      content: '',
      fontSize: 14,
      textAlign: 'left'
    };

    const newLayout: Layout = {
      i: id,
      x: (items.length * 2) % 12,
      y: Infinity,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2
    };

    setItems([...items, newItem]);
    setLayout([...layout, newLayout]);
    setSelectedItemId(id);
  };

  const addTitleBox = (): void => {
    const id = `title-${Date.now()}`;
    const newItem: DashboardItem = {
      id,
      type: 'title',
      content: '',
      fontSize: 32,
      textAlign: 'left'
    };

    const newLayout: Layout = {
      i: id,
      x: 0,
      y: Infinity,
      w: 12,
      h: 1,
      minW: 2,
      minH: 1
    };

    setItems([...items, newItem]);
    setLayout([...layout, newLayout]);
    setSelectedItemId(id);
  };

  const removeItem = (id: string): void => {
    setItems(items.filter(item => item.id !== id));
    setLayout(layout.filter(l => l.i !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const updateItemContent = (id: string, content: string): void => {
    setItems(items.map(item =>
      item.id === id ? { ...item, content } : item
    ));
  };

  const updateItemStyle = (id: string, updates: Partial<DashboardItem>): void => {
    setItems(items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const updateLayoutPosition = (id: string, updates: Partial<Layout>): void => {
    setLayout(layout.map(l =>
      l.i === id ? { ...l, ...updates } : l
    ));
  };

  const selectedItem = items.find(item => item.id === selectedItemId);
  const selectedLayout = layout.find(l => l.i === selectedItemId);

  const exportAsPNG = async (): Promise<void> => {
    if (!dashboardRef.current) return;

    const canvas = await html2canvas(dashboardRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });

    const link = document.createElement('a');
    link.download = 'dashboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsPDF = async (): Promise<void> => {
    if (!dashboardRef.current) return;

    const canvas = await html2canvas(dashboardRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('dashboard.pdf');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Create your custom dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Charts Section */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Charts
            </h2>
            <div className="space-y-2">
              {CHART_LIBRARY.map(chart => {
                const Icon = chart.icon;
                return (
                  <button
                    key={chart.id}
                    onClick={() => addChart(chart)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{chart.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Elements Section */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Elements
            </h2>
            <div className="space-y-2">
              <button
                onClick={addTitleBox}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Heading1 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Title Box</span>
              </button>
              <button
                onClick={addTextBox}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Type className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Text Box</span>
              </button>
            </div>
          </div>

          {/* Style Controls */}
          {selectedItem && selectedLayout && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Selected Element
              </h2>

              <PositionControl
                layout={selectedLayout}
                onUpdate={(updates) => updateLayoutPosition(selectedItemId!, updates)}
              />

              {(selectedItem.type === 'text' || selectedItem.type === 'title') && (
                <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase">Styling</h4>
                  <div>
                    <label className="text-xs text-gray-600">Font Size</label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={selectedItem.fontSize || 14}
                      onChange={(e) => updateItemStyle(selectedItemId!, { fontSize: parseInt(e.target.value) || 14 })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Text Align</label>
                    <select
                      value={selectedItem.textAlign || 'left'}
                      onChange={(e) => updateItemStyle(selectedItemId!, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-2">
          <button
            onClick={exportAsPNG}
            disabled={items.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ImageIcon className="w-4 h-4" />
            Export as PNG
          </button>
          <button
            onClick={exportAsPDF}
            disabled={items.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <FileText className="w-4 h-4" />
            Export as PDF
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {items.length} widget{items.length !== 1 ? 's' : ''} on dashboard
          </p>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 overflow-auto p-8">
        <div
          ref={dashboardRef}
          className="bg-white rounded-lg shadow-xl p-6 min-h-full"
          onClick={() => setSelectedItemId(null)}
        >
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[600px]">
              <div className="text-center text-gray-400">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Your dashboard is empty</h3>
                <p className="text-sm">Click on charts or elements from the sidebar to add them</p>
              </div>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={80}
              onLayoutChange={(newLayout: Layout[]) => setLayout(newLayout)}
              isDraggable={true}
              isResizable={true}
              draggableHandle=".widget-drag-handle"
            >
              {items.map(item => (
                <div key={item.id} className="widget-drag-handle">
                  {item.type === 'chart' && item.chart ? (
                    <ChartWidget
                      chart={item.chart}
                      onRemove={() => removeItem(item.id)}
                      isSelected={selectedItemId === item.id}
                      onClick={() => setSelectedItemId(item.id)}
                    />
                  ) : item.type === 'title' ? (
                    <TitleWidget
                      content={item.content || ''}
                      onChange={(content) => updateItemContent(item.id, content)}
                      onRemove={() => removeItem(item.id)}
                      isSelected={selectedItemId === item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      fontSize={item.fontSize}
                      textAlign={item.textAlign}
                    />
                  ) : (
                    <TextWidget
                      content={item.content || ''}
                      onChange={(content) => updateItemContent(item.id, content)}
                      onRemove={() => removeItem(item.id)}
                      isSelected={selectedItemId === item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      fontSize={item.fontSize}
                      textAlign={item.textAlign}
                    />
                  )}
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder;