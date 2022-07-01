exports.cypressServer = async function () {
  await require('./entry')
}

exports.webpackRequire = eval(`__webpack_require__`)
