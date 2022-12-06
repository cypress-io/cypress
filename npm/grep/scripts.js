const { exec, echo, exit } = require('shelljs')

function runCommand (command) {
  if (exec(command).code !== 0) {
    echo(`Error: ${command}`)
    exit(1)
  }
}

// Run e2e tests 🧪
runCommand('npx cypress-expect --min-passing 5 --pending 0')

// Run e2e skip tests without grep 🧪
runCommand('npx cypress-expect --passing 1 --pending 2 --spec cypress/e2e/skip-spec.js --config specPattern="**/skip-spec.js"')

// All tests are pending because the grep tag is only used in "it.skip" tests
// Run e2e skip tests with grep 🧪
runCommand('npx cypress-expect --spec cypress/e2e/skip-spec.js --config specPattern="**/skip-spec.js" --env grep=pending --expect expected/pending.json')

// Grep tests using Cypress module API 🧪
runCommand('node ./expected/test-npm-module.js')

// Tests do not break the custom test config object as argument
// Run e2e tests with config object with grep 🧪
runCommand('npx cypress-expect --spec cypress/e2e/config-spec.js --config specPattern="**/config-spec.js" --env grep=@config --expect expected/config-spec.json')

// There should be 1 test with "hello" substring and 3 other tests that will be pending
// Run tests with "hello" 🧪
runCommand('npx cypress-expect --env grep=hello --expect expected/hello.json')

// Run tests WITHOUT "hello" 🧪
runCommand('npx cypress-expect --env grep=-hello --expect expected/no-hello.json')

// Run tests without "hello" or "works 2" 🧪
runCommand('npx cypress-expect --env=grep="-hello; -works 2" --expect-exactly expected/no-hello-no-works2.json')

// Run tests with "works" or "hello" but without "2" 🧪
runCommand('npx cypress-expect --env grep="works; hello; -2" --expect-exactly expected/works-hello-no-2.json')

// check space character
// Run tests with "works 2" 🧪
runCommand('npx cypress-expect --env grep="works 2" --expect expected/works-2.json')

// trims the grep string
// Run tests with "works 2" 🧪
runCommand('npx cypress-expect --env grep="   works 2   " --expect expected/works-2.json')

// Run tests with "hello" or "works 2" 🧪
runCommand('npx cypress-expect --env grep="hello; works 2" --expect expected/hello-or-works-2.json')

// Run tests with "hello" or "works 2" with spec filtering 🧪
runCommand('npx cypress-expect --env grep="hello; works 2",grepFilterSpecs=true --expect expected/hello-or-works-2.json')

// Run tests with "@tag1" 🧪
runCommand('npx cypress-expect --env grep=@tag1 --expect expected/tag1.json')

// Run tests with number 1 🧪
runCommand('npx cypress-expect --env grep=1 --expect expected/number1.json')

// Run tests with "@tag2" 🧪
runCommand('npx cypress-expect --env grep=@tag2 --expect expected/tag2.json')

// Run tests with "does-not-exist-tag" 🧪
runCommand('npx cypress-expect --env grep=does-not-exist-tag --expect expected/all-pending.json')

// Run tests with "@tag1 AND @tag2" 🧪
runCommand('npx cypress-expect --env grepTags=@tag1+@tag2 --expect expected/tag1-and-tag2.json')

// Run tests without @tag1 🧪
runCommand('npx cypress-expect --env grepTags=-@tag1 --expect expected/invert-tag1.json')

// Run tests with @tag1 but without @tag2 🧪
runCommand('npx cypress-expect --env grepTags=@tag1+-@tag2 --expect expected/tag1-without-tag2.json')

// Run tests with title and tag 🧪
runCommand('npx cypress-expect --env grep=works,grepTags=@tag1 --expect expected/works-and-tag1.json')

// You can pass test tags in the config object
// Run e2e tests with tags in the config 🧪
runCommand('npx cypress-expect --spec cypress/e2e/config-tags-spec.js --config specPattern="**/config-tags-spec.js" --env grepTags=config --expect expected/config-tags-spec.json')

// Skip tests by using the describe tags
// Run e2e tests with tags on the describe invert 🧪
runCommand('npx cypress-expect --spec cypress/e2e/describe-tags-spec.js --config specPattern="**/describe-tags-spec.js" --env grepTags=-@smoke --expect expected/describe-tags-invert-spec.json')

// Enable suite of tests using a tag
// Enable suite of tests with a tag 🧪
runCommand('npx cypress-expect --spec cypress/e2e/describe-tags-spec.js --config specPattern="**/describe-tags-spec.js" --env grepTags=@smoke --expect expected/describe-tags-spec.json')

// Several specs with tags using OR condition
// Tags OR specs 🧪
runCommand('npx cypress-expect --config specPattern="**/tags/*.spec.js" --env grepTags="high smoke" --expect-exactly expected/tags-or.json')

// Tags AND specs 🧪
runCommand('npx cypress-expect --config specPattern="**/tags/*.spec.js" --env grepTags="high+smoke" --expect expected/tags-and.json')

