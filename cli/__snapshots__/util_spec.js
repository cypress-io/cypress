exports['util normalizeModuleOptions passes string env unchanged 1'] = {
  "env": "foo=bar"
}

exports['util normalizeModuleOptions does not change other properties 1'] = {
  "foo": "bar"
}

exports['util normalizeModuleOptions converts environment object 1'] = {
  "env": "foo=bar,magicNumber=1234,host=kevin.dev.local"
}

exports['util normalizeModuleOptions converts config object 1'] = {
  "config": "baseUrl=http://localhost:2000,watchForFileChanges=false"
}
