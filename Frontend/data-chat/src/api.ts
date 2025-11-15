const API_BASE_URL = 'http://localhost:8000';

type ChartType = "bar" | "line" | "pie" | "scatter" | "area";

interface LayoutOptions {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  colors?: string[];
  [key: string]: any;  // Allow any additional options
}

interface ChartConfig {
  chartType: ChartType;
  data: Record<string, any>[];  // Array of objects with any keys/values
  xKey: string;
  yKey: string;
  layoutOptions?: LayoutOptions;
}

export const API = {
  // Get all charts
  getCharts: async (): Promise<ChartConfig[]> => {
    const response = await fetch(`${API_BASE_URL}/charts`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // save a chart query
  saveChartQuery: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: query,
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }
};