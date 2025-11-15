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