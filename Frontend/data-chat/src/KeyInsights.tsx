import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import Plot from "react-plotly.js";
import './KeyInsights.css';

// ==================== Types ====================
interface Stats {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
}

interface Histogram {
    counts: number[];
    bins: number[];
}

interface TopValue {
    value: string;
    count: number;
}

interface Column {
    name: string;
    type: string;
    missing: number;
    missing_percent: number;
    unique: number;
    min_samples?: string[];
    max_samples?: string[];
    stats?: Stats;
    histogram?: Histogram;
    top_values?: TopValue[];
}

interface Correlation {
    col1: string;
    col2: string;
    correlation: number;
}

interface CorrelationMatrix {
    columns: string[];
    data: number[][];
}

interface InteractionData {
    x: number;
    y: number;
}

interface Interaction {
    col1: string;
    col2: string;
    correlation: number;
    data: InteractionData[];
}

interface Overview {
    row_count: number;
    column_count: number;
    memory_usage: number;
    duplicate_rows: number;
}

interface KeyInsightsData {
    overview: Overview;
    columns: Column[];
    correlations: Correlation[];
    correlation_matrix: CorrelationMatrix;
    interactions: Interaction[];
}

interface KeyInsightsProps {
    data?: KeyInsightsData;
}

type TabType = 'overview' | 'correlations' | 'interactions';

// ==================== Sample Data for Testing ====================
const sampleData: KeyInsightsData = {
    overview: {
        row_count: 1000,
        column_count: 8,
        memory_usage: 2.5,
        duplicate_rows: 15
    },
    columns: [
        {
            name: "age",
            type: "int64",
            missing: 5,
            missing_percent: 0.5,
            unique: 45,
            min_samples: ["18", "19", "20", "21", "22"],
            max_samples: ["65", "64", "63", "62", "61"],
            stats: {
                mean: 35.2,
                median: 34,
                std: 12.3,
                min: 18,
                max: 65,
                q25: 27,
                q75: 45
            },
            histogram: {
                counts: [45, 78, 120, 145, 160, 155, 140, 125, 95, 67, 45, 32, 20, 15, 10, 8, 5, 3, 2, 1],
                bins: [18, 20.35, 22.7, 25.05, 27.4, 29.75, 32.1, 34.45, 36.8, 39.15, 41.5, 43.85, 46.2, 48.55, 50.9, 53.25, 55.6, 57.95, 60.3, 62.65, 65]
            }
        },
        {
            name: "revenue",
            type: "float64",
            missing: 0,
            missing_percent: 0,
            unique: 876,
            min_samples: ["10000", "10250", "10500", "10750", "11000"],
            max_samples: ["125000", "124500", "124000", "123500", "123000"],
            stats: {
                mean: 52340.5,
                median: 48200,
                std: 23450.8,
                min: 10000,
                max: 125000,
                q25: 35000,
                q75: 68000
            },
            histogram: {
                counts: [25, 48, 89, 124, 145, 167, 156, 132, 98, 72, 54, 38, 24, 16, 8, 4, 2, 1, 1, 1],
                bins: [10000, 15750, 21500, 27250, 33000, 38750, 44500, 50250, 56000, 61750, 67500, 73250, 79000, 84750, 90500, 96250, 102000, 107750, 113500, 119250, 125000]
            }
        }
    ],
    correlations: [
        { col1: "age", col2: "revenue", correlation: 0.72 },
        { col1: "age", col2: "experience", correlation: 0.85 }
    ],
    correlation_matrix: {
        columns: ["age", "revenue", "experience", "satisfaction"],
        data: [
            [1.0, 0.72, 0.85, 0.45],
            [0.72, 1.0, 0.68, 0.55],
            [0.85, 0.68, 1.0, 0.52],
            [0.45, 0.55, 0.52, 1.0]
        ]
    },
    interactions: [
        {
            col1: "age",
            col2: "experience",
            correlation: 0.85,
            data: Array.from({ length: 100 }, () => ({
                x: Math.random() * 47 + 18,
                y: Math.random() * 30 + 1
            }))
        },
        {
            col1: "age",
            col2: "revenue",
            correlation: 0.72,
            data: Array.from({ length: 100 }, () => ({
                x: Math.random() * 47 + 18,
                y: Math.random() * 115000 + 10000
            }))
        }
    ]
};

// ==================== Utility Functions ====================
const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
};

const getTypeColor = (type: string): string => {
    if (type.includes('int') || type.includes('float')) return '#3b82f6';
    if (type.includes('object') || type.includes('str')) return '#8b5cf6';
    if (type.includes('datetime')) return '#10b981';
    return '#6b7280';
};

