"use client";
import clsx from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  /** Rendered width/height in px (the SVG scales from a 100×100 viewBox). */
  size?: number;
  /** Render "SkyInsight / AI for Airlines" text beside the icon. */
  showText?: boolean;
  className?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────
/** Quadratic-bezier arc that the plane follows. */
const ARC = "M 18 65 Q 50 18 82 65";

/** Animated data bars: [x, baseHeight, animDuration, animDelay] */
const BARS: [number, number, string, string][] = [
  [26, 9,  "1.8s", "0.0s"],
  [34, 13, "2.1s", "0.3s"],
  [42, 11, "1.9s", "0.6s"],
  [50, 15, "2.2s", "0.9s"],
  [58, 10, "1.7s", "1.2s"],
  [67, 12, "2.0s", "1.5s"],
];

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * Animated SkyInsight logo.
 *
 * Renders an inline SVG icon showing:
 * - A navy gradient rounded-square background
 * - A gold pulsing outer ring
 * - Two faint radar dashed circles
 * - A dashed gold flight-arc trajectory
 * - A top-view airplane that travels along the arc with auto-rotation
 * - Two trailing glow dots
 * - Six animated analytics bar-chart columns at the bottom
 *
 * Optionally renders the "SkyInsight / AI for Airlines" wordmark beside it.
 */
export default function AnimatedLogo({
  size = 40,
  showText = true,
  className,
}: Props) {
  return (
    <div className={clsx("flex items-center gap-2.5 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="SkyInsight logo"
      >
        <defs>
          {/* Background: navy → steel gradient */}
          <linearGradient id="si-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1A3263" />
            <stop offset="55%"  stopColor="#3F5E78" />
            <stop offset="100%" stopColor="#547792" />
          </linearGradient>

          {/* Plane glow filter */}
          <filter id="si-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dot glow filter */}
          <filter id="si-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Shared arc path referenced by animateMotion */}
          <path id="si-arc" d={ARC} />
        </defs>

        {/* ── Background ──────────────────────────────────────────────── */}
        <rect width="100" height="100" rx="22" fill="url(#si-bg)" />

        {/* ── Outer pulse ring ────────────────────────────────────────── */}
        <rect
          width="100"
          height="100"
          rx="22"
          fill="none"
          stroke="#FFC570"
          strokeWidth="2.5"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.75;0;0.75"
            dur="2.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values="2.5;6;2.5"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </rect>

        {/* ── Inner radar-sweep ring (slow rotation) ──────────────────── */}
        <circle
          cx="50"
          cy="44"
          r="18"
          fill="none"
          stroke="rgba(255,197,112,0.25)"
          strokeWidth="0.75"
          strokeDasharray="3 2.5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 44"
            to="360 50 44"
            dur="12s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx="50"
          cy="44"
          r="28"
          fill="none"
          stroke="rgba(255,197,112,0.12)"
          strokeWidth="0.75"
          strokeDasharray="3 2.5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 50 44"
            to="0 50 44"
            dur="18s"
            repeatCount="indefinite"
          />
        </circle>

        {/* ── Flight arc path ──────────────────────────────────────────── */}
        <path
          d={ARC}
          fill="none"
          stroke="#FFC570"
          strokeWidth="1.2"
          strokeDasharray="5 3.5"
          opacity="0.55"
        />

        {/* ── Trailing dot 2 (furthest behind) ────────────────────────── */}
        <circle r="1.5" fill="#FFC570" opacity="0.35" filter="url(#si-dot-glow)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="-2.45s">
            <mpath href="#si-arc" />
          </animateMotion>
        </circle>

        {/* ── Trailing dot 1 (closer behind) ──────────────────────────── */}
        <circle r="2" fill="#FFC570" opacity="0.6" filter="url(#si-dot-glow)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="-2.72s">
            <mpath href="#si-arc" />
          </animateMotion>
        </circle>

        {/* ── Plane (travels along arc, auto-rotates) ─────────────────── */}
        <g filter="url(#si-glow)">
          <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
            <mpath href="#si-arc" />
          </animateMotion>
          {/*
           * Top-view airplane pointing right (+X axis), centered at (0,0).
           * rotate="auto" will orient it to face the direction of travel.
           */}
          <g fill="#FFD693">
            {/* Fuselage */}
            <ellipse cx="0.5" cy="0" rx="7" ry="1.9" />
            {/* Left wing (sweeps back-upward) */}
            <path d="M 1 -1.5 L -2.5 -8.5 L -4.5 -7.5 L -1.5 -1.5 Z" />
            {/* Right wing (sweeps back-downward) */}
            <path d="M 1 1.5 L -2.5 8.5 L -4.5 7.5 L -1.5 1.5 Z" />
            {/* Left tail fin */}
            <path d="M -4 -1.2 L -7 -4 L -5.8 -1.2 Z" />
            {/* Right tail fin */}
            <path d="M -4  1.2 L -7  4 L -5.8  1.2 Z" />
          </g>
        </g>

        {/* ── Analytics bars (bottom) ─────────────────────────────────── */}
        {BARS.map(([x, h, dur, delay], i) => (
          <rect
            key={i}
            x={x}
            y={90 - h}
            width="5"
            height={h}
            rx="1.5"
            fill="#FFC570"
            opacity="0.75"
          >
            <animate
              attributeName="height"
              values={`${h};${h + 5};${h}`}
              dur={dur}
              repeatCount="indefinite"
              begin={delay}
            />
            <animate
              attributeName="y"
              values={`${90 - h};${90 - h - 5};${90 - h}`}
              dur={dur}
              repeatCount="indefinite"
              begin={delay}
            />
          </rect>
        ))}
      </svg>

      {showText && (
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight text-navy">
            SkyInsight
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-steel">
            AI for Airlines
          </div>
        </div>
      )}
    </div>
  );
}
