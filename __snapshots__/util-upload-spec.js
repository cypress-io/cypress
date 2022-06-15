exports['upload util isValidPlatformArch checks given strings second 1'] = {
  "name": "second",
  "behavior": [
    {
      "given": "darwin-arm64",
      "expect": true
    },
    {
      "given": "darwin-x64",
      "expect": true
    },
    {
      "given": "linux-x64",
      "expect": true
    },
    {
      "given": "linux-arm64",
      "expect": true
    },
    {
      "given": "win32-x64",
      "expect": true
    },
    {
      "given": "darwin",
      "expect": false
    },
    {
      "given": "win32",
      "expect": false
    },
    {
      "given": "windows",
      "expect": false
    },
    {
      "given": "linux",
      "expect": false
    },
    {
      "given": "linux64",
      "expect": false
    }
  ]
}
