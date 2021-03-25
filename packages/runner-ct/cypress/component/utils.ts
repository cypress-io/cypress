import State from '../../src/lib/state'

export const fakeConfig = { projectName: 'Project', env: {}, isTextTerminal: false } as Partial<Cypress.RuntimeConfigOptions>

export const makeState = (options = {}) => {
  return (new State({
    reporterWidth: 500,
    spec: null,
    specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
    ...options,
  }, fakeConfig))
}

export const getPort = (href: string) => {
  const [, port] = href.match(/localhost:(.+?)\//)

  return port
}
