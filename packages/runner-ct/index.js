const handle = (req, res) => {
  // const webpackConfig = await resolveWebpackConfig(userWebpackConfig, testConfig)
  // const compiler = webpack(webpackConfig)

  // new webpackDevServer(compiler, { hot: true }).listen(3000)
  res.send('<html>hi</html>')
}

module.exports = {
  handle,
}
