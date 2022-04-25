exports['undefined browsers'] = `
Missing browsers list
`

exports['empty list of browsers'] = `
Expected at least one browser
`

exports['browsers list with a string'] = {
  "key": "name",
  "value": "foo",
  "type": "a non-empty string",
  "list": "browsers"
}

exports['not one of the strings error message'] = {
  "key": "test",
  "value": "nope",
  "type": "one of these values: \"foo\", \"bar\""
}

exports['number instead of string'] = {
  "key": "test",
  "value": 42,
  "type": "one of these values: \"foo\", \"bar\""
}

exports['null instead of string'] = {
  "key": "test",
  "value": null,
  "type": "one of these values: \"foo\", \"bar\""
}

exports['not one of the numbers error message'] = {
  "key": "test",
  "value": 4,
  "type": "one of these values: 1, 2, 3"
}

exports['string instead of a number'] = {
  "key": "test",
  "value": "foo",
  "type": "one of these values: 1, 2, 3"
}

exports['null instead of a number'] = {
  "key": "test",
  "value": null,
  "type": "one of these values: 1, 2, 3"
}

exports['not string or array'] = {
  "key": "mockConfigKey",
  "value": null,
  "type": "a string or an array of strings"
}

exports['array of non-strings'] = {
  "key": "mockConfigKey",
  "value": [
    1,
    2,
    3
  ],
  "type": "a string or an array of strings"
}

exports['invalid retry value'] = {
  "key": "mockConfigKey",
  "value": "1",
  "type": "a positive number or null or an object with keys \"openMode\" and \"runMode\" with values of numbers or nulls"
}

exports['invalid retry object'] = {
  "key": "mockConfigKey",
  "value": {
    "fakeMode": 1
  },
  "type": "a positive number or null or an object with keys \"openMode\" and \"runMode\" with values of numbers or nulls"
}

exports['missing https protocol'] = {
  "key": "clientCertificates[0].url",
  "value": "http://url.com",
  "type": "an https protocol"
}

exports['invalid url'] = {
  "key": "clientCertificates[0].url",
  "value": "not *",
  "type": "a valid URL"
}

exports['not qualified url'] = {
  "key": "mockConfigKey",
  "value": "url.com",
  "type": "a fully qualified URL (starting with `http://` or `https://`)"
}

exports['empty string'] = {
  "key": "mockConfigKey",
  "value": "",
  "type": "a fully qualified URL (starting with `http://` or `https://`)"
}

exports['config/lib/validation .isValidClientCertificatesSet returns error message for certs not passed as an array array 1'] = {
  "key": "mockConfigKey",
  "value": "1",
  "type": "a positive number or null or an object with keys \"openMode\" and \"runMode\" with values of numbers or nulls"
}

exports['config/lib/validation .isValidClientCertificatesSet returns error message for certs object without url 1'] = {
  "key": "clientCertificates[0].url",
  "type": "a URL matcher"
}

exports['config/lib/validation .isValidBrowser passes valid browsers and forms error messages for invalid ones isValidBrowser 1'] = {
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
      "expect": {
        "key": "displayName",
        "value": {
          "name": "No display name",
          "family": "chromium"
        },
        "type": "a non-empty string"
      }
    },
    {
      "given": {
        "name": "bad family",
        "displayName": "Bad family browser",
        "family": "unknown family"
      },
      "expect": {
        "key": "family",
        "value": {
          "name": "bad family",
          "displayName": "Bad family browser",
          "family": "unknown family"
        },
        "type": "either chromium or firefox"
      }
    }
  ]
}

exports['config/lib/validation .isPlainObject returns error message when value is a not an object 1'] = {
  "key": "mockConfigKey",
  "value": 1,
  "type": "a plain object"
}

exports['config/lib/validation .isNumber returns error message when value is a not a number 1'] = {
  "key": "mockConfigKey",
  "value": "string",
  "type": "a number"
}

exports['config/lib/validation .isNumberOrFalse returns error message when value is a not number or false 1'] = {
  "key": "mockConfigKey",
  "value": null,
  "type": "a number or false"
}

exports['config/lib/validation .isBoolean returns error message when value is a not a string 1'] = {
  "key": "mockConfigKey",
  "value": 1,
  "type": "a string"
}

exports['config/lib/validation .isString returns error message when value is a not a string 1'] = {
  "key": "mockConfigKey",
  "value": 1,
  "type": "a string"
}

exports['config/lib/validation .isArray returns error message when value is a non-array 1'] = {
  "key": "mockConfigKey",
  "value": 1,
  "type": "an array"
}

exports['config/lib/validation .isStringOrFalse returns error message when value is neither string nor false 1'] = {
  "key": "mockConfigKey",
  "value": null,
  "type": "a string or false"
}
