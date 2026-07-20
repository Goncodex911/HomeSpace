import React, { useMemo } from 'react';

const PADDING_COMPACT = { top: 16, right: 4, bottom: 36, left: 28 };
const PADDING_DEFAULT = { top: 20, right: 16, bottom: 40, left: 52 };

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

const AdminStatsChart = ({ data, chartType, loading, period, wide = false }) => {
  const points = data?.points || [];
  const chartWidth = wide ? 1000 : 520;
  const chartHeight = wide ? 280 : 240;
  const PADDING = wide ? PADDING_COMPACT : PADDING_DEFAULT;

  const chart = useMemo(() => {
    const innerWidth = chartWidth - PADDING.left - PADDING.right;
    const innerHeight = chartHeight - PADDING.top - PADDING.bottom;
    const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
    const step = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth;
    const barWidth = Math.max(5, Math.min(wide ? 16 : 14, innerWidth / Math.max(points.length, 1) - 3));

    const coords = points.map((point, index) => {
      const x =
        chartType === 'bar'
          ? PADDING.left + index * (innerWidth / points.length) + (innerWidth / points.length - barWidth) / 2
          : PADDING.left + index * step;
      const y = PADDING.top + innerHeight - (point.revenue / maxRevenue) * innerHeight;
      return { ...point, x, y, barWidth };
    });

    const linePath =
      coords.length > 0
        ? coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
        : '';

    const yTicks = [0, 0.5, 1].map((ratio) => ({
      value: maxRevenue * ratio,
      y: PADDING.top + innerHeight - ratio * innerHeight,
    }));

    return { coords, linePath, yTicks, innerHeight };
  }, [points, chartType, chartWidth, chartHeight, wide, PADDING.left, PADDING.right, PADDING.top, PADDING.bottom]);

  if (loading) {
    return (
      <div className={`${wide ? 'h-[280px]' : 'h-[240px]'} flex items-center justify-center text-sm text-on-surface-variant`}>
        Loading chart...
      </div>
    );
  }

  const labelEvery = period === 'month' ? (wide ? 5 : 6) : period === 'quarter' ? 2 : 2;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className={`w-full ${wide ? 'h-[280px]' : 'h-[240px]'} block`}
        role="img"
        aria-label={`Revenue chart for ${period}`}
      >
        {chart.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PADDING.left}
              y1={tick.y}
              x2={chartWidth - PADDING.right}
              y2={tick.y}
              stroke="#e3e5e5"
              strokeDasharray="4 4"
            />
            <text
              x={PADDING.left - 6}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-on-surface-variant"
              fontSize={wide ? '9' : '10'}
            >
              ${formatMoney(tick.value)}
            </text>
          </g>
        ))}

        {chartType === 'bar' &&
          chart.coords.map((point) => (
            <rect
              key={point.key}
              x={point.x}
              y={point.y}
              width={point.barWidth}
              height={PADDING.top + chart.innerHeight - point.y}
              rx="2"
              fill="#006a50"
              opacity="0.85"
            >
              <title>{`${point.label}: $${formatMoney(point.revenue)} · ${point.orders} orders`}</title>
            </rect>
          ))}

        {chartType === 'line' && (
          <>
            <path
              d={chart.linePath}
              fill="none"
              stroke="#006a50"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {chart.coords.map((point) => (
              <circle key={point.key} cx={point.x} cy={point.y} r="3.5" fill="#006a50">
                <title>{`${point.label}: $${formatMoney(point.revenue)} · ${point.orders} orders`}</title>
              </circle>
            ))}
          </>
        )}

        {chart.coords.map((point, index) =>
          index % labelEvery === 0 || index === chart.coords.length - 1 ? (
            <text
              key={`${point.key}-label`}
              x={chartType === 'bar' ? point.x + point.barWidth / 2 : point.x}
              y={chartHeight - 14}
              textAnchor="middle"
              className="fill-on-surface-variant"
              fontSize="9"
            >
              {point.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
};

export default AdminStatsChart;
