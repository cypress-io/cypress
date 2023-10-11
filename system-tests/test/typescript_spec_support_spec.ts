import systemTests from '../lib/system-tests'

describe('e2e typescript in spec and support file', function () {
  systemTests.setup()

  it('spec passes', function () {
    return systemTests.exec(this, {
      project: 'coffee-react-interop',
      spec: 'typescript_passing.cy.ts',
      snapshot: true,
    })
  })

  it('spec fails with syntax error', function () {
    return systemTests.exec(this, {
      spec: 'typescript_syntax_error.cy.ts',
      snapshot: true,
      expectedExitCode: 1,
      onStdout: (stdout) => {
        stdout = stdout.replace(new RegExp('^(.*)npm/(webpack-batteries-included-preprocessor/node_modules/ts-loader/index.js)$', 'm'), ' * relative/path/to/$2')

        return systemTests.normalizeWebpackErrors(stdout)
      },
    })
  })

  it('project passes', function () {
    return systemTests.exec(this, {
      project: 'ts-proj',
      snapshot: true,
    })
  })

  it('project with custom supportFile passes', function () {
    return systemTests.exec(this, {
      project: 'ts-proj-custom-names',
      snapshot: true,
      expectedExitCode: 0,
    })
  })

  // this covers spec/support files as well as the plugins file
  // @see https://github.com/cypress-io/cypress/issues/7006
  // @see https://github.com/cypress-io/cypress/issues/8555
  it('respects tsconfig paths', function () {
    return systemTests.exec(this, {
      project: 'ts-proj-with-paths',
    })
  })
})
