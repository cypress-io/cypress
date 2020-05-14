# just an example of transpilation w/ sourcemap -
# `test.coffee` is not directly transpiled/executed by any test code
# regenerate JS + sourcemap with `coffee -c -m test.coffee`

setTimeout ->
  window
  foo = "#{window.top.foo}"
, 1000
