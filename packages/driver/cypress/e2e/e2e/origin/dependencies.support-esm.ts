export const add = (a, b) => a + b

export default (string) => {
  return string.replace(/\s+/g, '_')
}
