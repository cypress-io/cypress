Fixtures   = require("../helpers/fixtures")
e2e        = require("../helpers/e2e")

bustedSupportFile = Fixtures.projectPath("busted-support-file")

describe "e2e busted support file", ->
  e2e.setup()

  it "passes", ->
    e2e.exec(@, {
      project: bustedSupportFile
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      stdout = stdout.split(bustedSupportFile).join("/foo/bar/.projects/busted-support-file")

      expect(stdout).to.include("""
        Oops...we found an error preparing this test file:

          /foo/bar/.projects/busted-support-file/cypress/support/index.js

        The error was:

        Error: Cannot find module './does/not/exist' from '/foo/bar/.projects/busted-support-file/cypress/support'


        This occurred while Cypress was compiling and bundling your test code. This is usually caused by:

        * A missing file or dependency
        * A syntax error in the file or one of its dependencies

        Fix the error in your code and re-run your tests.

      """)

