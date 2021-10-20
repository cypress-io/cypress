// returns invalid config with a browser that is invalid
// (missing multiple properties)
module.exports = (onFn, config) => {
  return {
    browsers: [{
      name: 'browser name',
      family: 'chromium',
    }],
  }
}
