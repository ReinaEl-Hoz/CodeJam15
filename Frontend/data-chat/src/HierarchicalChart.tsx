import React from "react";
import Plot from "react-plotly.js";

export type HierarchicalDataItem = {
  id: string;
  parent: string; // empty string for root
  value: number;
  [key: string]: any; // extra metadata if needed
};

export interface HierarchicalSeriesConfig {
  labelKey: string;    // which field to use for labels
  parentKey: string;   // which field to use for parents
  valueKey: string;    // which field to use for values
  type?: "sunburst" | "treemap"; // chart type
  name?: string;       // optional series name
}

export interface HierarchicalChartProps {
  data: HierarchicalDataItem[];
  series?: HierarchicalSeriesConfig[]; // allow multiple hierarchies
  title?: string;
  layoutOptions?: Partial<Plotly.Layout>;
}

const HierarchicalChart: React.FC<HierarchicalChartProps> = ({
  data,
  series,
  title,
  layoutOptions,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 32, height: height - 32 });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Default single series if none provided
  const seriesConfig: HierarchicalSeriesConfig[] =
    series && series.length > 0
      ? series
      : [{ labelKey: "id", parentKey: "parent", valueKey: "value", type: "sunburst" }];

  const plotData: Partial<Plotly.PlotData>[] = seriesConfig.map((s) => ({
    type: s.type || "sunburst",
    labels: data.map((d) => d[s.labelKey]),
    parents: data.map((d) => d[s.parentKey]),
    values: data.map((d) => d[s.valueKey]),
    branchvalues: "total",
    hoverinfo: "label+value+percent parent",
    name: s.name,
  }));

  const layout: Partial<Plotly.Layout> = {
    title: { text: title || "Hierarchical Chart" },
    margin: { l: 0, r: 0, b: 0, t: 30 },
    autosize: true,
    ...layoutOptions,
  };

  return (
    <div ref={containerRef} style={{ width: "100%", height: 400 }}>
      {dimensions.width > 0 && (
        <Plot data={plotData} layout={{ ...layout, width: dimensions.width, height: 400 }} />
      )}
    </div>
  );
};

export default HierarchicalChart;
