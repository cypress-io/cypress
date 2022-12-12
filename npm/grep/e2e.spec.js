const Fixtures = require('@tooling/system-tests')
const FixturesScaffold = require('@tooling/system-tests/lib/dep-installer')
const execa = require('execa')
const path = require('path')

const scaffoldGrepProject = async () => {
  const project = 'grep'

  Fixtures.removeProject(project)
  await Fixtures.scaffoldProject(project)
  await FixturesScaffold.scaffoldProjectNodeModules({ project })

  const projectPath = Fixtures.projectPath(project)

  return projectPath
}

const runCommandInProject = (command, projectPath) => {
  const [ex, ...args] = command.split(' ')

  return execa(ex, args, { cwd: projectPath, stdio: 'inherit' })
}

const runCypressExpectCommandThatHasArgsWithSpaces = (args, projectPath) => {
  args.unshift('cypress-expect')

  return execa('npx', args, { cwd: projectPath, stdio: 'inherit' })
}

describe('@cypress/grep', () => {
  let projectPath

  before(async () => {
    const grepPackagePath = path.join(__dirname)

    projectPath = await scaffoldGrepProject()
    await runCommandInProject(`yarn add @cypress/grep@file:${grepPackagePath}`, projectPath)
  })

  it('Run e2e tests 🧪', async () => {
    await runCommandInProject('npx cypress-expect --min-passing 5 --pending 0', projectPath)
  })

  it('Run e2e skip tests without grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --passing 1 --pending 2 --spec cypress/e2e/skip-spec.js --config specPattern="**/skip-spec.js"', projectPath)
  })

  // All tests are pending because the grep tag is only used in "it.skip" tests
  it('Run e2e skip tests with grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/skip-spec.js --config specPattern="**/skip-spec.js" --env grep=pending --expect expected/pending.json', projectPath)
  })

  it('Grep tests using Cypress module API 🧪', async () => {
    await runCommandInProject('node ./expected/test-npm-module.js', projectPath)
  })

  // Tests do not break the custom test config object as argument
  it('Run e2e tests with config object with grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/config-spec.js --config specPattern="**/config-spec.js" --env grep=@config --expect expected/config-spec.json', projectPath)
  })

  // There should be 1 test with "hello" substring and 3 other tests that will be pending
  it('Run tests with "hello" 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=hello --expect expected/hello.json', projectPath)
  })

  it('Run tests WITHOUT "hello" 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=-hello --expect expected/no-hello.json', projectPath)
  })

  it('Run tests without "hello" or "works 2" 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env=grep="-hello; -works 2"', '--expect-exactly', 'expected/no-hello-no-works2.json'], projectPath)
  })

  it('Run tests with "works" or "hello" but without "2" 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env', 'grep="works; hello; -2"', '--expect-exactly', 'expected/works-hello-no-2.json'], projectPath)
  })

  // check space character
  it('Run tests with "works 2" 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env', 'grep="works; hello; -2"', '--expect-exactly', 'expected/works-hello-no-2.json'], projectPath)
  })

  // trims the grep string
  it('Run tests with "works 2" 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env', 'grep="   works 2   "', '--expect', 'expected/works-2.json'], projectPath)
  })

  it('Run tests with "hello" or "works 2" 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env', 'grep="hello; works 2"', '--expect', 'expected/hello-or-works-2.json'], projectPath)
  })

  it('Run tests with "hello" or "works 2" with spec filtering 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env', 'grep="hello; works 2",grepFilterSpecs=true', '--expect', 'expected/hello-or-works-2.json'], projectPath)
  })

  it('Run tests with "@tag1" 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=@tag1 --expect expected/tag1.json', projectPath)
  })

  it('Run tests with number 1 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=1 --expect expected/number1.json', projectPath)
  })

  it('Run tests with "@tag2" 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=@tag2 --expect expected/tag2.json', projectPath)
  })

  it('Run tests with "does-not-exist-tag" 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=does-not-exist-tag --expect expected/all-pending.json', projectPath)
  })

  it('Run tests with "@tag1 AND @tag2" 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grepTags=@tag1+@tag2 --expect expected/tag1-and-tag2.json', projectPath)
  })

  it('Run tests without @tag1 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grepTags=-@tag1 --expect expected/invert-tag1.json', projectPath)
  })

  it('Run tests with @tag1 but without @tag2 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grepTags=@tag1+-@tag2 --expect expected/tag1-without-tag2.json', projectPath)
  })

  it('Run tests with title and tag 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grep=works,grepTags=@tag1 --expect expected/works-and-tag1.json', projectPath)
  })

  // You can pass test tags in the config object
  it('Run e2e tests with tags in the config 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/config-tags-spec.js --config specPattern="**/config-tags-spec.js" --env grepTags=config --expect expected/config-tags-spec.json', projectPath)
  })

  // Skip tests by using the describe tags
  it('Run e2e tests with tags on the describe invert 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/describe-tags-spec.js --config specPattern="**/describe-tags-spec.js" --env grepTags=-@smoke --expect expected/describe-tags-invert-spec.json', projectPath)
  })

  // Enable suite of tests using a tag
  it('Enable suite of tests with a tag 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/describe-tags-spec.js --config specPattern="**/describe-tags-spec.js" --env grepTags=@smoke --expect expected/describe-tags-spec.json', projectPath)
  })

  // Several specs with tags using OR condition
  it('Tags OR specs 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--config', 'specPattern="**/tags/*.spec.js"', '--env', 'grepTags="high smoke"', '--expect-exactly', 'expected/tags-or.json'], projectPath)
  })

  it('Tags AND specs 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/tags/*.spec.js" --env grepTags="high+smoke" --expect expected/tags-and.json', projectPath)
  })

  it('Tags OR specs with grepFilterSpecs=true 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--config', 'specPattern="**/tags/*.spec.js"', '--env', 'grepTags="high regression",grepFilterSpecs=true', '--expect', 'expected/tags-or-filter.json'], projectPath)
  })

  it('Specify is an alias to it 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--spec', 'cypress/e2e/specify-spec.js', '--config', 'specPattern="**/specify-spec.js"', '--env', 'grep="works 2"', '--expect', 'expected/specify.json'], projectPath)
  })

  // Instead of making filtered tests pending with it.skip, completely omit them
  it('Omit filtered tests 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--spec', 'cypress/e2e/spec.js', '--env', 'grep="works 2",grepOmitFiltered=true', '--expect', 'expected/omit-filtered.json'], projectPath)
  })

  it('Omit filtered tests by tag 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/spec.js --env grepTags="@tag1",grepOmitFiltered=true --expect-exactly expected/omit-filtered.json', projectPath)
  })

  it('Omit and skip combination 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/omit-and-skip-spec.js" --env grepTags="@us1",grepOmitFiltered=true --expect expected/omit-and-skip.json', projectPath)
  })

  it('Nested describes with grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grepTags=@smoke --expect expected/nested-describe-spec.json', projectPath)
  })

  it('Nested describes inheriting tags with grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grepTags="@smoke+@fast" --expect expected/nested-describe-inheriting-tags-spec.json', projectPath)
  })

  it('Nested describes inheriting grep name 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--spec', 'cypress/e2e/nested-describe-spec.js', '--config', 'specPattern="**/nested-describe-spec.js"', '--env', 'grep="bottom runs too"', '--expect', 'expected/nested-describe-inheriting-names-spec.json'], projectPath)
  })

  it('Nested describes without grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grepTags=@does-not-exist --pending 2', projectPath)
  })

  // repeat the selected test 3 times
  it('Burn grepped test 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--env', 'grep="hello w",burn=3', '--expect', 'expected/hello-burn.json'], projectPath)
  })

  // prevent multiple plugin registrations
  it('Multiple registrations test 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--spec', 'cypress/e2e/multiple-registrations.js', '--config', 'specPattern="**/multiple-registrations.js"', '--env', 'grep="hello world",burn=3', '--expect', 'expected/multiple-registrations.json'], projectPath)
  })

  it('cypress-each test 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--spec', 'cypress/e2e/each-spec.js', '--config', 'specPattern="**/each-spec.js"', '--env', 'grep="for 2"', '--expect', 'expected/each-spec.json'], projectPath)
  })

  it('burning without grep 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/burn-spec.js --config specPattern="**/burn-spec.js" --env burn=5 --expect expected/burn-spec.json', projectPath)
  })

  it('preserves the test context 🧪', async () => {
    await runCommandInProject('npx cypress-expect --spec cypress/e2e/this-spec.js --config specPattern="**/this-spec.js" --env burn=3 --expect expected/this-spec.json', projectPath)
  })

  it('filter the specs first 🧪', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--config', 'specPattern="**/*.js"', '--env', 'grep="outside any suites",grepFilterSpecs=true', '--expect', 'expected/grep-filter-specs.json'], projectPath)
  })

  it('filter the specs first by tag 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="cypress/e2e/**/*.js" --env grepTags=@smoke,grepFilterSpecs=true --expect expected/grep-filter-specs-tag.json', projectPath)
  })

  it('run untagged tests 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/spec.js" --env grepUntagged=true --expect expected/grep-untagged.json', projectPath)
  })

  it('run untagged tests in blocks 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/describe-tags-spec.js" --env grepUntagged=true --expect-exactly expected/describe-tags-spec-untagged.json', projectPath)
  })

  // TODO: Create a ts project to run this test
  it.skip('filter TypeScript spec 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/ts-spec.ts" --env grep=loads,grepOmitFiltered=true,grepFilterSpecs=true --expect-exactly expected/ts-spec.json', projectPath)
  })

  it('run before and beforeEach fn when the first test is filtered 🧪', async () => {
    await runCommandInProject('npx cypress-expect --env grepTags=@staging --spec cypress/e2e/before-spec.js --config specPattern="**/before-spec.js" --expect expected/before.json', projectPath)
  })

  it('inherits parent tags 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/inherits-tag-spec.js" --env grepTags="@sanity+@screen-b" --expect-exactly expected/inherits-tag-spec.json', projectPath)
  })

  it('explicit not tags prevent test from running', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--config', 'specPattern="**/explicit-spec.js"', '--env', 'grepTags="@tag1 --@tag2"', '--expect-exactly', 'expected/explicit-spec.json'], projectPath)
  })

  it('explicit not tags work with omitFiltered', async () => {
    await runCypressExpectCommandThatHasArgsWithSpaces(['cypress-expect', '--config', 'specPattern="**/explicit-spec.js"', '--env', 'grepTags="@tag1 --@tag2",grepOmitFiltered=true', '--expect-exactly', 'expected/explicit-omit-spec.json'], projectPath)
  })

  it('filter specs when using dynamic names 🧪', async () => {
    await runCommandInProject('npx cypress-expect --config specPattern="**/dynamic/*.spec.js" --env grepTags="@smoke",grepFilterSpecs=true --expect-exactly expected/dynamic-spec.json', projectPath)
  })
})
