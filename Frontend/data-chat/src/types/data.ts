export interface KeyInsightsData {
  overview: {
    row_count: number;
    column_count: number;
    memory_usage: number;
    duplicate_rows: number;
  };
  columns: ColumnInfo[];
  correlations: CorrelationPair[];
  correlation_matrix: CorrelationMatrix;
  interactions: Interaction[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  missing: number;
  missing_percent: number;
  unique: number;
  min_samples: string[];
  max_samples: string[];
  stats?: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
  };
  histogram?: {
    counts: number[];
    bins: number[];
  };
}

export interface CorrelationPair {
  col1: string;
  col2: string;
  correlation: number;
}

export interface CorrelationMatrix {
  columns: string[];
  data: number[][];
}

export interface Interaction {
  col1: string;
  col2: string;
  correlation: number;
  data: { x: number; y: number }[];
}