const getCorrelationColor = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue < 0.3) return '#f0f0f0';
    if (absValue < 0.5) return value > 0 ? '#bfdbfe' : '#fecaca';
    if (absValue < 0.7) return value > 0 ? '#60a5fa' : '#f87171';
    return value > 0 ? '#2563eb' : '#dc2626';
};

const isNumericColumn = (column: Column): boolean => {
    return Boolean(column.stats && !column.top_values);
};

const isCategoricalColumn = (column: Column): boolean => {
    return Boolean(column.top_values);
};

// ==================== Sub-Components ====================
const OverviewCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="overview-card">
        <div className="overview-label">{label}</div>
        <div className="overview-value">{value}</div>
    </div>
);

const CorrelationItem: React.FC<{ correlation: Correlation }> = ({ correlation }) => (
    <div className="correlation-item">
        <span className="corr-columns">
            {correlation.col1} ↔ {correlation.col2}
        </span>
        <span
            className="corr-value"
            style={{ color: correlation.correlation > 0 ? '#10b981' : '#ef4444' }}
        >
            {correlation.correlation.toFixed(2)}
        </span>
    </div>
);

const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="stat-box">
        <div className="stat-box-label">{label}</div>
        <div className="stat-box-value">{value}</div>
    </div>
);

const SamplesSection: React.FC<{ title: string; samples: string[] }> = ({ title, samples }) => (
    <div className="samples-section">
        <h3>{title}</h3>
        <div className="samples-list">
            {samples.map((val, i) => (
                <div key={i} className="sample-item">{val}</div>
            ))}
        </div>
    </div>
);

// ==================== Column Card Component ====================
const ColumnCard: React.FC<{
    column: Column;
    onClick: (column: Column) => void;
}> = ({ column, onClick }) => {
    const isNumeric = isNumericColumn(column);
    const isCategorical = isCategoricalColumn(column);

    return (
        <div className="column-card" onClick={() => onClick(column)}>
            <div className="column-header">
                <div className="column-name">{column.name}</div>
                <div className="column-type" style={{ color: getTypeColor(column.type) }}>
                    {column.type}
                </div>
            </div>

            <div className="column-stats">
                <div className="stat-item">
                    <span className="stat-label">Unique</span>
                    <span className="stat-value">{column.unique}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Missing</span>
                    <span className="stat-value">
                        {column.missing} ({column.missing_percent.toFixed(1)}%)
                    </span>
                </div>
            </div>

            {isNumeric && column.stats && (
                <div className="quick-stats">
                    <div className="mini-stat">
                        <span className="mini-label">Mean</span>
                        <span className="mini-value">{formatNumber(column.stats.mean)}</span>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-label">Median</span>
                        <span className="mini-value">{formatNumber(column.stats.median)}</span>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-label">Std</span>
                        <span className="mini-value">{formatNumber(column.stats.std)}</span>
                    </div>
                </div>
            )}

            {isCategorical && column.top_values && column.top_values.length > 0 && (
                <div className="top-category">
                    <span className="category-label">Top: </span>
                    <span className="category-value">{column.top_values[0].value}</span>
                    <span className="category-count">({column.top_values[0].count})</span>
                </div>
            )}
        </div>
    );
};

