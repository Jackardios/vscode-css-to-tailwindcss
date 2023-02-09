export function isPlainObject(value: any) {
  return typeof value === "object" && !Array.isArray(value) && value !== null;
}
