import systemTests from '../lib/system-tests'

// original source code https://github.com/lodash/lodash/issues/2459#issuecomment-230255219
const getAllMatches = (source, regex) => {
  const matches = []

  source.replace(regex, function () {
    matches.push({
      match: arguments[0],
      offset: arguments[arguments.length - 2],
      groups: Array.prototype.slice.call(arguments, 1, -2),
    })

    return arguments[0]
  })

  return matches
}

describe('component testing: justInTimeCompile', function () {
  systemTests.setup()

  systemTests.it('vite@5', {
    project: 'justInTimeCompile/vite',
    testingType: 'component',
    browser: 'electron',
    expectedExitCode: 0,
    onRun: async (exec) => {
      const { stderr } = await exec({
        processEnv: {
          // print debug logs from @cypress/vite-dev-server to see how many times specs are updated
          DEBUG: 'cypress:vite*',
        },
      })

      const serverPortRegex = /Successfully launched the vite server on port 5173/g
      const componentsCompiledSeparatelyRegex = /dev\-server\:secs\:changed\: src\/Component\-[1-3]\.cy\.jsx/g

      const totalServersSamePort = getAllMatches(stderr, serverPortRegex).length
      const totalComponentsCompiledSeparately = getAllMatches(stderr, componentsCompiledSeparatelyRegex).length

      // expect 1 server to be created
      expect(totalServersSamePort).to.equal(1)
      // expect each component compiled individually
      expect(totalComponentsCompiledSeparately).to.equal(3)
    },
  })

  systemTests.it('webpack@5', {
    project: 'justInTimeCompile/webpack',
    testingType: 'component',
    browser: 'electron',
    expectedExitCode: 0,
    onRun: async (exec) => {
      const { stderr } = await exec({
        processEnv: {
          // print debug logs from @cypress/webpack-dev-server to see how many times specs are updated
          DEBUG: 'cypress:webpack*',
        },
      })
      const serverPortRegex = /Component testing webpack server 5 started on port 8080/g
      const componentsCompiledSeparatelyRegex = /justInTimeCompile\/webpack\/src\/Component\-[1-3].cy.jsx/g

      const totalServersSamePort = getAllMatches(stderr, serverPortRegex).length
      const totalComponentsCompiledSeparately = getAllMatches(stderr, componentsCompiledSeparatelyRegex).length

      // expect 1 server to be created
      expect(totalServersSamePort).to.equal(1)
      // expect each component compiled individually (3 occurrences total, the first occurs twice due to file writes)
      // sometimes, the first output does not get logged. This is not of concern, hence the greaterThan assertion
      expect(totalComponentsCompiledSeparately).to.be.greaterThan(2)
    },
  })
})
