e2e      = require("../helpers/e2e")
Fixtures = require("../helpers/fixtures")

e2ePath = Fixtures.projectPath("e2e")

describe "e2e browserify, babel, es2015", ->
  e2e.setup({npmInstall: true})

  it "passes", ->
    e2e.start(@, {
      spec: "browserify_babel_es2015_passing_spec.coffee"
      expectedExitCode: 0
    })

  it "fails", ->
    e2e.exec(@, {
      spec: "browserify_babel_es2015_failing_spec.js"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      stdout = stdout.split(e2ePath).join("/foo/bar/.projects/e2e")

      expect(stdout).to.include("""
        Oops...we found an error preparing this test file:

          /foo/bar/.projects/e2e/cypress/integration/browserify_babel_es2015_failing_spec.js

        The error was:

        SyntaxError: /foo/bar/.projects/e2e/lib/fail.js: Unexpected token, expected { (1:7) while parsing file: /foo/bar/.projects/e2e/lib/fail.js
        > 1 | export defalt "foo"
            |        ^


        This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

        * A missing file or dependency
        * A syntax error in the file or one of its dependencies

        Fix the error in your code and re-run your tests.
      """)
