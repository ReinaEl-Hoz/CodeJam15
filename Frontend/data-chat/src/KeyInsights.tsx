import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import './KeyInsights.css';
import Plot from "react-plotly.js";

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

const KeyInsights: React.FC<KeyInsightsProps> = ({ data = sampleData }) => {
    const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'correlations' | 'interactions'>('overview');

    const formatNumber = (num: number | null | undefined): string => {
        if (num === null || num === undefined) return 'N/A';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    const getTypeColor = (type: string): string => {
        if (type.includes('int') || type.includes('float')) return '#3b82f6';
        if (type.includes('object') || type.includes('str')) return '#8b5cf6';
        if (type.includes('datetime')) return '#10b981';
        return '#6b7280';
    };

    const getCellColor = (value: number): string => {
        const absValue = Math.abs(value);
        if (absValue < 0.3) return '#f0f0f0';
        if (absValue < 0.5) return value > 0 ? '#bfdbfe' : '#fecaca';
        if (absValue < 0.7) return value > 0 ? '#60a5fa' : '#f87171';
        return value > 0 ? '#2563eb' : '#dc2626';
    };

    const renderColumnCard = (column: Column) => {
        const isNumeric = column.stats && !column.top_values;
        const isCategorical = column.top_values;

        return (
            <div
                key={column.name}
                className="column-card"
                onClick={() => setSelectedColumn(column)}
            >
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
                        <span className="stat-value">{column.missing} ({column.missing_percent.toFixed(1)}%)</span>
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

    const renderCorrelationHeatmap = () => {
        if (!data.correlation_matrix) return null;

        return (
            <div className="heatmap-container">
                <h2>Correlation Heatmap</h2>
                <div className="heatmap-wrapper">
                    <Plot
                        data={[
                            {
                                z: data.correlation_matrix.data,
                                x: data.correlation_matrix.columns,
                                y: data.correlation_matrix.columns,
                                type: 'heatmap',
                                colorscale: 'RdBu',  // common for correlation matrices
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
    };

    const renderInteractions = () => {
        if (!data.interactions || data.interactions.length === 0) return null;

        return (
            <div className="interactions-container">
                <h2>Variable Interactions</h2>
                <div className="interactions-grid">
                    {data.interactions.map((interaction, idx) => (
                        <div key={idx} className="interaction-card">
                            <h3>
                                {interaction.col1} vs {interaction.col2}
                                <span className="correlation-badge" style={{
                                    backgroundColor: interaction.correlation > 0 ? '#dcfce7' : '#fee2e2',
                                    color: interaction.correlation > 0 ? '#166534' : '#991b1b'
                                }}>
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

    const renderDetailModal = () => {
        if (!selectedColumn) return null;

        const isNumeric = selectedColumn.stats && !selectedColumn.top_values;
        const isCategorical = selectedColumn.top_values;

        return (
            <div className="modal-overlay" onClick={() => setSelectedColumn(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{selectedColumn.name}</h2>
                        <button className="close-btn" onClick={() => setSelectedColumn(null)}>×</button>
                    </div>

                    <div className="modal-body">
                        {isNumeric && selectedColumn.stats && (
                            <>
                                <div className="stats-grid">
                                    <div className="stat-box">
                                        <div className="stat-box-label">Mean</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.mean)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-box-label">Median</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.median)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-box-label">Std Dev</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.std)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-box-label">Min</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.min)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-box-label">Q25</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.q25)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-box-label">Q75</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.q75)}</div>
                                    </div>
                                    <div className="stat-box">
                                        <div className="stat-box-label">Max</div>
                                        <div className="stat-box-value">{formatNumber(selectedColumn.stats.max)}</div>
                                    </div>
                                </div>

                                {selectedColumn.min_samples && selectedColumn.min_samples.length > 0 && (
                                    <div className="samples-section">
                                        <h3>Minimum Values (Sample)</h3>
                                        <div className="samples-list">
                                            {selectedColumn.min_samples.map((val, i) => (
                                                <div key={i} className="sample-item">{val}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedColumn.max_samples && selectedColumn.max_samples.length > 0 && (
                                    <div className="samples-section">
                                        <h3>Maximum Values (Sample)</h3>
                                        <div className="samples-list">
                                            {selectedColumn.max_samples.map((val, i) => (
                                                <div key={i} className="sample-item">{val}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedColumn.histogram && (
                                    <div className="chart-container">
                                        <h3>Distribution</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={selectedColumn.histogram.counts.map((count, i) => ({
                                                bin: selectedColumn.histogram!.bins[i].toFixed(1),
                                                count
                                            }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </>
                        )}

                        {isCategorical && selectedColumn.top_values && (
                            <>
                                {selectedColumn.min_samples && selectedColumn.min_samples.length > 0 && (
                                    <div className="samples-section">
                                        <h3>Sample Values (First 5)</h3>
                                        <div className="samples-list">
                                            {selectedColumn.min_samples.map((val, i) => (
                                                <div key={i} className="sample-item">{val}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="chart-container">
                                    <h3>Top Values</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={selectedColumn.top_values} layout="horizontal">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" tick={{ fontSize: 12 }} />
                                            <YAxis dataKey="value" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
                <>
                    <div className="overview-cards">
                        <div className="overview-card">
                            <div className="overview-label">Rows</div>
                            <div className="overview-value">{formatNumber(data.overview.row_count)}</div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-label">Columns</div>
                            <div className="overview-value">{data.overview.column_count}</div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-label">Memory</div>
                            <div className="overview-value">{data.overview.memory_usage.toFixed(2)} MB</div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-label">Duplicates</div>
                            <div className="overview-value">{data.overview.duplicate_rows}</div>
                        </div>
                    </div>

                    {data.correlations && data.correlations.length > 0 && (
                        <div className="correlations-section">
                            <h2>Strong Correlations</h2>
                            <div className="correlation-list">
                                {data.correlations.map((corr, i) => (
                                    <div key={i} className="correlation-item">
                                        <span className="corr-columns">{corr.col1} ↔ {corr.col2}</span>
                                        <span className="corr-value" style={{
                                            color: corr.correlation > 0 ? '#10b981' : '#ef4444'
                                        }}>
                                            {corr.correlation.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="columns-section">
                        <h2>Column Details</h2>
                        <div className="columns-grid">
                            {data.columns.map(renderColumnCard)}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'correlations' && renderCorrelationHeatmap()}
            {activeTab === 'interactions' && renderInteractions()}

            {renderDetailModal()}
        </div>
    );
};

export default KeyInsights;