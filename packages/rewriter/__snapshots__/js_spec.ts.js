exports['lib/js .rewriteJs source maps generates as expected 1'] = {
  "version": 3,
  "sources": [
    "foo.js (original)"
  ],
  "names": [],
  "mappings": "0DAAA,CAAC,CAAC,CAAC,CAAC,CAAC",
  "file": "foo.js (original).map",
  "sourceRoot": "http://example.com/",
  "sourcesContent": [
    "window.top"
  ]
}

exports['lib/js .rewriteJs source maps composes with existing inline sourcemap 1'] = {
  "version": 3,
  "sources": [
    "test.coffee"
  ],
  "names": [],
  "mappings": ";AAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA;EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA,CAAA,EAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA;;;EAIA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAW,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA,EAAA;IACT,CAAA,CAAA,CAAA,CAAA,CAAA,CAAA;IAAA,CAAA,CAAA,EAAA,CAAA,CAAA,CAAA;WACA,CAAA,CAAA,EAAA,EAAM,CAAA,CAAA,2DAAG,CAAA,CAAA,CAAA,CAAA,CAAA,SAAU,CAAC,CAAA,CAAA,CAAd,CAAA;EAFG,CAAX,EAGE,CAAA,CAAA,CAAA,CAHF,CAAA",
  "file": "test.js (original).map",
  "sourceRoot": ".",
  "sourcesContent": [
    "# just an example of transpilation w/ sourcemap -\n# `test.coffee` is not directly transpiled/executed by any test code\n# regenerate JS + sourcemap with `coffee -c -m test.coffee`\n\nsetTimeout ->\n  window\n  foo = \"#{window.top.foo}\"\n, 1000\n"
  ]
}
