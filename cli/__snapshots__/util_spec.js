exports['env_as_string 1'] = {
  "env": "foo=bar"
}

exports['env_as_object 1'] = {
  "env": "foo=bar,magicNumber=1234,host=kevin.dev.local"
}

exports['config_as_object 1'] = {
  "config": "baseUrl=http://localhost:2000,watchForFileChanges=false"
}

exports['reporter_options_as_object 1'] = {
  "reporterOptions": "mochaFile=results/my-test-output.xml,toConsole=true"
}

exports['others_unchanged 1'] = {
  "foo": "bar"
}

exports['spec_as_array 1'] = {
  "spec": "a,b,c"
}

exports['spec_as_string 1'] = {
  "spec": "x,y,z"
}
