module.exports = (on, config) => {
  return {
    ...config,
    env: {
      hello: 'esm',
    },
  }
}
