/* eslint-disable no-console */
module.exports = function Reporter (runner) {
  runner.on('test end', function (test) {
    console.log(test.title)
  })

  runner.on('end', function () {
    console.log('finished!')
  })
}
