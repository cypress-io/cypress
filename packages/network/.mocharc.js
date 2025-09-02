module.exports = {
  spec: [
    'test/unit/**/*.ts',
    'test/integration/**/*.ts'
  ],
  require: '@packages/ts/register',
  timeout: 10000,
  recursive: true
}
