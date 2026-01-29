// Chart configuration using CSS variables for theme consistency
export const chartColors = {
  primary: "hsl(var(--chart-1))",
  success: "hsl(var(--chart-2))",
  warning: "hsl(var(--chart-3))",
  purple: "hsl(var(--chart-4))",
  red: "hsl(var(--chart-5))",
  muted: "hsl(var(--muted-foreground))",
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
