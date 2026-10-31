// Kept dependency-free because the lightweight Module API entry imports it.

const isObject = (val: unknown): boolean => {
  return typeof val === 'function' || (typeof val === 'object' && val !== null)
}

const stringify = (val: any): string => {
  return isObject(val) ? JSON.stringify(val) : val
}

export function normalizeModuleOptions (options: any = {}): any {
  return Object.fromEntries(Object.entries(options ?? {}).map(([key, val]) => [key, stringify(val)]))
}
