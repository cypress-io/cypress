import { vi, beforeEach, describe, it, expect } from 'vitest'

const cypressModule = vi.hoisted(() => {
  return {
    loaded: false,
    open: vi.fn(),
    run: vi.fn(),
    parseRunArguments: vi.fn(),
  }
})

vi.mock('../../lib/cypress', () => {
  cypressModule.loaded = true

  return {
    open: cypressModule.open,
    run: cypressModule.run,
    cli: { parseRunArguments: cypressModule.parseRunArguments },
  }
})

describe('module-api', function () {
  beforeEach(function () {
    vi.resetModules()
    vi.clearAllMocks()
    cypressModule.loaded = false
  })

  it('does not load the rest of the CLI until a command is called', async () => {
    const moduleApi = await import('../../lib/module-api')

    expect(moduleApi.defineConfig({ e2e: {} })).toEqual({ e2e: {} })
    expect(moduleApi.defineComponentFramework({ type: 'foo' })).toEqual({ type: 'foo' })
    expect(cypressModule.loaded).toBe(false)
  })

  it('.open delegates to cypress.open', async () => {
    cypressModule.open.mockResolvedValue('opened')
    const moduleApi = await import('../../lib/module-api')

    await expect(moduleApi.open({ project: 'foo' })).resolves.toBe('opened')
    expect(cypressModule.open).toHaveBeenCalledWith({ project: 'foo' })
  })

  it('.run delegates to cypress.run', async () => {
    cypressModule.run.mockResolvedValue({ status: 'finished' })
    const moduleApi = await import('../../lib/module-api')

    await expect(moduleApi.run({ spec: 'foo' })).resolves.toEqual({ status: 'finished' })
    expect(cypressModule.run).toHaveBeenCalledWith({ spec: 'foo' })
  })

  it('.run uses the options as they were when it was called', async () => {
    const moduleApi = await import('../../lib/module-api')
    const options = { spec: 'a.cy.js', config: { baseUrl: 'http://one' } }

    const run = moduleApi.run(options)

    options.spec = 'b.cy.js'
    options.config.baseUrl = 'http://two'
    await run

    expect(cypressModule.run).toHaveBeenCalledWith({ spec: 'a.cy.js', config: '{"baseUrl":"http://one"}' })
  })

  it('.cli.parseRunArguments uses the arguments as they were when it was called', async () => {
    const moduleApi = await import('../../lib/module-api')
    const args = ['cypress', 'run', '--browser', 'chrome']

    const parsed = moduleApi.cli.parseRunArguments(args)

    args.push('--headed')
    await parsed

    expect(cypressModule.parseRunArguments).toHaveBeenCalledWith(['cypress', 'run', '--browser', 'chrome'])
  })

  it('.run rejects when cypress.run throws', async () => {
    cypressModule.run.mockRejectedValue(new Error('Invalid project path parameter: '))
    const moduleApi = await import('../../lib/module-api')

    await expect(moduleApi.run({ project: '' })).rejects.toThrow('Invalid project path parameter')
  })

  it('.cli.parseRunArguments delegates to cypress.cli.parseRunArguments', async () => {
    cypressModule.parseRunArguments.mockResolvedValue({ browser: 'chrome' })
    const moduleApi = await import('../../lib/module-api')
    const args = ['cypress', 'run', '--browser', 'chrome']

    await expect(moduleApi.cli.parseRunArguments(args)).resolves.toEqual({ browser: 'chrome' })
    expect(cypressModule.parseRunArguments).toHaveBeenCalledWith(args)
  })
})
