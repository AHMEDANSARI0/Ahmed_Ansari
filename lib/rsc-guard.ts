export function hasDatabase() {
  return Boolean(typeof process !== "undefined" && process.env.DATABASE_URL);
}
