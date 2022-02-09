exports['undefined browsers'] = `
Missing browsers list
`

exports['empty list of browsers'] = `
Expected at least one browser
`

exports['browsers list with a string'] = `
Found an error while validating the \`browsers\` list. Expected \`name\` to be a non-empty string. Instead the value was: \`"foo"\`
`

exports['src/validation .isValidBrowser passes valid browsers and forms error messages for invalid ones isValidBrowser 1'] = {
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

exports['src/validation .isStringOrFalse returns error message when value is neither string nor false 1'] = `
Expected \`mockConfigKey\` to be a string or false. Instead the value was: \`null\`
`

exports['src/validation .isBoolean returns error message when value is a not a string 1'] = `
Expected \`mockConfigKey\` to be a string. Instead the value was: \`1\`
`

exports['src/validation .isString returns error message when value is a not a string 1'] = `
Expected \`mockConfigKey\` to be a string. Instead the value was: \`1\`
`

exports['src/validation .isArray returns error message when value is a non-array 1'] = `
Expected \`mockConfigKey\` to be an array. Instead the value was: \`1\`
`

exports['not string or array'] = `
Expected \`mockConfigKey\` to be a string or an array of strings. Instead the value was: \`null\`
`

exports['array of non-strings'] = `
Expected \`mockConfigKey\` to be a string or an array of strings. Instead the value was: \`[1,2,3]\`
`

exports['src/validation .isNumberOrFalse returns error message when value is a not number or false 1'] = `
Expected \`mockConfigKey\` to be a number or false. Instead the value was: \`null\`
`

exports['src/validation .isPlainObject returns error message when value is a not an object 1'] = `
Expected \`mockConfigKey\` to be a plain object. Instead the value was: \`1\`
`

exports['src/validation .isNumber returns error message when value is a not a number 1'] = `
Expected \`mockConfigKey\` to be a number. Instead the value was: \`"string"\`
`

exports['invalid retry value'] = `
Expected \`mockConfigKey\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls. Instead the value was: \`"1"\`
`

exports['invalid retry object'] = `
Expected \`mockConfigKey\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls. Instead the value was: \`{"fakeMode":1}\`
`

exports['src/validation .isValidClientCertificatesSet returns error message for certs not passed as an array array 1'] = `
Expected \`mockConfigKey\` to be a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls. Instead the value was: \`"1"\`
`

exports['src/validation .isValidClientCertificatesSet returns error message for certs object without url 1'] = `
Expected \`clientCertificates[0].url\` to be a URL matcher. Instead the value was: \`undefined\`
`

exports['missing https protocol'] = `
Expected \`clientCertificates[0].url\` to be an https protocol. Instead the value was: \`"http://url.com"\`
`

exports['invalid url'] = `
Expected \`clientCertificates[0].url\` to be a valid URL. Instead the value was: \`"not *"\`
`

exports['not qualified url'] = `
Expected \`mockConfigKey\` to be a fully qualified URL (starting with \`http://\` or \`https://\`). Instead the value was: \`"url.com"\`
`

exports['empty string'] = `
Expected \`mockConfigKey\` to be a fully qualified URL (starting with \`http://\` or \`https://\`). Instead the value was: \`""\`
`