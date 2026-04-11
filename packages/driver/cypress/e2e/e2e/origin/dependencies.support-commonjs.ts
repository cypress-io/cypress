function snakeCase (string) {
  return string.replace(/\s+/g, '_')
}

snakeCase.add = (a, b) => a + b

module.exports = snakeCase
