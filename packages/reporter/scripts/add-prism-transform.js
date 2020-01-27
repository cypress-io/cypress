module.exports = (browserifyOptions) => {
  browserifyOptions.transform[0][1].plugins.push(['prismjs', {
    'languages': ['javascript', 'coffeescript', 'typescript', 'jsx', 'tsx'],
    'plugins': ['line-highlight'],
    'theme': 'default',
    'css': false,
  }])
}
