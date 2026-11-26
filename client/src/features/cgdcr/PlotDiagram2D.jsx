import React, { useMemo } from 'react';
import { ShieldCheck, Info, Maximize2, Compass } from 'lucide-react';

/**
 * Clean rule reference string helper
 */
function cleanRuleText(value = '') {
  return String(value)
    .replace(/CGDCR\s+Chapter\s+12\s*[·•-]?\s*Regulation\s+12\.4\.\d+/gi, 'Tall Building policy')
    .replace(/\b(?:CGDCR\s+)?Chapter\s+\d+(?:\.\d+)*\b/gi, '')
    .replace(/\bRegulation\s+\d+(?:\.\d+)*\b/gi, '')
    .replace(/\bclause\s+\d+(?:\.\d+)*(?:\(\d+\))?\b/gi, '')
    .replace(/\bTables?\s+\d+(?:\.\d+)?[A-Z]?(?:\s*(?:[–—/-]\s*\d+(?:\.\d+)?[A-Z]?))*\b/gi, 'applicable schedule')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Interactive 2D Plot Diagram Component
 *
 * Visualizes:
 * - Plot boundary with dimensions & total plot area
 * - Abutting public roads on active sides (front, rear, left, right) with widths
 * - Setback / margin bands on all 4 sides with exact setback dimensions
 * - Permissible ground buildable footprint area and ground coverage
 * - Full accessible text description (table + screen-reader text)
 * - Legend and prominent explanatory disclaimer (Not an official survey)
 */
export default function PlotDiagram2D({
  category = '',
  authority = '',
  area = '',
  zoneCode = '',
  roadWidths = {},
  plotArea = '',
  buildingUse = '',
  buildingUnitArea = '',
  buildingHeight = '',
  rearSideAssessment = null,
  marginValues = {},
  notes = [],
}) {
  const parsedPlotArea = Number(plotArea) || 0;

  // Calculate realistic representative plot dimensions based on entered plot area
  // Standard urban plot aspect ratio ~ 1 : 1.35 (width : depth)
  const plotDimensions = useMemo(() => {
    if (parsedPlotArea <= 0) return { width: 20, depth: 25, area: 0 };
    const width = Math.max(6, Math.round(Math.sqrt(parsedPlotArea / 1.35) * 10) / 10);
    const depth = Math.max(8, Math.round((parsedPlotArea / width) * 10) / 10);
    return { width, depth, area: parsedPlotArea };
  }, [parsedPlotArea]);

  // Extract numeric margins in meters
  const numericMargins = useMemo(() => {
    const parseM = (val) => {
      if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, val);
      if (!val) return 0;
      const match = String(val).match(/([\d.]+)\s*m?/i);
      return match ? Math.max(0, Number(match[1])) : 0;
    };

    return {
      front: parseM(marginValues.front?.value),
      rear: parseM(marginValues.rear?.value),
      left: parseM(marginValues.left?.value),
      right: parseM(marginValues.right?.value),
    };
  }, [marginValues]);

  // Calculate permissible ground buildable footprint
  const buildableFootprint = useMemo(() => {
    const { width, depth } = plotDimensions;
    const { front, rear, left, right } = numericMargins;

    const bWidth = Math.max(0, Math.round((width - left - right) * 10) / 10);
    const bDepth = Math.max(0, Math.round((depth - front - rear) * 10) / 10);
    const bArea = Math.max(0, Math.round(bWidth * bDepth * 10) / 10);
    const coveragePercent = parsedPlotArea > 0 ? Math.min(100, Math.round((bArea / parsedPlotArea) * 100)) : 0;

    return {
      width: bWidth,
      depth: bDepth,
      area: bArea,
      coveragePercent,
    };
  }, [plotDimensions, numericMargins, parsedPlotArea]);

  // SVG Drawing Layout Coordinates (ViewBox: 0 0 540 380)
  // Center plot rect
  const plotBox = { x: 160, y: 80, width: 220, height: 180 };

  // Calculate margin bands inside plotBox proportionally
  const marginBands = useMemo(() => {
    const { width: pW, depth: pD } = plotDimensions;
    if (pW <= 0 || pD <= 0) return { front: 25, rear: 20, left: 20, right: 20 };

    // Scale factors: SVG pixels per meter
    const scaleX = plotBox.width / pW;
    const scaleY = plotBox.height / pD;

    // Minimum visual band width 16px, maximum 45% of plot dimension
    const clampBand = (val, scale, maxAllowed) => {
      if (val <= 0) return 0;
      const visualPx = val * scale;
      return Math.min(maxAllowed, Math.max(16, visualPx));
    };

    return {
      front: clampBand(numericMargins.front, scaleY, plotBox.height * 0.42),
      rear: clampBand(numericMargins.rear, scaleY, plotBox.height * 0.42),
      left: clampBand(numericMargins.left, scaleX, plotBox.width * 0.42),
      right: clampBand(numericMargins.right, scaleX, plotBox.width * 0.42),
    };
  }, [plotDimensions, numericMargins]);

  // Buildable box inside plot
  const buildableBox = {
    x: plotBox.x + marginBands.left,
    y: plotBox.y + marginBands.rear,
    width: Math.max(0, plotBox.width - marginBands.left - marginBands.right),
    height: Math.max(0, plotBox.height - marginBands.front - marginBands.rear),
  };

  const sides = ['rear', 'left', 'right', 'front'];
  const roadSides = sides.filter((s) => roadWidths[s] !== '' && Number(roadWidths[s]) > 0);

  // Format margin label for rendering
  const formatMarginLabel = (side) => {
    const val = marginValues[side]?.value;
    if (val == null) return 'Unspecified';
    if (val === 0) return 'Nil / 0 m';
    return typeof val === 'number' ? `${val} m` : String(val);
  };

  return (
    <div className="cgdcr-plot-diagram-wrapper" role="region" aria-label="Interactive 2D Land Plot Feasibility Diagram">
      {/* Top Banner / Disclaimer */}
      <div className="cgdcr-diagram-banner">
        <div className="banner-left">
          <span className="diagram-badge">
            <Compass size={13} className="text-[#32857d]" />
            EXPLANATORY 2D PLOT DIAGRAM
          </span>
          <span className="diagram-subbadge">CGDCR-2017 RULES</span>
        </div>
        <div className="banner-right">
          <span className="disclaimer-chip">
            <ShieldCheck size={13} />
            NOT AN OFFICIAL SURVEY OR SANCTION
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="cgdcr-svg-container">
        <svg
          viewBox="0 0 540 370"
          className="cgdcr-plot-svg"
          role="img"
          aria-labelledby="diagram-title diagram-desc"
        >
          <title id="diagram-title">Plot Layout & Margin Feasibility Diagram</title>
          <desc id="diagram-desc">
            Schematic showing plot boundary of {parsedPlotArea} m² ({plotDimensions.width} m × {plotDimensions.depth} m),
            front setback {formatMarginLabel('front')}, rear setback {formatMarginLabel('rear')},
            left setback {formatMarginLabel('left')}, right setback {formatMarginLabel('right')},
            and permissible ground buildable footprint area of ~{buildableFootprint.area} m².
          </desc>

          <defs>
            {/* Pattern for Margin Setback Area */}
            <pattern id="setbackHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#f0cfc4" strokeWidth="1.2" />
            </pattern>

            {/* Pattern for Buildable Footprint Area */}
            <pattern id="buildableGrid" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#d5ede9" strokeWidth="0.8" />
            </pattern>

            {/* Marker for Dimension Lines */}
            <marker id="dimArrow" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 1.5 L 4.5 3 L 0 4.5 z" fill="#62758a" />
            </marker>
          </defs>

          {/* BACKGROUND CANVAS */}
          <rect x="0" y="0" width="540" height="370" fill="#fcfdfe" rx="8" />

          {/* ABUTTING ROADS */}
          {/* Rear Road (Top) */}
          {roadSides.includes('rear') && (
            <g className="road-group">
              <rect x="110" y="22" width="320" height="42" rx="4" fill="#3b4859" />
              <line x1="110" y1="43" x2="430" y2="43" stroke="#90a0b2" strokeWidth="1.2" strokeDasharray="6 5" />
              <text x="270" y="38" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" letterSpacing="0.5">
                REAR ROAD · {roadWidths.rear} m WIDTH
              </text>
            </g>
          )}

          {/* Front Road (Bottom) */}
          {roadSides.includes('front') && (
            <g className="road-group">
              <rect x="110" y="275" width="320" height="46" rx="4" fill="#3b4859" />
              <line x1="110" y1="298" x2="430" y2="298" stroke="#90a0b2" strokeWidth="1.2" strokeDasharray="6 5" />
              <text x="270" y="293" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" letterSpacing="0.5">
                FRONT ROAD · {roadWidths.front} m WIDTH
              </text>
              <text x="270" y="307" textAnchor="middle" fill="#d0dbe6" fontSize="7.5" fontWeight="600">
                Primary Access Frontage
              </text>
            </g>
          )}

          {/* Left Road */}
          {roadSides.includes('left') && (
            <g className="road-group">
              <rect x="30" y="70" width="112" height="200" rx="4" fill="#3b4859" />
              <line x1="86" y1="70" x2="86" y2="270" stroke="#90a0b2" strokeWidth="1.2" strokeDasharray="6 5" />
              <text x="86" y="172" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800" transform="rotate(-90 86 172)" letterSpacing="0.5">
                SIDE ROAD (LEFT) · {roadWidths.left} m
              </text>
            </g>
          )}

          {/* Right Road */}
          {roadSides.includes('right') && (
            <g className="road-group">
              <rect x="398" y="70" width="112" height="200" rx="4" fill="#3b4859" />
              <line x1="454" y1="70" x2="454" y2="270" stroke="#90a0b2" strokeWidth="1.2" strokeDasharray="6 5" />
              <text x="454" y="172" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800" transform="rotate(90 454 172)" letterSpacing="0.5">
                SIDE ROAD (RIGHT) · {roadWidths.right} m
              </text>
            </g>
          )}

          {/* PLOT BOUNDARY BACKGROUND */}
          <rect
            x={plotBox.x}
            y={plotBox.y}
            width={plotBox.width}
            height={plotBox.height}
            fill="#ffffff"
            stroke="#2c3e50"
            strokeWidth="2"
            strokeDasharray="none"
          />

          {/* MARGIN SETBACK AREAS (SHADED PEACH / HATCH) */}
          {/* Rear Margin */}
          {marginBands.rear > 0 && (
            <g>
              <rect x={plotBox.x} y={plotBox.y} width={plotBox.width} height={marginBands.rear} fill="#fdf4f1" />
              <rect x={plotBox.x} y={plotBox.y} width={plotBox.width} height={marginBands.rear} fill="url(#setbackHatch)" />
              <line x1={plotBox.x} y1={plotBox.y + marginBands.rear} x2={plotBox.x + plotBox.width} y2={plotBox.y + marginBands.rear} stroke="#d98270" strokeWidth="1" strokeDasharray="4 3" />
              <text x={plotBox.x + plotBox.width / 2} y={plotBox.y + marginBands.rear / 2 + 3} textAnchor="middle" fill="#8e3d2f" fontSize="7.5" fontWeight="700">
                Rear Setback: {formatMarginLabel('rear')}
              </text>
            </g>
          )}

          {/* Front Margin */}
          {marginBands.front > 0 && (
            <g>
              <rect x={plotBox.x} y={plotBox.y + plotBox.height - marginBands.front} width={plotBox.width} height={marginBands.front} fill="#fdf4f1" />
              <rect x={plotBox.x} y={plotBox.y + plotBox.height - marginBands.front} width={plotBox.width} height={marginBands.front} fill="url(#setbackHatch)" />
              <line x1={plotBox.x} y1={plotBox.y + plotBox.height - marginBands.front} x2={plotBox.x + plotBox.width} y2={plotBox.y + plotBox.height - marginBands.front} stroke="#d98270" strokeWidth="1" strokeDasharray="4 3" />
              <text x={plotBox.x + plotBox.width / 2} y={plotBox.y + plotBox.height - marginBands.front / 2 + 3} textAnchor="middle" fill="#8e3d2f" fontSize="8" fontWeight="800">
                Front Margin Setback: {formatMarginLabel('front')}
              </text>
            </g>
          )}

          {/* Left Margin */}
          {marginBands.left > 0 && (
            <g>
              <rect x={plotBox.x} y={plotBox.y + marginBands.rear} width={marginBands.left} height={plotBox.height - marginBands.rear - marginBands.front} fill="#fdf4f1" />
              <rect x={plotBox.x} y={plotBox.y + marginBands.rear} width={marginBands.left} height={plotBox.height - marginBands.rear - marginBands.front} fill="url(#setbackHatch)" />
              <line x1={plotBox.x + marginBands.left} y1={plotBox.y} x2={plotBox.x + marginBands.left} y2={plotBox.y + plotBox.height} stroke="#d98270" strokeWidth="1" strokeDasharray="4 3" />
              <text x={plotBox.x + marginBands.left / 2} y={plotBox.y + plotBox.height / 2} textAnchor="middle" fill="#8e3d2f" fontSize="7" fontWeight="700" transform={`rotate(-90 ${plotBox.x + marginBands.left / 2} ${plotBox.y + plotBox.height / 2})`}>
                Left: {formatMarginLabel('left')}
              </text>
            </g>
          )}

          {/* Right Margin */}
          {marginBands.right > 0 && (
            <g>
              <rect x={plotBox.x + plotBox.width - marginBands.right} y={plotBox.y + marginBands.rear} width={marginBands.right} height={plotBox.height - marginBands.rear - marginBands.front} fill="#fdf4f1" />
              <rect x={plotBox.x + plotBox.width - marginBands.right} y={plotBox.y + marginBands.rear} width={marginBands.right} height={plotBox.height - marginBands.rear - marginBands.front} fill="url(#setbackHatch)" />
              <line x1={plotBox.x + plotBox.width - marginBands.right} y1={plotBox.y} x2={plotBox.x + plotBox.width - marginBands.right} y2={plotBox.y + plotBox.height} stroke="#d98270" strokeWidth="1" strokeDasharray="4 3" />
              <text x={plotBox.x + plotBox.width - marginBands.right / 2} y={plotBox.y + plotBox.height / 2} textAnchor="middle" fill="#8e3d2f" fontSize="7" fontWeight="700" transform={`rotate(90 ${plotBox.x + plotBox.width - marginBands.right / 2} ${plotBox.y + plotBox.height / 2})`}>
                Right: {formatMarginLabel('right')}
              </text>
            </g>
          )}

          {/* BUILDABLE FOOTPRINT AREA (GROUND COVERAGE) */}
          {buildableBox.width > 0 && buildableBox.height > 0 && (
            <g className="buildable-group">
              <rect
                x={buildableBox.x}
                y={buildableBox.y}
                width={buildableBox.width}
                height={buildableBox.height}
                fill="#eef8f6"
                stroke="#2b8277"
                strokeWidth="1.5"
                rx="2"
              />
              <rect
                x={buildableBox.x}
                y={buildableBox.y}
                width={buildableBox.width}
                height={buildableBox.height}
                fill="url(#buildableGrid)"
                rx="2"
              />

              {/* Buildable Area Text Labels */}
              <text x={buildableBox.x + buildableBox.width / 2} y={buildableBox.y + buildableBox.height / 2 - 14} textAnchor="middle" fill="#185950" fontSize="10" fontWeight="800">
                PERMISSIBLE BUILDABLE AREA
              </text>
              <text x={buildableBox.x + buildableBox.width / 2} y={buildableBox.y + buildableBox.height / 2 + 1} textAnchor="middle" fill="#207065" fontSize="8.5" fontWeight="700">
                Ground Footprint: ~{buildableFootprint.area} m² ({buildableFootprint.coveragePercent}%)
              </text>
              <text x={buildableBox.x + buildableBox.width / 2} y={buildableBox.y + buildableBox.height / 2 + 15} textAnchor="middle" fill="#527872" fontSize="7.5">
                Dimensions: {buildableFootprint.width} m × {buildableFootprint.depth} m
              </text>
            </g>
          )}

          {/* PLOT BOUNDARY DIMENSION LABELS & TICKS */}
          {/* Top Width */}
          <text x={plotBox.x + plotBox.width / 2} y={plotBox.y - 6} textAnchor="middle" fill="#3c4d62" fontSize="8" fontWeight="700">
            Plot Width: {plotDimensions.width} m
          </text>
          {/* Left Depth */}
          <text x={plotBox.x - 8} y={plotBox.y + plotBox.height / 2} textAnchor="middle" fill="#3c4d62" fontSize="8" fontWeight="700" transform={`rotate(-90 ${plotBox.x - 8} ${plotBox.y + plotBox.height / 2})`}>
            Plot Depth: {plotDimensions.depth} m
          </text>

          {/* Compass / Orientation Indicator (Top Right) */}
          <g transform="translate(485, 36)">
            <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#c9d5e2" strokeWidth="1.2" />
            <path d="M 0 -11 L 3.5 0 L 0 2.5 L -3.5 0 Z" fill="#d9534f" />
            <path d="M 0 11 L 3.5 0 L 0 -2.5 L -3.5 0 Z" fill="#6c7a89" />
            <text x="0" y="-13" textAnchor="middle" fill="#d9534f" fontSize="7.5" fontWeight="800">N</text>
          </g>

          {/* Total Plot Area Badge (Bottom Left Inside Plot) */}
          <g transform={`translate(${plotBox.x + 8}, ${plotBox.y + plotBox.height - 8})`}>
            <rect x="0" y="-16" width="112" height="16" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
            <text x="56" y="-5" textAnchor="middle" fill="#334155" fontSize="7.5" fontWeight="700">
              Site Area: {parsedPlotArea} m²
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Parameters Summary Bar */}
      <div className="cgdcr-diagram-legend">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color-box border-plot" />
            <span>Plot Boundary ({plotDimensions.width} m × {plotDimensions.depth} m)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box bg-setback" />
            <span>Required Setbacks / Margins</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box bg-buildable" />
            <span>Permissible Ground Footprint (~{buildableFootprint.area} m²)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-box bg-road" />
            <span>Abutting Public Roads</span>
          </div>
        </div>

        {/* Dimension & Setback Stats Chips */}
        <div className="cgdcr-diagram-stats-chips">
          <div className="stat-chip">
            <small>FRONT SETBACK</small>
            <b>{formatMarginLabel('front')}</b>
          </div>
          <div className="stat-chip">
            <small>REAR SETBACK</small>
            <b>{formatMarginLabel('rear')}</b>
          </div>
          <div className="stat-chip">
            <small>SIDE (L / R)</small>
            <b>{formatMarginLabel('left')} / {formatMarginLabel('right')}</b>
          </div>
          <div className="stat-chip highlight">
            <small>GROUND COVERAGE</small>
            <b>{buildableFootprint.coveragePercent}% (~{buildableFootprint.area} m²)</b>
          </div>
        </div>
      </div>

      {/* Accessible Text Description */}
      <div className="cgdcr-accessible-summary">
        <p>
          <strong>Site &amp; Setback Geometry Summary:</strong> For a site of {parsedPlotArea} m² (estimated {plotDimensions.width} m frontage × {plotDimensions.depth} m depth),
          the required front setback is {formatMarginLabel('front')}, rear setback is {formatMarginLabel('rear')},
          and side setbacks are {formatMarginLabel('left')} (left) and {formatMarginLabel('right')} (right).
          The resulting permissible ground buildable footprint is approximately {buildableFootprint.width} m × {buildableFootprint.depth} m,
          yielding up to ~{buildableFootprint.area} m² of ground coverage ({buildableFootprint.coveragePercent}% of plot).
        </p>
      </div>

      {/* Applicable Regulation Notes */}
      {notes.length > 0 && (
        <div className="cgdcr-diagram-notes">
          <div className="notes-header">
            <Info size={14} className="text-[#32857d]" />
            <span>CGDCR Setback &amp; Margin Provisions</span>
          </div>
          <ul className="notes-list">
            {notes.map((note, index) => (
              <li key={index}>{cleanRuleText(note)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
