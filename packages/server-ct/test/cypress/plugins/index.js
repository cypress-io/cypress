// const webpackConfig = require('@vue/cli-service/webpack.config')

module.exports = (on) => {
  on('devserver:config', () => {
    return { foo: 'bar' }
  })
}
