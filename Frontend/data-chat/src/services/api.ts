const API_BASE_URL = 'http://localhost:5001/api';

export interface PlotlyData {
  x: (string | number)[];
  y: number[];
  type: 'scatter' | 'bar' | 'line' | 'pie';
  mode?: string;
  name?: string;
}

export interface QueryResponse {
  success: boolean;
  data: PlotlyData | PlotlyData[];
  query_type?: string;
  error?: string;
}

export const fetchChartData = async (
  queryType: string,
  filters: Record<string, any> = {}
): Promise<PlotlyData | PlotlyData[]> => {
  const response = await fetch(`${API_BASE_URL}/query-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query_type: queryType,
      filters: filters,
    }),
  });

  const result: QueryResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch chart data');
  }

  return result.data;
};

export const getAvailableQueries = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/available-queries`);
  const result = await response.json();
  return result.queries;
};

export interface ChatQuery {
  name: string;
  sql: string;
  data: any[];
  plotly_data: PlotlyData | null;  // Plotly-ready data from backend
  error?: string;
  suggested_chart: {
    type: string;
    x: string;
    y: string | string[];  // Can be single column or multiple columns for multi-series
    title: string;
  };
}

export interface ChatResponse {
  success: boolean;
  queries?: ChatQuery[];
  error?: string;
}

export const sendChatMessage = async (userInput: string): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_input: userInput,
    }),
  });

  const result: ChatResponse = await response.json();
  return result;
};


export interface KeyInsightsData {
  overview: {
    row_count: number;
    column_count: number;
    memory_usage: number;
    duplicate_rows: number;
  };
  columns: Array<{
    name: string;
    type: string;
    missing: number;
    missing_percent: number;
    unique: number;
    min_samples: string[];
    max_samples: string[];
    stats: {
      mean?: number;
      median?: number;
      std?: number;
      min?: number;
      max?: number;
      q25?: number;
      q75?: number;
    };
    histogram?: {
      counts: number[];
      bins: number[];
    };
  }>;
  correlations?: Array<{
    col1: string;
    col2: string;
    correlation: number;
  }>;
  correlation_matrix?: {
    columns: string[];
    data: number[][];
  };
  interactions?: Array<{
    col1: string;
    col2: string;
    correlation: number;
    data: Array<{ x: number; y: number }>;
  }>;
}

export interface KeyInsightsResponse {
  success: boolean;
  data?: KeyInsightsData;
  error?: string;
}

export const getKeyInsights = async (query: string): Promise<KeyInsightsData> => {
  const url = `${API_BASE_URL}/key-insights?query=${encodeURIComponent(query)}`;
  console.log("API: Fetching from", url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log("API: Response status", response.status);
  const result: KeyInsightsResponse = await response.json();
  console.log("API: Response data", result);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch key insights');
  }

  return result.data;
};