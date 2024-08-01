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

describe('component testing: experimentalJustInTimeCompile', function () {
  systemTests.setup()

  systemTests.it('vite@5', {
    project: 'experimental-JIT/vite',
    testingType: 'component',
    expectedExitCode: 0,
    onRun: async (exec) => {
      const { stderr } = await exec({
        processEnv: {
          // print debug logs from @cypress/vite-dev-server to see how many times the server is created
          DEBUG: 'cypress:vite*',
        },
      })

      const serverCreationRegex = /Vite server created/g
      const serverPortRegex = /Successfully launched the vite server on port 8000/g
      const serverClosedRegex = /closed dev server/g

      const totalServers = getAllMatches(stderr, serverCreationRegex).length
      const totalServersSamePort8000 = getAllMatches(stderr, serverPortRegex).length
      const totalClosedServers = getAllMatches(stderr, serverClosedRegex).length

      // expect a total of 3 servers created (1 per spec)
      expect(totalServers).to.equal(3)
      // expect servers to be created on same port so baseUrl is consistent
      expect(totalServersSamePort8000).to.equal(3)
      //expect servers to be shut down when finished
      expect(totalClosedServers).to.equal(3)
    },
  })

  systemTests.it('webpack@5', {
    project: 'experimental-JIT/webpack',
    testingType: 'component',
    expectedExitCode: 0,
    onRun: async (exec) => {
      const { stderr } = await exec({
        processEnv: {
          // print debug logs from @cypress/webpack-dev-server to see how many times the server is created
          DEBUG: 'cypress:webpack*',
        },
      })

      const serverCreationRegex = /Component testing webpack server 5 started/g
      const serverPortRegex = /Component testing webpack server 5 started on port 8000/g
      const serverClosedRegex = /closed dev server/g

      const totalServers = getAllMatches(stderr, serverCreationRegex).length
      const totalServersSamePort8000 = getAllMatches(stderr, serverPortRegex).length
      const totalClosedServers = getAllMatches(stderr, serverClosedRegex).length

      // expect a total of 3 servers created (1 per spec)
      expect(totalServers).to.equal(3)
      // expect servers to be created on same port so baseUrl is consistent
      expect(totalServersSamePort8000).to.equal(3)
      //expect servers to be shut down when finished
      expect(totalClosedServers).to.equal(3)
    },
  })
})
