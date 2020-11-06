module.exports = {
  preset: 'ts-jest',
  testRegex: '(\\.|/)test\\.[jt]s$',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', 'examples'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json',
    },
  },
}
