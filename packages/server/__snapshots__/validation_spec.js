exports['not one of the strings error message'] = `
Expected \`test\` to be one of these values: "foo", "bar". Instead the value was: \`"nope"\`
`

exports['number instead of string'] = `
Expected \`test\` to be one of these values: "foo", "bar". Instead the value was: \`42\`
`

exports['null instead of string'] = `
Expected \`test\` to be one of these values: "foo", "bar". Instead the value was: \`null\`
`

exports['not one of the numbers error message'] = `
Expected \`test\` to be one of these values: 1, 2, 3. Instead the value was: \`4\`
`

exports['string instead of a number'] = `
Expected \`test\` to be one of these values: 1, 2, 3. Instead the value was: \`"foo"\`
`

exports['null instead of a number'] = `
Expected \`test\` to be one of these values: 1, 2, 3. Instead the value was: \`null\`
`

exports['lib/util/validation #isValidBrowser passes valid browsers and forms error messages for invalid ones isValidBrowser 1'] = {
  "name": "isValidBrowser",
  "behavior": [
    {
      "given": {
        "name": "Chrome",
        "displayName": "Chrome Browser",
        "family": "chromium",
        "path": "/path/to/chrome",
        "version": "1.2.3",
        "majorVersion": 1
      },
      "expect": true
    },
    {
      "given": {
        "name": "FF",
        "displayName": "Firefox",
        "family": "firefox",
        "path": "/path/to/firefox",
        "version": "1.2.3",
        "majorVersion": "1"
      },
      "expect": true
    },
    {
      "given": {
        "name": "Electron",
        "displayName": "Electron",
        "family": "chromium",
        "path": "",
        "version": "99.101.3",
        "majorVersion": 99
      },
      "expect": true
    },
    {
      "given": {
        "name": "No display name",
        "family": "chromium"
      },
      "expect": "Expected `displayName` to be a non-empty string. Instead the value was: `{\"name\":\"No display name\",\"family\":\"chromium\"}`"
    },
    {
      "given": {
        "name": "bad family",
        "displayName": "Bad family browser",
        "family": "unknown family"
      },
      "expect": "Expected `family` to be either chromium or firefox. Instead the value was: `{\"name\":\"bad family\",\"displayName\":\"Bad family browser\",\"family\":\"unknown family\"}`"
    }
  ]
}

exports['undefined browsers'] = `
Missing browsers list
`

exports['empty list of browsers'] = `
Expected at least one browser
`

exports['browsers list with a string'] = `
Found an error while validating the \`browsers\` list. Expected \`name\` to be a non-empty string. Instead the value was: \`"foo"\`
`
