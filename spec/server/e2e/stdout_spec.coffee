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

describe "mocha reporter's stdout", ->
  beforeEach ->
    Fixtures.scaffold()

    @visitsPath = Fixtures.projectPath("visits")

    user.set({name: "brian", session_token: "session-123"})
    .then =>
      Project.add(@visitsPath)

  afterEach ->
    Fixtures.remove()

  it "displays errors from failures", ->
    @timeout(20000)

    cp.execAsync("node index.js --run-project=#{@visitsPath} --spec=cypress/integration/failing_spec.coffee --port=2020", {env: env})
    .then (stdout) ->
      stdout = stdout.replace(/\(\d{2,4}ms\)/, "(123ms)")

      expect(stdout).to.include("""
        Tests should begin momentarily...



          failing_spec
\r    ✓ passes
\r    1) fails
\r    ✓ doesnt fail


          2 passing (123ms)
          1 failing

          1) failing_spec fails:
             Error: foo
              at Context.<anonymous> (http://localhost:2020/__cypress/tests?p=cypress/integration/failing_spec.coffee
      """)

  it "does not duplicate suites or tests between visits", ->
    @timeout(30000)

    cp.execAsync("node index.js --run-project=#{@visitsPath} --spec=cypress/integration/passing_spec.coffee --port=2020", {env: env})
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
