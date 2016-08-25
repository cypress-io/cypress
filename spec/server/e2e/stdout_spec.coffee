require("../spec_helper")

_        = require("lodash")
fs       = require("fs-extra")
cp       = require("child_process")
Promise  = require("bluebird")
Fixtures = require("../helpers/fixtures")
user     = require("#{root}lib/user")
cypress  = require("#{root}lib/cypress")
Project  = require("#{root}lib/project")

cp = Promise.promisifyAll(cp)
fs = Promise.promisifyAll(fs)

env = _.omit(process.env, "CYPRESS_DEBUG")

describe "e2e stdout", ->
  beforeEach ->
    Fixtures.scaffold()

    @e2ePath = Fixtures.projectPath("e2e")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(@e2ePath)

  afterEach ->
    Fixtures.remove()

  it "displays errors from failures", (done) ->
    @timeout(20000)

    exec = cp.exec "node index.js --run-project=#{@e2ePath} --spec=cypress/integration/failing_spec.coffee --port=2020", {env: env}, (err, stdout, stderr) ->
      stdout = stdout
      .replace(/\(\d{2,4}ms\)/g, "(123ms)")
      .replace(/coffee-\d{3}/g, "coffee-456")
      .replace(/(.+)\.projects\/e2e\/does-not-exist\.html/, "/foo/bar/.projects/e2e/does-not-exist.html")

      expect(stdout).to.include("""
Tests should begin momentarily...



  failing_spec
\r    ✓ passes
\r    1) fails
\r    ✓ doesnt fail
    hooks
\r      2) "before each" hook


  2 passing (123ms)
  2 failing

  1) failing_spec fails:
     Error: foo
      at Context.<anonymous> (http://localhost:2020/__cypress/tests?p=cypress/integration/failing_spec.coffee-456:6:15)

  2) failing_spec hooks "before each" hook:
     CypressError: cy.visit() failed trying to load:

does-not-exist.html

We failed looking for this file at the path:

/foo/bar/.projects/e2e/does-not-exist.html

The internal Cypress web server responded with:

  > 404: Not Found

""")

    exec.on "close", (code) ->
      expect(code).to.eq(2)
      done()

  it "does not duplicate suites or tests between visits", ->
    @timeout(60000)

    cp.execAsync("node index.js --run-project=#{@e2ePath} --spec=cypress/integration/passing_spec.coffee --port=2020", {env: env})
    .then (stdout) ->
      stdout = stdout
      .replace(/\(\d{2,4}ms\)/g, "(123ms)")
      .replace(/\(\d{1,2}s\)/g, "(10s)")

      expect(stdout).to.include("""
      Tests should begin momentarily...



        passing_spec
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
