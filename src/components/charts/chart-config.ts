// Chart colors - hex values that work with Recharts SVG rendering
// Softer, desaturated tones that work well in dark mode without being too aggressive
export const chartColors = {
  primary: "#7dd3fc", // Soft sky blue - for TPS chart
  success: "#86efac", // Soft mint green - for transaction volume
  warning: "#67e8f9", // Soft cyan - for fees
  purple: "#d8b4fe", // Soft lavender - for contracts
  red: "#fca5a5", // Soft coral - for failed transactions
  muted: "#a1a1aa", // Zinc gray - for muted elements
};

export const chartConfig = {
  height: 180,
  mobileHeight: 140,
  animationDuration: 300,
  tpsBufferSize: 30, // ~2.5 minutes at 5s intervals
  txAccumulationHours: 24,
};

// Common chart styling
export const chartAxisStyle = {
  fontSize: 10,
  fill: "hsl(var(--muted-foreground))",
  fontFamily: "inherit",
};

export const chartGridStyle = {
  strokeDasharray: "3 3",
  stroke: "hsl(var(--border))",
  strokeOpacity: 0.5,
};

export const chartTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  padding: "8px 12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};
