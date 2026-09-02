export function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${meters.toLocaleString("en")} m`;
  return `${(meters / 1000).toLocaleString("en", { maximumFractionDigits: 2 })} km`;
}