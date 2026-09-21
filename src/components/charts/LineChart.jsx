/**
 * LineChart - a single-series line drawn with inline SVG, used for the
 * weekly volume chart and, in its compact form, for per-exercise sparklines.
 * One hue (the brand), recessive grid, text in text tokens, a marker per
 * point with a native tooltip, and the last value labelled directly. A table
 * next to the chart carries the same numbers for anyone who cannot read it.
 */

import React, { useId } from 'react';

const LineChart = ({
    points,
    height = 160,
    compact = false,
    formatValue = (v) => String(v),
    formatLabel = (label) => label,
    ariaLabel
}) => {
    const gradientId = useId();
    const width = compact ? 120 : 600;
    const pad = compact ? { top: 6, right: 6, bottom: 6, left: 6 } : { top: 16, right: 44, bottom: 28, left: 12 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const values = points.map(p => p.value);
    const max = Math.max(1, ...values);
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    const x = (i) => pad.left + (points.length > 1 ? i * stepX : innerW / 2);
    const y = (v) => pad.top + innerH - (v / max) * innerH;
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
    const area = points.length > 1
        ? `${path} L ${x(points.length - 1).toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`
        : '';
    const last = points[points.length - 1];
    const gridLines = compact ? [] : [0.5, 1];

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-label={ariaLabel}
            style={{ display: 'block', overflow: 'visible' }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                </linearGradient>
            </defs>
            {gridLines.map(fraction => (
                <g key={fraction}>
                    <line x1={pad.left} x2={pad.left + innerW} y1={y(max * fraction)} y2={y(max * fraction)} stroke="var(--border)" strokeWidth="1" />
                    <text x={pad.left + innerW + 6} y={y(max * fraction) + 4} fontSize="11" fill="var(--text-3)">{formatValue(max * fraction)}</text>
                </g>
            ))}
            {!compact && <line x1={pad.left} x2={pad.left + innerW} y1={pad.top + innerH} y2={pad.top + innerH} stroke="var(--border-strong)" strokeWidth="1" />}
            {area && <path d={area} fill={`url(#${gradientId})`} />}
            <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
                <g key={p.label}>
                    <circle cx={x(i)} cy={y(p.value)} r={compact ? 2.5 : 4} fill="var(--surface)" stroke="var(--brand)" strokeWidth="2">
                        <title>{`${formatLabel(p.label)}: ${formatValue(p.value)}`}</title>
                    </circle>
                    {!compact && (
                        <text x={x(i)} y={height - 8} fontSize="11" fill="var(--text-3)" textAnchor={i === 0 ? 'start' : (i === points.length - 1 ? 'end' : 'middle')}>
                            {formatLabel(p.label)}
                        </text>
                    )}
                </g>
            ))}
            {!compact && last && (
                <text x={x(points.length - 1)} y={y(last.value) - 10} fontSize="12" fontWeight="700" fill="var(--text)" textAnchor="end">
                    {formatValue(last.value)}
                </text>
            )}
        </svg>
    );
};

export default LineChart;
