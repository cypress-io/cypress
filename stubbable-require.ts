export = {
  resolve (dependency: string) {
    return require.resolve(dependency)
  },
}
