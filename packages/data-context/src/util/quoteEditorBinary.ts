// launch-editor tokenizes the editor with shell-quote, so single-quote it to keep it one argv value
export const quoteEditorBinary = (binary: string): string => {
  return `'${binary.replace(/'/g, `'\\''`)}'`
}
