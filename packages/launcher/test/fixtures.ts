export const goalBrowsers = [
  {
    displayName: 'Test Browser',
    name: 'test-browser-name',
    versionRegex: /test-browser v(\S+)$/m,
    binary: 'test-browser',
  },
  {
    displayName: 'Foo Browser',
    name: 'foo-browser',
    versionRegex: /foo-browser v(\S+)$/m,
    binary: ['foo-browser', 'foo-bar-browser'],
  },
]
