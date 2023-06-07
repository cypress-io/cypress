// Ensure import replacement is not too aggressive
// Should not replace this function name despite invocation looking like `import()`
export const custom_import = (value: string) => {
  return `123${value}`
}
