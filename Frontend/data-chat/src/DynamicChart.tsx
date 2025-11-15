import React from "react";
import Plot from "react-plotly.js";

export type ChartData = Record<string, any>;

export type SeriesConfig = {
  name: string;
  xKey: string;
  yKey: string;
};

export interface DynamicChartProps {
  chartType: "bar" | "scatter" | "line" | "pie";
  data: ChartData[];
  xKey?: string; // not needed for pie if multipleSeries provided
  yKey?: string; // not needed for pie if multipleSeries provided
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
  let plotData: Partial<Plotly.PlotData>[] = [];

  if (chartType === "pie") {
    if (!xKey || !yKey) {
      throw new Error("Pie chart requires xKey (labels) and yKey (values)");
    }
    plotData = [{
      type: "pie",
      labels: data.map(item => item[xKey]),
      values: data.map(item => item[yKey]),
    }];
  } else if (multipleSeries && multipleSeries.length > 0) {
    plotData = multipleSeries.map(series => ({
      x: data.map(item => item[series.xKey]),
      y: data.map(item => item[series.yKey]),
      type: chartType,
      name: series.name,
      mode: chartType === 'scatter' ? 'lines+markers' : undefined,
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
      marker: { color: 'blue' },
    }];
  }

  const layout: Partial<Plotly.Layout> = {
    title: layoutOptions?.title || '',
    xaxis: layoutOptions?.xaxis || {},
    yaxis: layoutOptions?.yaxis || {},
    ...layoutOptions
  };

  return <Plot data={plotData} layout={layout} style={{ width: '100%', height: '100%' }} />;
};

export default DynamicChart;