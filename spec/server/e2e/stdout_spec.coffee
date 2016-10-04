e2e = require("../helpers/e2e")

describe "e2e stdout", ->
  e2e.setup()

  it "displays errors from failures", ->
    e2e.exec(@, {
      port: 2020
      spec: "stdout_failing_spec.coffee"
      expectedExitCode: 3
    })
    .get("stdout")
    .then (stdout) ->
      stdout = stdout
      .replace(/\(\d{1,4}ms\)/g, "(123ms)")
      .replace(/coffee-\d{3}/g, "coffee-456")
      .replace(/(.+)\.projects\/e2e\/does-not-exist\.html/, "/foo/bar/.projects/e2e/does-not-exist.html")

      expect(stdout).to.include("""
Tests should begin momentarily...



  stdout_failing_spec
\r    ✓ passes
\r    1) fails
\r    ✓ doesnt fail
    failing hook
\r      2) "before each" hook for "is failing"
    passing hook
\r      3) is failing


  2 passing (123ms)
  3 failing

  1) stdout_failing_spec fails:
     Error: foo
      at Context.<anonymous> (http://localhost:2020/__cypress/tests?p=cypress/integration/stdout_failing_spec.coffee-456:6:15)

  2) stdout_failing_spec failing hook "before each" hook for "is failing":
     CypressError: cy.visit() failed trying to load:

does-not-exist.html

We failed looking for this file at the path:

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found



Because this error occured during a 'before each' hook we are skipping the remaining tests in the current suite: 'failing hook'
""")
      expect(stdout).to.include("3) stdout_failing_spec passing hook is failing:")

  it "does not duplicate suites or tests between visits", ->
    e2e.exec(@, {
      spec: "stdout_passing_spec.coffee"
      timeout: 60000
      expectedExitCode: 0
    })
    .get("stdout")
    .then (stdout) ->
      stdout = stdout
      .replace(/\(\d{2,4}ms\)/g, "(123ms)")
      .replace(/\(\d{1,2}s\)/g, "(10s)")

      expect(stdout).to.include("""
      Tests should begin momentarily...



        stdout_passing_spec
          file
\r      ✓ visits file (123ms)
          google
\r      ✓ visits google (123ms)
\r      ✓ google2
          apple
\r      ✓ apple1
\r      ✓ visits apple (123ms)
          subdomains
\r      ✓ cypress1
\r      ✓ visits cypress (123ms)
\r      ✓ cypress3


        8 passing (10s)
      """)