// Tags OR specs with grepFilterSpecs=true 🧪
runCommand('npx cypress-expect --config specPattern="**/tags/*.spec.js" --env grepTags="high regression",grepFilterSpecs=true --expect expected/tags-or-filter.json')

// Specify is an alias to it 🧪
runCommand('npx cypress-expect --spec cypress/e2e/specify-spec.js --config specPattern="**/specify-spec.js" --env grep="works 2" --expect expected/specify.json')

// Instead of making filtered tests pending with it.skip, completely omit them
// Omit filtered tests 🧪
runCommand('npx cypress-expect --spec cypress/e2e/spec.js --env grep="works 2",grepOmitFiltered=true --expect expected/omit-filtered.json')

// Omit filtered tests by tag 🧪
runCommand('npx cypress-expect --spec cypress/e2e/spec.js --env grepTags="@tag1",grepOmitFiltered=true --expect-exactly expected/omit-filtered.json')

// Omit and skip combination 🧪
runCommand('npx cypress-expect --config specPattern="**/omit-and-skip-spec.js" --env grepTags="@us1",grepOmitFiltered=true --expect expected/omit-and-skip.json')

// Nested describes with grep 🧪
runCommand('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grepTags=@smoke --expect expected/nested-describe-spec.json')

// Nested describes inheriting tags with grep 🧪
runCommand('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grepTags="@smoke+@fast" --expect expected/nested-describe-inheriting-tags-spec.json')

// Nested describes inheriting grep name 🧪
runCommand('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grep="bottom runs too" --expect expected/nested-describe-inheriting-names-spec.json')

// Nested describes without grep 🧪
runCommand('npx cypress-expect --spec cypress/e2e/nested-describe-spec.js --config specPattern="**/nested-describe-spec.js" --env grepTags=@does-not-exist --pending 2')

// repeat the selected test 3 times
// Burn grepped test 🧪
runCommand('npx cypress-expect --env grep="hello w",burn=3 --expect expected/hello-burn.json')

// prevent multiple plugin registrations
// Multiple registrations test 🧪
runCommand('npx cypress-expect --spec cypress/e2e/multiple-registrations.js --config specPattern="**/multiple-registrations.js" --env grep="hello world",burn=3 --expect expected/multiple-registrations.json')

// cypress-each test 🧪
runCommand('npx cypress-expect --spec cypress/e2e/each-spec.js --config specPattern="**/each-spec.js" --env grep="for 2" --expect expected/each-spec.json')

// burning without grep 🧪
runCommand('npx cypress-expect --spec cypress/e2e/burn-spec.js --config specPattern="**/burn-spec.js" --env burn=5 --expect expected/burn-spec.json')

// preserves the test context 🧪
runCommand('npx cypress-expect --spec cypress/e2e/this-spec.js --config specPattern="**/this-spec.js" --env burn=3 --expect expected/this-spec.json')

// filter the specs first 🧪
runCommand('npx cypress-expect --config specPattern="**/*.js" --env grep="outside any suites",grepFilterSpecs=true --expect expected/grep-filter-specs.json')

// filter the specs first by tag 🧪
runCommand('npx cypress-expect --config specPattern="cypress/e2e/**/*.js" --env grepTags=@smoke,grepFilterSpecs=true --expect expected/grep-filter-specs-tag.json')

// run untagged tests 🧪
runCommand('npx cypress-expect --config specPattern="**/spec.js" --env grepUntagged=true --expect expected/grep-untagged.json')

// run untagged tests in blocks 🧪
runCommand('npx cypress-expect --config specPattern="**/describe-tags-spec.js" --env grepUntagged=true --expect-exactly expected/describe-tags-spec-untagged.json')

// filter TypeScript spec 🧪
runCommand('npx cypress-expect --config specPattern="**/ts-spec.ts" --env grep=loads,grepOmitFiltered=true,grepFilterSpecs=true --expect-exactly expected/ts-spec.json')

// run before and beforeEach fn when the first test is filtered 🧪
runCommand('npx cypress-expect --env grepTags=@staging --spec cypress/e2e/before-spec.js --config specPattern="**/before-spec.js" --expect expected/before.json')

// inherits parent tags 🧪
runCommand('npx cypress-expect --config specPattern="**/inherits-tag-spec.js" --env grepTags="@sanity+@screen-b" --expect-exactly expected/inherits-tag-spec.json')

// explicit not tags prevent test from running
runCommand('npx cypress-expect --config specPattern="**/explicit-spec.js" --env grepTags="@tag1 --@tag2" --expect-exactly expected/explicit-spec.json')

// explicit not tags work with omitFiltered
runCommand('npx cypress-expect --config specPattern="**/explicit-spec.js" --env grepTags="@tag1 --@tag2",grepOmitFiltered=true --expect-exactly expected/explicit-omit-spec.json')

// filter specs when using dynamic names 🧪
runCommand('npx cypress-expect --config specPattern="**/dynamic/*.spec.js" --env grepTags="@smoke",grepFilterSpecs=true --expect-exactly expected/dynamic-spec.json')
