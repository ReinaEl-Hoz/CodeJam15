import React from "react";
import Plot from "react-plotly.js";
import "./DynamicChart.css"; // reuse the same container styling

export interface HierarchicalDataItem {
  id: string;
  parent: string; // empty string for root
  value: number;
}

export interface HierarchicalChartProps {
  data: HierarchicalDataItem[];
  chartType?: "sunburst" | "treemap"; // default sunburst
  title?: string;
  layoutOptions?: Partial<Plotly.Layout>;
}

const HierarchicalChart: React.FC<HierarchicalChartProps> = ({
  data,
  chartType = "sunburst",
  title,
  layoutOptions
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: width - 32,
          height: height - 32 
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const labels = data.map(d => d.id);
  const parents = data.map(d => d.parent);
  const values = data.map(d => d.value);

  const plotData: Partial<Plotly.PlotData>[] = [
    {
      type: chartType,
      labels,
      parents,
      values,
      branchvalues: "total",
      hoverinfo: "label+value+percent parent",
      marker: {
        colors: ['#2E5090', '#4A7BC8', '#6B9BD8', '#8FB3E8', '#B3CCF5'],
      },
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    responsive: true,
    width: undefined,
    height: undefined,
    title: {
      text: layoutOptions?.title?.text || title || '',
      font: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        size: 18,
        color: '#1a1a1a',
      },
    },
    margin: { l: 60, r: 40, t: 60, b: 60 },
    font: {
      family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      size: 12,
      color: '#4a4a4a',
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    ...layoutOptions,
  };

  return (
    <div ref={containerRef} className="dynamic-chart-container">
      {dimensions.width > 0 && (
        <Plot
          style={{ width: "100%", height: "100%" }}
          data={plotData}
          layout={layout}
          config={{
            displayModeBar: false,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          }}
        />
      )}
    </div>
  );
};

export default HierarchicalChart;
