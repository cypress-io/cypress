module.exports = {
  resolve (dependency) {
    return require.resolve(dependency)
  },
}
