exports['missing https protocol'] = {
  'key': 'clientCertificates[0].url',
  'value': 'http://url.com',
  'type': 'an https protocol',
}

exports['invalid url'] = {
  'key': 'clientCertificates[0].url',
  'value': 'not *',
  'type': 'a valid URL',
}

exports['undefined browsers'] = `
Missing browsers list
`

exports['empty list of browsers'] = `
Expected at least one browser
`

exports['browsers list with a string'] = {
  'key': 'name',
  'value': 'foo',
  'type': 'a non-empty string',
  'list': 'browsers',
}

exports['invalid retry value'] = {
  'key': 'mockConfigKey',
  'value': '1',
  'type': 'a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls',
}

exports['invalid retry object'] = {
  'key': 'mockConfigKey',
  'value': {
    'fakeMode': 1,
  },
  'type': 'a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls',
}

exports['not qualified url'] = {
  'key': 'mockConfigKey',
  'value': 'url.com',
  'type': 'a fully qualified URL (starting with `http://` or `https://`)',
}

exports['empty string'] = {
  'key': 'mockConfigKey',
  'value': '',
  'type': 'a fully qualified URL (starting with `http://` or `https://`)',
}

exports['not string or array'] = {
  'key': 'mockConfigKey',
  'value': null,
  'type': 'a string or an array of strings',
}

exports['array of non-strings'] = {
  'key': 'mockConfigKey',
  'value': [
    1,
    2,
    3,
  ],
  'type': 'a string or an array of strings',
}

exports['not one of the strings error message'] = {
  'key': 'test',
  'value': 'nope',
  'type': 'one of these values: "foo", "bar"',
}

exports['number instead of string'] = {
  'key': 'test',
  'value': 42,
  'type': 'one of these values: "foo", "bar"',
}

exports['null instead of string'] = {
  'key': 'test',
  'value': null,
  'type': 'one of these values: "foo", "bar"',
}

exports['not one of the numbers error message'] = {
  'key': 'test',
  'value': 4,
  'type': 'one of these values: 1, 2, 3',
}

exports['string instead of a number'] = {
  'key': 'test',
  'value': 'foo',
  'type': 'one of these values: 1, 2, 3',
}

exports['null instead of a number'] = {
  'key': 'test',
  'value': null,
  'type': 'one of these values: 1, 2, 3',
}

exports['config/src/validation .isValidClientCertificatesSet returns error message for certs not passed as an array array 1'] = {
  'key': 'mockConfigKey',
  'value': '1',
  'type': 'a positive number or null or an object with keys "openMode" and "runMode" with values of numbers or nulls',
}

exports['config/src/validation .isValidClientCertificatesSet returns error message for certs object without url 1'] = {
  'key': 'clientCertificates[0].url',
  'type': 'a URL matcher',
}

exports['config/src/validation .isValidBrowser passes valid browsers and forms error messages for invalid ones isValidBrowser 1'] = {
  'name': 'isValidBrowser',
  'behavior': [
    {
      'given': {
        'name': 'Chrome',
        'displayName': 'Chrome Browser',
        'family': 'chromium',
        'path': '/path/to/chrome',
        'version': '1.2.3',
        'majorVersion': 1,
      },
      'expect': true,
    },
    {
      'given': {
        'name': 'FF',
        'displayName': 'Firefox',
        'family': 'firefox',
        'path': '/path/to/firefox',
        'version': '1.2.3',
        'majorVersion': '1',
      },
      'expect': true,
    },
    {
      'given': {
        'name': 'Electron',
        'displayName': 'Electron',
        'family': 'chromium',
        'path': '',
        'version': '99.101.3',
        'majorVersion': 99,
      },
      'expect': true,
    },
    {
      'given': {
        'name': 'No display name',
        'family': 'chromium',
      },
      'expect': {
        'key': 'displayName',
        'value': {
          'name': 'No display name',
          'family': 'chromium',
        },
        'type': 'a non-empty string',
      },
    },
    {
      'given': {
        'name': 'bad family',
        'displayName': 'Bad family browser',
        'family': 'unknown family',
      },
      'expect': {
        'key': 'family',
        'value': {
          'name': 'bad family',
          'displayName': 'Bad family browser',
          'family': 'unknown family',
        },
        'type': 'either chromium, firefox or webkit',
      },
    },
  ],
}

exports['config/src/validation .isPlainObject returns error message when value is a not an object 1'] = {
  'key': 'mockConfigKey',
  'value': 1,
  'type': 'a plain object',
}

exports['config/src/validation .isNumber returns error message when value is a not a number 1'] = {
  'key': 'mockConfigKey',
  'value': 'string',
  'type': 'a number',
}

exports['config/src/validation .isNumberOrFalse returns error message when value is a not number or false 1'] = {
  'key': 'mockConfigKey',
  'value': null,
  'type': 'a number or false',
}

exports['config/src/validation .isBoolean returns error message when value is a not a string 1'] = {
  'key': 'mockConfigKey',
  'value': 1,
  'type': 'a string',
}

exports['config/src/validation .isString returns error message when value is a not a string 1'] = {
  'key': 'mockConfigKey',
  'value': 1,
  'type': 'a string',
}

exports['config/src/validation .isArray returns error message when value is a non-array 1'] = {
  'key': 'mockConfigKey',
  'value': 1,
  'type': 'an array',
}

exports['config/src/validation .isStringOrFalse returns error message when value is neither string nor false 1'] = {
  'key': 'mockConfigKey',
  'value': null,
  'type': 'a string or false',
}

exports['not an array error message'] = {
  'key': 'fakeKey',
  'value': 'fakeValue',
  'type': 'an array including any of these values: [true, false]',
}

exports['not a subset of error message'] = {
  'key': 'fakeKey',
  'value': [
    null,
  ],
  'type': 'an array including any of these values: ["fakeValue", "fakeValue1", "fakeValue2"]',
}

exports['not all in subset error message'] = {
  'key': 'fakeKey',
  'value': [
    'fakeValue',
    'fakeValue1',
    'fakeValue2',
    'fakeValue3',
  ],
  'type': 'an array including any of these values: ["fakeValue", "fakeValue1", "fakeValue2"]',
}

exports['invalid lower bound'] = {
  'key': 'test',
  'value': -1,
  'type': 'a valid CRF number between 1 & 51, 0 or false to disable compression, or true to use the default compression of 32',
}

exports['invalid upper bound'] = {
  'key': 'test',
  'value': 52,
  'type': 'a valid CRF number between 1 & 51, 0 or false to disable compression, or true to use the default compression of 32',
}
