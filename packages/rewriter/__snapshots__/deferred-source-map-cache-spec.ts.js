exports['DeferredSourceMapCache #resolve sourcemap generation for JS with no original sourcemap 1'] = {
  "version": 3,
  "sources": [
    "bar (original)"
  ],
  "names": [],
  "mappings": "AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC",
  "file": "bar (original).map",
  "sourceRoot": ".",
  "sourcesContent": [
    "console.log()"
  ]
}

exports['composed sourcemap'] = {
  "version": 3,
  "sources": [
    "test.coffee"
  ],
  "names": [],
  "mappings": ";AAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA;EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA;;;EAIA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAW,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA;IACT,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA;IAAA,CAAA,CAAA,EAAA,CAAA,CAAA,CAAA;WACA,CAAA,CAAA,EAAA,EAAM,CAAA,CAAA,2DAAG,CAAA,CAAA,CAAA,CAAA,CAAA,SAAU,CAAC,CAAA,CAAA,CAAd,CAAA;EAFG,CAAX,EAGE,CAAA,CAAA,CAAA,CAHF,CAAA",
  "file": "foo.js (original).map",
  "sourceRoot": "http://somedomain.net/dir",
  "sourcesContent": [
    "# just an example of transpilation w/ sourcemap -\n# `test.coffee` is not directly transpiled/executed by any test code\n# regenerate JS + sourcemap with `coffee -c -m test.coffee`\n\nsetTimeout ->\n  window\n  foo = \"#{window.top.foo}\"\n, 1000\n"
  ]
}
