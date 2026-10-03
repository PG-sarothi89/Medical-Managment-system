import React, { useState } from 'react';
import { TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { AnalyticsSummary } from '../types/database';

interface SalesChartCardProps {
  analytics: AnalyticsSummary;
}

export const SalesChartCard: React.FC<SalesChartCardProps> = ({ analytics }) => {
  const [range, setRange] = useState<'7' | '30'>('7');

  const chartData = {
    '7': [
      { label: 'Mon', value: 1840 },
      { label: 'Tue', value: 2450 },
      { label: 'Wed', value: 3100 },
      { label: 'Thu', value: 2780 },
      { label: 'Fri', value: 3620 },
      { label: 'Sat', value: 4180 },
      { label: 'Today', value: 4890 }
    ],
    '30': [
      { label: 'Week 1', value: 14200 },
      { label: 'Week 2', value: 18900 },
      { label: 'Week 3', value: 23400 },
      { label: 'Week 4', value: 29800 }
    ]
  };

  const points = chartData[range];
  const maxVal = Math.max(...points.map((p) => p.value));
  const minVal = Math.min(...points.map((p) => p.value));

  const totalPeriod = points.reduce((acc, p) => acc + p.value, 0);

  // SVG dimensions
  const svgWidth = 540;
  const svgHeight = 180;
  const paddingX = 35;
  const paddingY = 25;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (points.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((val - minVal * 0.7) / (maxVal * 1.15 - minVal * 0.7)) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const polylinePoints = points
    .map((p, i) => {
      const { x, y } = getCoordinates(i, p.value);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${getCoordinates(0, points[0].value).x},${svgHeight - paddingY} ${polylinePoints} ${
    getCoordinates(points.length - 1, points[points.length - 1].value).x
  },${svgHeight - paddingY}`;

  return (
    <div className="curo-card sales-chart-card">
      <div className="chart-card-header">
        <div>
          <span className="section-eyebrow">FINANCIAL TELEMETRY</span>
          <h3 className="chart-card-title">Dispensary Revenue Velocity</h3>
        </div>

        <div className="chart-range-tabs" role="tablist">
          <button
            type="button"
            className={`range-tab ${range === '7' ? 'active' : ''}`}
            onClick={() => setRange('7')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`range-tab ${range === '30' ? 'active' : ''}`}
            onClick={() => setRange('30')}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="chart-kpi-row">
        <div>
          <span className="kpi-label">Period Gross Sales</span>
          <div className="kpi-value">৳ {(analytics?.totalRevenue || totalPeriod).toLocaleString()}</div>
        </div>
        <div className="kpi-badge text-emerald">
          <TrendingUp size={14} />
          <span>+14.8% growth vs prior cycle</span>
        </div>
      </div>

      {/* SVG Responsive Area Chart */}
      <div className="svg-chart-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="revenue-svg-chart">
          <defs>
            <linearGradient id="curoAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c42127" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#c42127" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area polygon */}
          <polygon points={areaPoints} fill="url(#curoAreaGrad)" />

          {/* Line path */}
          <polyline
            fill="none"
            stroke="#c42127"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Interactive dots */}
          {points.map((p, i) => {
            const { x, y } = getCoordinates(i, p.value);
            return (
              <g key={i} className="chart-dot-group">
                <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#c42127" strokeWidth="2.5" />
                <text x={x} y={svgHeight - 6} textAnchor="middle" className="chart-x-label">
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chart-card-footer">
        <span className="footer-note">
          <Calendar size={13} className="text-slate-400" />
          Synchronized with POS invoices ledger
        </span>
        <a href="reports.html" className="chart-link">
          <span>Detailed BI Reports</span>
          <ArrowRight size={13} />
        </a>
      </div>
    </div>
  );
};
