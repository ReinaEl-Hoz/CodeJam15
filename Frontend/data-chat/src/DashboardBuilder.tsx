import React, { useState, useRef, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import {
  Type,
  BarChart3,
  Activity,
  X,
  Heading1,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import Plot from 'react-plotly.js';
import type { PlotlyData } from './services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ResponsiveGridLayout = WidthProvider(Responsive);

// ---------- Types ----------

interface AnalyticsChart {
  id: string;
  title: string;
  plotlyData: PlotlyData | PlotlyData[];
  insight?: string;
}

interface DashboardItem {
  id: string;
  type: 'chart' | 'text' | 'title';
  plotlyChart?: AnalyticsChart;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface PositionControlProps {
  layout: Layout;
  onUpdate: (updates: Partial<Layout>) => void;
}

// ---------- Position control ----------

const PositionControl: React.FC<PositionControlProps> = ({ layout, onUpdate }) => {
  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-xs font-semibold text-gray-700 uppercase">Position &amp; Size</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">X Position</label>
          <input
            type="number"
            min={0}
            max={11}
            value={layout.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Y Position</label>
          <input
            type="number"
            min={0}
            value={layout.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Width</label>
          <input
            type="number"
            min={layout.minW || 1}
            max={12}
            value={layout.w}
            onChange={(e) =>
              onUpdate({ w: parseInt(e.target.value, 10) || (layout.minW || 1) })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Height</label>
          <input
            type="number"
            min={layout.minH || 1}
            value={layout.h}
            onChange={(e) =>
              onUpdate({ h: parseInt(e.target.value, 10) || (layout.minH || 1) })
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// ---------- Plotly chart widget ----------

interface PlotlyWidgetProps {
  chart: AnalyticsChart;
  onRemove: () => void;
  isSelected: boolean;
  onClick: () => void;
}

const PlotlyWidget: React.FC<PlotlyWidgetProps> = ({
  chart,
  onRemove,
  isSelected,
  onClick,
}) => {
  const plotData = Array.isArray(chart.plotlyData)
    ? (chart.plotlyData as any[])
    : [chart.plotlyData as any];

  const plotRef = useRef<any>(null);

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

      <h3 className="text-lg font-semibold mb-2 text-black break-words">
        {chart.title || 'Chart'}
      </h3>

      <div className="h-[calc(100%-2rem)]" ref={plotRef} data-chart-id={chart.id}>
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            margin: { l: 40, r: 20, t: 30, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'system-ui, sans-serif' },
          }}
          config={{
            responsive: true,
            displayModeBar: false,
            displaylogo: false,
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

// ---------- Title & Text widgets ----------

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
  textAlign = 'left',
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
        className="w-full h-full resize-none border-0 focus:outline-none focus:ring-0 bg-transparent font-bold text-black"
        style={{ fontSize: `${fontSize}px`, textAlign }}
        placeholder="Enter title..."
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

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
  textAlign = 'left',
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
        className="w-full h-full resize-none border-0 focus:outline-none focus:ring-0 bg-transparent text-black"
        style={{ fontSize: `${fontSize}px`, textAlign }}
        placeholder="Enter your text here..."
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// ---------- Main component ----------

const DashboardBuilder: React.FC = () => {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [availableCharts, setAvailableCharts] = useState<AnalyticsChart[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Load all charts generated in the App from localStorage (dynamic)
  useEffect(() => {
    const saved = localStorage.getItem('dataAnalyticsConversations');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as any[];
      const flattened: AnalyticsChart[] = [];

      parsed.forEach((conv) => {
        if (Array.isArray(conv.charts)) {
          conv.charts.forEach((ch: any) => {
            if (ch && ch.plotlyData) {
              flattened.push({
                id: ch.id,
                title: ch.title,
                plotlyData: ch.plotlyData,
                insight: ch.insight,
              });
            }
          });
        }
      });

      setAvailableCharts(flattened);
    } catch (err) {
      console.error('Error loading charts from conversations:', err);
    }
  }, []);

  // ----- Add items -----

  const addGeneratedChart = (chart: AnalyticsChart): void => {
    const id = `ai-${chart.id}-${Date.now()}`;
    const newItem: DashboardItem = {
      id,
      type: 'chart',
      plotlyChart: chart,
    };

    const newLayout: Layout = {
      i: id,
      x: (items.length * 2) % 12,
      y: Infinity,
      w: 6,
      h: 4,
      minW: 3,
      minH: 3,
    };

    setItems((prev) => [...prev, newItem]);
    setLayout((prev) => [...prev, newLayout]);
    setSelectedItemId(id);
  };

  const addTextBox = (): void => {
    const id = `text-${Date.now()}`;
    const newItem: DashboardItem = {
      id,
      type: 'text',
      content: '',
      fontSize: 14,
      textAlign: 'left',
    };

    const newLayout: Layout = {
      i: id,
      x: (items.length * 2) % 12,
      y: Infinity,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2,
    };

    setItems((prev) => [...prev, newItem]);
    setLayout((prev) => [...prev, newLayout]);
    setSelectedItemId(id);
  };

  const addTitleBox = (): void => {
    const id = `title-${Date.now()}`;
    const newItem: DashboardItem = {
      id,
      type: 'title',
      content: '',
      fontSize: 32,
      textAlign: 'left',
    };

    const newLayout: Layout = {
      i: id,
      x: 0,
      y: Infinity,
      w: 12,
      h: 1,
      minW: 2,
      minH: 1,
    };

    setItems((prev) => [...prev, newItem]);
    setLayout((prev) => [...prev, newLayout]);
    setSelectedItemId(id);
  };

  // ----- Update / remove -----

  const removeItem = (id: string): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setLayout((prev) => prev.filter((l) => l.i !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const updateItemContent = (id: string, content: string): void => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, content } : item)),
    );
  };

  const updateItemStyle = (id: string, updates: Partial<DashboardItem>): void => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const updateLayoutPosition = (id: string, updates: Partial<Layout>): void => {
    setLayout((prev) =>
      prev.map((l) => (l.i === id ? { ...l, ...updates } : l)),
    );
  };

  const selectedItem = items.find((item) => item.id === selectedItemId);
  const selectedLayout = layout.find((l) => l.i === selectedItemId);

  // ----- Convert Plotly charts to static images -----

  const convertPlotlyChartsToImages = async (): Promise<void> => {
    if (!dashboardRef.current) return;

    // Find all Plotly chart containers
    const chartContainers = dashboardRef.current.querySelectorAll('[data-chart-id]');
    
    for (const container of Array.from(chartContainers)) {
      try {
        // Find the Plotly div (has class 'js-plotly-plot')
        const plotlyDiv = container.querySelector('.js-plotly-plot') as HTMLElement;
        
        if (plotlyDiv && (window as any).Plotly) {
          // Get the current dimensions
          const width = plotlyDiv.offsetWidth;
          const height = plotlyDiv.offsetHeight;
          
          // Convert to image
          const imgData = await (window as any).Plotly.toImage(plotlyDiv, {
            format: 'png',
            width: width,
            height: height,
            scale: 2, // Higher quality
          });
          
          // Create an img element
          const img = document.createElement('img');
          img.src = imgData;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          
          // Replace the Plotly chart with the image temporarily
          const parent = plotlyDiv.parentElement;
          if (parent) {
            plotlyDiv.style.display = 'none';
            parent.appendChild(img);
            
            // Store reference for cleanup
            (container as any).__tempImg = img;
            (container as any).__plotlyDiv = plotlyDiv;
          }
        }
      } catch (err) {
        console.error('Error converting chart to image:', err);
      }
    }
  };

  const restorePlotlyCharts = (): void => {
    if (!dashboardRef.current) return;

    const chartContainers = dashboardRef.current.querySelectorAll('[data-chart-id]');
    
    for (const container of Array.from(chartContainers)) {
      const tempImg = (container as any).__tempImg;
      const plotlyDiv = (container as any).__plotlyDiv;
      
      if (tempImg && plotlyDiv) {
        // Remove the temporary image
        tempImg.remove();
        
        // Show the Plotly chart again
        plotlyDiv.style.display = '';
        
        // Clean up references
        delete (container as any).__tempImg;
        delete (container as any).__plotlyDiv;
      }
    }
  };

  // ----- Export -----

  const exportAsPNG = async (): Promise<void> => {
    if (!dashboardRef.current) {
      console.error('Dashboard ref is null - nothing to export');
      return;
    }

    setIsExporting(true);

    try {
      const node = dashboardRef.current;
      
      // Convert Plotly charts to static images first
      await convertPlotlyChartsToImages();
      
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      // Restore Plotly charts
      restorePlotlyCharts();

      const link = document.createElement('a');
      link.download = 'dashboard.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exporting PNG:', err);
      restorePlotlyCharts();
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async (): Promise<void> => {
    if (!dashboardRef.current) {
      console.error('Dashboard ref is null - nothing to export');
      return;
    }

    setIsExporting(true);

    try {
      const node = dashboardRef.current;
      
      // Convert Plotly charts to static images first
      await convertPlotlyChartsToImages();
      
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      // Restore Plotly charts
      restorePlotlyCharts();

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('dashboard.pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      restorePlotlyCharts();
    } finally {
      setIsExporting(false);
    }
  };

  // ---------- Render ----------
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className='flex flex-col'>
          <div className='pt-4 pl-4 flex flex-row gap-2 items-center'>
            <div><button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button></div>
            <div className='text-blue-800 font-bold'><p>Back to Search</p></div>
          </div>
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Builder</h1>
            <p className="text-sm text-gray-500 mt-1">Create your custom dashboard</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Elements Section */}
          <div>
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

          {/* Generated Charts */}
          {availableCharts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Generated Charts
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableCharts.map((chart) => (
                  <button
                    key={chart.id}
                    onClick={() => addGeneratedChart(chart)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                  >
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-medium text-gray-700 break-words">
                        {chart.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Style Controls */}
          {selectedItem && selectedLayout && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Selected Element
              </h2>

              <PositionControl
                layout={selectedLayout}
                onUpdate={(updates) => updateLayoutPosition(selectedItemId!, updates)}
              />

              {(selectedItem.type === 'text' || selectedItem.type === 'title') && (
                <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase">
                    Styling
                  </h4>
                  <div>
                    <label className="text-xs text-gray-600">Font Size</label>
                    <input
                      type="number"
                      min={8}
                      max={72}
                      value={selectedItem.fontSize || 14}
                      onChange={(e) =>
                        updateItemStyle(selectedItemId!, {
                          fontSize: parseInt(e.target.value, 10) || 14,
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Text Align</label>
                    <select
                      value={selectedItem.textAlign || 'left'}
                      onChange={(e) =>
                        updateItemStyle(selectedItemId!, {
                          textAlign: e.target.value as 'left' | 'center' | 'right',
                        })
                      }
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
            disabled={items.length === 0 || isExporting}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ImageIcon className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export as PNG'}
          </button>
          <button
            onClick={exportAsPDF}
            disabled={items.length === 0 || isExporting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export as PDF'}
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
                <p className="text-sm">
                  Click on generated charts or elements from the sidebar to add them
                </p>
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
              isDraggable
              isResizable
              draggableHandle=".widget-drag-handle"
            >
              {items.map((item) => (
                <div key={item.id} className="widget-drag-handle">
                  {item.type === 'chart' && item.plotlyChart ? (
                    <PlotlyWidget
                      chart={item.plotlyChart}
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