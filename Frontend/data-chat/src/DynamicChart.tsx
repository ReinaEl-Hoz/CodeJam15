import React from "react";
import Plot from "react-plotly.js";
import "./DynamicChart.css";

export type ChartData = Record<string, any>;

export type SeriesConfig = {
  name: string;
  xKey: string;
  yKey: string;
};

export interface DynamicChartProps {
  chartType: "bar" | "scatter" | "line" | "pie";
  data: ChartData[];
  xKey?: string;
  yKey?: string;
  layoutOptions?: Partial<Plotly.Layout>;
  multipleSeries?: SeriesConfig[];
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  chartType,
  data,
  xKey,
  yKey,
  layoutOptions,
  multipleSeries
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: width - 32, // subtract padding
          height: height - 32 
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  let plotData: Partial<Plotly.PlotData>[] = [];

  if (chartType === "pie") {
    if (!xKey || !yKey) {
      throw new Error("Pie chart requires xKey (labels) and yKey (values)");
    }
    plotData = [{
      type: "pie",
      labels: data.map(item => item[xKey]),
      values: data.map(item => item[yKey]),
      marker: {
        colors: ['#2E5090', '#4A7BC8', '#6B9BD8', '#8FB3E8', '#B3CCF5'],
      },
    }];
  } else if (multipleSeries && multipleSeries.length > 0) {
    const colors = ['#2E5090', '#4A7BC8', '#6B9BD8', '#8FB3E8', '#B3CCF5'];
    plotData = multipleSeries.map((series, index) => ({
      x: data.map(item => item[series.xKey]),
      y: data.map(item => item[series.yKey]),
      type: chartType,
      name: series.name,
      mode: chartType === 'scatter' ? 'lines+markers' : undefined,
      marker: { color: colors[index % colors.length] },
      line: chartType === 'line' ? { width: 2 } : undefined,
    }));
  } else {
    if (!xKey || !yKey) {
      throw new Error("xKey and yKey are required for single series charts");
    }
    plotData = [{
      x: data.map(item => item[xKey]),
      y: data.map(item => item[yKey]),
      type: chartType,
      mode: chartType === 'scatter' ? 'lines+markers' : undefined,
      marker: { color: '#2E5090' },
      line: chartType === 'line' ? { width: 2 } : undefined,
    }];
  }

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    responsive: true,
    width: undefined,
    height: undefined,
    title: {
      text: layoutOptions?.title?.text || layoutOptions?.title || '',
      font: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        size: 18,
        color: '#1a1a1a',
      },
    },
    xaxis: {
      ...layoutOptions?.xaxis,
      title: {
        font: {
          family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          size: 13,
          color: '#4a4a4a',
        },
        ...layoutOptions?.xaxis?.title,
      },
      tickfont: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        size: 11,
        color: '#6a6a6a',
      },
      gridcolor: '#e5e5e5',
    },
    yaxis: {
      ...layoutOptions?.yaxis,
      title: {
        font: {
          family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          size: 13,
          color: '#4a4a4a',
        },
        ...layoutOptions?.yaxis?.title,
      },
      tickfont: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        size: 11,
        color: '#6a6a6a',
      },
      gridcolor: '#e5e5e5',
    },
    font: {
      family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      size: 12,
      color: '#4a4a4a',
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    margin: {
      l: 60,
      r: 40,
      t: 60,
      b: 60,
    },
    ...layoutOptions
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

export default DynamicChart;