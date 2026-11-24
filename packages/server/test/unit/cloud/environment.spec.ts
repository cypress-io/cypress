import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import getEnvInformationForProjectRoot, { parsePsEnvLine } from '../../../lib/cloud/environment'
import path from 'path'
import base64url from 'base64url'
import { exec } from 'child_process'

const resolvePackagePath = vi.hoisted(() => vi.fn())

vi.mock('resolve-package-path', () => ({ default: resolvePackagePath }))

const originalResolvePackagePath = (await vi.importActual<typeof import('resolve-package-path')>('resolve-package-path')).default

describe('parsePsEnvLine', () => {
  // Oracle with the semantics parsePsEnvLine must keep. It backtracks polynomially,
  // so only the short table inputs go through it.
  const parseWithRegex = (line: string) => {
    const match = line.trim().match(/(\d+)\s.*CYPRESS_API_URL=(\S+)\s/)

    return match ? { pid: match[1], envUrl: match[2] } : undefined
  }

  const ciEnv = Array.from({ length: 400 }, (_, i) => `CI_VAR_${i}=${'x'.repeat(30)}`).join(' ')

  const cases: { name: string, line: string, expected: ReturnType<typeof parsePsEnvLine> }[] = [
    { name: 'empty string', line: '', expected: undefined },
    { name: 'whitespace only', line: '   \t ', expected: undefined },
    { name: 'pid only', line: '1234', expected: undefined },
    { name: 'no CYPRESS_API_URL', line: '1234 node index.js PATH=/usr/bin HOME=/root', expected: undefined },
    {
      name: 'right-aligned pid with the variable among the env',
      line: '  4321 node index.js PATH=/usr/bin CYPRESS_API_URL=https://api.example.com HOME=/root',
      expected: { pid: '4321', envUrl: 'https://api.example.com' },
    },
    {
      name: 'tab separators',
      line: '77\tnode\tCYPRESS_API_URL=https://a.example.com\tHOME=/root',
      expected: { pid: '77', envUrl: 'https://a.example.com' },
    },
    {
      name: 'trailing carriage return from CRLF output',
      line: '12 node CYPRESS_API_URL=https://a.example.com HOME=/root\r',
      expected: { pid: '12', envUrl: 'https://a.example.com' },
    },
    {
      name: 'variable as the last token is not read',
      line: '12 node HOME=/root CYPRESS_API_URL=https://a.example.com',
      expected: undefined,
    },
    {
      name: 'variable as the last token falls back to an earlier occurrence',
      line: '12 node CYPRESS_API_URL=https://first.example.com HOME=/root CYPRESS_API_URL=https://last.example.com',
      expected: { pid: '12', envUrl: 'https://first.example.com' },
    },
    {
      name: 'last of several occurrences wins',
      line: '12 node CYPRESS_API_URL=https://first.example.com CYPRESS_API_URL=https://second.example.com HOME=/root',
      expected: { pid: '12', envUrl: 'https://second.example.com' },
    },
    {
      name: 'empty value falls back to an earlier occurrence',
      line: '12 node CYPRESS_API_URL=https://first.example.com CYPRESS_API_URL= HOME=/root',
      expected: { pid: '12', envUrl: 'https://first.example.com' },
    },
    {
      name: 'key repeated inside a value',
      line: '12 node CYPRESS_API_URL=aCYPRESS_API_URL=b HOME=/root',
      expected: { pid: '12', envUrl: 'b' },
    },
    {
      name: 'suffix match on a longer variable name',
      line: '12 node CHILD_CYPRESS_API_URL=https://child.example.com HOME=/root',
      expected: { pid: '12', envUrl: 'https://child.example.com' },
    },
    {
      name: 'key in the command arguments',
      line: '12 node --env CYPRESS_API_URL=https://arg.example.com index.js',
      expected: { pid: '12', envUrl: 'https://arg.example.com' },
    },
    {
      name: 'Windows path value',
      line: '12 node CYPRESS_API_URL=C:\\Users\\me\\api HOME=C:\\Users\\me',
      expected: { pid: '12', envUrl: 'C:\\Users\\me\\api' },
    },
    {
      name: 'key directly after the pid',
      line: '12 CYPRESS_API_URL=https://a.example.com x',
      expected: { pid: '12', envUrl: 'https://a.example.com' },
    },
    {
      name: 'realistic CI-sized env line',
      line: `9876 /usr/bin/node /app/node_modules/.bin/cypress run --record ${ciEnv} CYPRESS_API_URL=https://ci.example.com ${ciEnv}`,
      expected: { pid: '9876', envUrl: 'https://ci.example.com' },
    },
  ]

  it.each(cases)('$name', ({ line, expected }) => {
    expect(parsePsEnvLine(line)).toStrictEqual(expected)
    expect(parsePsEnvLine(line)).toStrictEqual(parseWithRegex(line))
  })

  it('matches the regex across multi-line ps output split the way the call site splits it', () => {
    const stdout = [
      '    1 /sbin/init HOME=/',
      '  200 bash CYPRESS_API_URL=https://grandparent.example.com TERM=xterm',
      '  201 node index.js CHILD_CYPRESS_API_URL=https://parent.example.com SHLVL=2',
      '  202 node child.js HOME=/root CYPRESS_API_URL=https://last-token.example.com',
      '',
    ].join('\n')

    const lines = stdout.split('\n')

    expect(lines.map(parsePsEnvLine)).toStrictEqual(lines.map(parseWithRegex))
    expect(lines.map(parsePsEnvLine)).toStrictEqual([
      undefined,
      { pid: '200', envUrl: 'https://grandparent.example.com' },
      { pid: '201', envUrl: 'https://parent.example.com' },
      undefined,
      undefined,
    ])
  })

  it('only reads the pid from the start of the line', () => {
    // `ps -o pid=,command=` starts every line with the pid, so digits later in the
    // line are never read as one. The oracle is unanchored and would read them,
    // which is why this case is not in the table.
    expect(parsePsEnvLine('node 12 CYPRESS_API_URL=https://a.example.com x')).toBeUndefined()
  })

  describe('50,000-character lines', () => {
    const LENGTH = 50_000

    const longLines = [
      {
        name: 'digits and keys without trailing whitespace',
        line: `${'0'.repeat(LENGTH / 2)} ${'CYPRESS_API_URL=Y'.repeat(Math.ceil(LENGTH / 2 / 17))}`,
        expected: undefined,
      },
      {
        name: 'repeated keys with no value terminator',
        line: `1 ${'CYPRESS_API_URL='.repeat(LENGTH / 16)}`,
        expected: undefined,
      },
      {
        name: 'many whitespace-separated digit runs',
        line: `1 ${'1 '.repeat(LENGTH / 2)}x`,
        expected: undefined,
      },
      {
        name: 'repeated keys with a terminated final value',
        line: `1 ${'CYPRESS_API_URL=Y'.repeat(Math.ceil(LENGTH / 17))} tail`,
        expected: { pid: '1', envUrl: 'Y' },
      },
      {
        name: 'long env with the key in the middle',
        line: `1 node ${'A=b '.repeat(LENGTH / 8)}CYPRESS_API_URL=https://a.example.com ${'A=b '.repeat(LENGTH / 8)}`,
        expected: { pid: '1', envUrl: 'https://a.example.com' },
      },
    ]

    it.each(longLines)('$name', ({ line, expected }) => {
      expect(line.length).toBeGreaterThanOrEqual(LENGTH)

      const start = performance.now()
      const result = parsePsEnvLine(line)
      const elapsed = performance.now() - start

      expect(result).toStrictEqual(expected)
      expect(elapsed).toBeLessThan(200)
    })
  })
})