// ==================== Histogram Component ====================
const HistogramChart: React.FC<{ histogram: Histogram }> = ({ histogram }) => {
    const chartData = histogram.counts.map((count, i) => ({
        bin: histogram.bins[i].toFixed(1),
        count
    }));

    return (
        <div className="chart-container">
            <h3>Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// ==================== Top Values Chart Component ====================
const TopValuesChart: React.FC<{ topValues: TopValue[] }> = ({ topValues }) => (
    <div className="chart-container">
        <h3>Top Values</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topValues} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="value" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

// ==================== Detail Modal Component ====================
const ColumnDetailModal: React.FC<{
    column: Column | null;
    onClose: () => void;
}> = ({ column, onClose }) => {
    if (!column) return null;

    const isNumeric = isNumericColumn(column);
    const isCategorical = isCategoricalColumn(column);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{column.name}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {isNumeric && column.stats && (
                        <>
                            <div className="stats-grid">
                                <StatBox label="Mean" value={formatNumber(column.stats.mean)} />
                                <StatBox label="Median" value={formatNumber(column.stats.median)} />
                                <StatBox label="Std Dev" value={formatNumber(column.stats.std)} />
                                <StatBox label="Min" value={formatNumber(column.stats.min)} />
                                <StatBox label="Q25" value={formatNumber(column.stats.q25)} />
                                <StatBox label="Q75" value={formatNumber(column.stats.q75)} />
                                <StatBox label="Max" value={formatNumber(column.stats.max)} />
                            </div>

                            {column.min_samples && column.min_samples.length > 0 && (
                                <SamplesSection title="Minimum Values (Sample)" samples={column.min_samples} />
                            )}

                            {column.max_samples && column.max_samples.length > 0 && (
                                <SamplesSection title="Maximum Values (Sample)" samples={column.max_samples} />
                            )}

                            {column.histogram && <HistogramChart histogram={column.histogram} />}
                        </>
                    )}

                    {isCategorical && column.top_values && (
                        <>
                            {column.min_samples && column.min_samples.length > 0 && (
                                <SamplesSection title="Sample Values (First 5)" samples={column.min_samples} />
                            )}
                            <TopValuesChart topValues={column.top_values} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==================== Correlation Heatmap Component ====================
const CorrelationHeatmap: React.FC<{ correlationMatrix: CorrelationMatrix }> = ({ correlationMatrix }) => (
    <div className="heatmap-container">
        <h2>Correlation Heatmap</h2>
        <div className="heatmap-wrapper">
            <Plot
                data={[
                    {
                        z: correlationMatrix.data,
                        x: correlationMatrix.columns,
                        y: correlationMatrix.columns,
                        type: 'heatmap',
                        colorscale: 'YlGnBu',
                        zmin: -1,
                        zmax: 1,
                        colorbar: { title: 'Correlation' },
                    },
                ]}
                layout={{
                    title: 'Correlation Heatmap',
                    xaxis: { side: 'top' }, // move x-axis labels to top (common for correlation)
                    yaxis: { autorange: 'reversed' }, // flip y-axis for better alignment
                    autosize: true,
                }}
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true }}
            />
        </div>
    </div>
);

// ==================== Interactions Component ====================
const InteractionsView: React.FC<{ interactions: Interaction[] }> = ({ interactions }) => {
    if (!interactions || interactions.length === 0) return null;

    return (
        <div className="interactions-container">
            <h2>Variable Interactions</h2>
            <div className="interactions-grid">
                {interactions.map((interaction, idx) => (
                    <div key={idx} className="interaction-card">
                        <h3>
                            {interaction.col1} vs {interaction.col2}
                            <span
                                className="correlation-badge"
                                style={{
                                    backgroundColor: interaction.correlation > 0 ? '#dcfce7' : '#fee2e2',
                                    color: interaction.correlation > 0 ? '#166534' : '#991b1b'
                                }}
                            >
                                r = {interaction.correlation.toFixed(2)}
                            </span>
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="x"
                                    name={interaction.col1}
                                    tick={{ fontSize: 12 }}
                                    label={{ value: interaction.col1, position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                    dataKey="y"
                                    name={interaction.col2}
                                    tick={{ fontSize: 12 }}
                                    label={{ value: interaction.col2, angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter
                                    data={interaction.data}
                                    fill="#1a1a1a"
                                    fillOpacity={0.6}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== Overview Tab Component ====================
const OverviewTab: React.FC<{
    data: KeyInsightsData;
    onColumnClick: (column: Column) => void;
}> = ({ data, onColumnClick }) => (
    <>
        <div className="overview-cards">
            <OverviewCard label="Rows" value={formatNumber(data.overview.row_count)} />
            <OverviewCard label="Columns" value={data.overview.column_count} />
            <OverviewCard label="Memory" value={`${data.overview.memory_usage.toFixed(2)} MB`} />
            <OverviewCard label="Duplicates" value={data.overview.duplicate_rows} />
        </div>

        {data.correlations && data.correlations.length > 0 && (
            <div className="correlations-section">
                <h2>Strong Correlations</h2>
                <div className="correlation-list">
                    {data.correlations.map((corr, i) => (
                        <CorrelationItem key={i} correlation={corr} />
                    ))}
                </div>
            </div>
        )}

        <div className="columns-section">
            <h2>Column Details</h2>
            <div className="columns-grid">
                {data.columns.map((column) => (
                    <ColumnCard key={column.name} column={column} onClick={onColumnClick} />
                ))}
            </div>
        </div>
    </>
);

// ==================== Main Component ====================
const KeyInsights: React.FC<KeyInsightsProps> = ({ data = sampleData }) => {
    const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Defensive check
    if (!data) {
        return (
            <div className="insights-container">
                <div className="empty-state">
                    <h3>No Data Available</h3>
                    <p>Please provide data to visualize insights.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-container">
            <div className="insights-header">
                <h1>Dataset Insights</h1>
                <div className="tab-nav">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'correlations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('correlations')}
                    >
                        Correlations
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'interactions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('interactions')}
                    >
                        Interactions
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <OverviewTab data={data} onColumnClick={setSelectedColumn} />
            )}

            {activeTab === 'correlations' && (
                <CorrelationHeatmap correlationMatrix={data.correlation_matrix} />
            )}

            {activeTab === 'interactions' && (
                <InteractionsView interactions={data.interactions} />
            )}

            <ColumnDetailModal column={selectedColumn} onClose={() => setSelectedColumn(null)} />
        </div>
    );
};

export default KeyInsights;