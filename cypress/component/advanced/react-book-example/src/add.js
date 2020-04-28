function add(a, b) {
  if (a > 0 && b > 0) {
    return a + b
  }
  throw new Error('parameters must be larger than zero')
}

export default add
