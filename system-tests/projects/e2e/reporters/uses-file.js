module.exports = function Reporter (runner) {
  runner.on('suite', function (suite) {
    console.log('suite.file:', suite.file)
  })
}
