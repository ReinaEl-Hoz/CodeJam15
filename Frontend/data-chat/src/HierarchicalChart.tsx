import React from "react";
import Plot from "react-plotly.js";

export interface HierarchicalDataItem {
  id: string;
  parent: string; // empty string for root
  value: number;
}

interface HierarchicalChartProps {
  data: HierarchicalDataItem[];
  title?: string;
}

const HierarchicalChart: React.FC<HierarchicalChartProps> = ({ data, title }) => {
  // Convert data to Plotly sunburst format
  const labels = data.map(d => d.id);
  const parents = data.map(d => d.parent);
  const values = data.map(d => d.value);

  const plotData = [
    {
      type: "sunburst",
      labels,
      parents,
      values,
      branchvalues: "total",
      hoverinfo: "label+value+percent parent",
    },
  ];

  const layout = {
    title: { text: title || "Hierarchical Chart" },
    margin: { l: 0, r: 0, b: 0, t: 30 },
  };

  return <Plot data={plotData} layout={layout} style={{ width: "100%", height: 400 }} />;
};

export default HierarchicalChart;