describe('lib/cloud/environment', () => {
  beforeEach(() => {
    resolvePackagePath.mockImplementation(originalResolvePackagePath)
    vi.stubEnv('CYPRESS_API_URL', undefined)
    vi.stubEnv('CYPRESS_ENV_DEPENDENCIES', base64url.encode(JSON.stringify({
      maybeCheckProcessTreeIfPresent: ['foo'],
      neverCheckProcessTreeIfPresent: ['bar'],
    })))
  })

  let proc
  const spawnProcessTree = async ({
    grandParentUrl,
    parentUrl,
    url,
  }: {
    grandParentUrl?: string
    parentUrl?: string
    url?: string
  }) => {
    return new Promise((resolve) => {
      proc = exec(`node ${path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'test-project', 'index.js')}`, {
        cwd: path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'test-project'),
        env: {
          ...process.env,
          CYPRESS_API_URL: grandParentUrl,
          CHILD_CYPRESS_API_URL: parentUrl,
          GRANDCHILD_CYPRESS_API_URL: url,
        },
      })

      proc.stdout.on('data', (data) => {
        const match = data.toString().match(/grandchild (\d+)/)

        if (match) {
          resolve(match[1])
        }
      })
    })
  }

  afterEach(() => {
    if (proc) {
      proc.kill()
    }

    vi.unstubAllEnvs()
  })

  it('should be able to get the environment for: present CYPRESS_API_URL and all tracked dependencies', async () => {
    vi.stubEnv('CYPRESS_API_URL', 'https://example.com')

    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: 'https://example.com',
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
      errors: [],
    })
  })

  it('should be able to get the environment for: present CYPRESS_API_URL and a thrown error when tracking dependencies', async () => {
    vi.stubEnv('CYPRESS_API_URL', 'https://example.com')

    resolvePackagePath.mockImplementation((name: string, root: string) => {
      if (name === 'foo') {
        throw new Error('some error')
      }

      if (name === 'bar') {
        return originalResolvePackagePath(name, root)
      }

      return undefined
    })

    const { errors, ...information } = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: 'https://example.com',
      dependencies: { bar: { version: '2.0.0' } },
    })

    expect(errors).toHaveLength(1)
    expect(errors[0].dependency).toBe('foo')
    expect(errors[0].message).toBe('some error')
    expect(errors[0].name).toBe('Error')
    expect(errors[0].stack).toContain('Error: some error')
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and all tracked dependencies', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'all-tracked-dependencies'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: undefined,
      dependencies: { bar: { version: '2.0.0' }, foo: { version: '1.0.0' } },
      errors: [],
    })
  })

  it('should be able to get the environment for: absent CYPRESS_API_URL and partial dependencies not matching criteria', async () => {
    const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-not-matching'), process.pid.toString())

    expect(information).toStrictEqual({
      envUrl: undefined,
      dependencies: { bar: { version: '2.0.0' } },
      errors: [],
    })
  })

  describe('absent CYPRESS_API_URL and partial dependencies matching criteria', () => {
    it('should be able to get the environment for CYPRESS_API_URL defined in grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://grandparent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in parent process', async () => {
      const pid = await spawnProcessTree({
        parentUrl: 'https://parent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://parent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in current process', async () => {
      const pid = await spawnProcessTree({
        url: 'https://url.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://url.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should be able to get the environment for CYPRESS_API_URL defined in parent process overriding grandparent process', async () => {
      const pid = await spawnProcessTree({
        grandParentUrl: 'https://grandparent.com',
        parentUrl: 'https://parent.com',
      })

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: process.platform !== 'win32' ? 'https://parent.com' : undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })

    it('should return no envUrl when CYPRESS_API_URL is not defined in any parent process', async () => {
      const pid = await spawnProcessTree({})

      const information = await getEnvInformationForProjectRoot(path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching'), pid.toString())

      expect(information).toStrictEqual({
        envUrl: undefined,
        dependencies: { foo: { version: '1.0.0' } },
        errors: [],
      })
    })
  })
})
