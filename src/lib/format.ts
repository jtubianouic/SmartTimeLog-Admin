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