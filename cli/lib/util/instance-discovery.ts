import { promises as fsp } from 'fs'
import os from 'os'
import path from 'path'

/**
 * Instance descriptor shape written by a running `cypress open` instance.
 * See `inspect-cli-docs/design.md` §4.1.
 */
export interface Instance {
  pid: number
  port: number
  token: string
  projectRoot: string | null
  projectHash: string | null
  cypressVersion: string
  startedAt: string
  /** Absolute path to the descriptor file this instance was read from. */
  descriptorPath: string
}

/**
 * Error codes used by `resolveInstance`.
 * - `NO_INSTANCE`: 0 running instances, or selector matched none.
 * - `AMBIGUOUS_INSTANCE`: multiple instances matched; `.instances` is attached.
 */
export type InstanceDiscoveryErrorCode = 'NO_INSTANCE' | 'AMBIGUOUS_INSTANCE'

/**
 * Typed error thrown by `resolveInstance`. Callers should branch on `.code`.
 * When `code === 'AMBIGUOUS_INSTANCE'`, `.instances` lists the matching
 * candidates so the caller can render a "use --instance <pid>" message.
 */
export class InstanceDiscoveryError extends Error {
  code: InstanceDiscoveryErrorCode
  instances?: Instance[]

  constructor (code: InstanceDiscoveryErrorCode, message: string, instances?: Instance[]) {
    super(message)
    this.name = 'InstanceDiscoveryError'
    this.code = code
    if (instances) {
      this.instances = instances
    }
  }
}

/**
 * Per-platform Cypress user data directory.
 * - darwin: ~/Library/Application Support/Cypress
 * - linux:  ~/.config/Cypress
 * - win32:  %APPDATA%/Cypress
 *
 * On win32 when APPDATA is not set (atypical), fall back to the home dir.
 */
const userDataDir = (): string => {
  const platform = process.platform

  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Cypress')
  }

  if (platform === 'win32') {
    const appData = process.env.APPDATA

    if (appData) {
      return path.join(appData, 'Cypress')
    }

    return path.join(os.homedir(), 'AppData', 'Roaming', 'Cypress')
  }

  // linux + any other POSIX-ish platform
  return path.join(os.homedir(), '.config', 'Cypress')
}

/**
 * Absolute path to the directory where running instance descriptors live.
 */
export const runningDir = (): string => {
  const env = process.env.CYPRESS_INTERNAL_ENV || 'production'

  return path.join(userDataDir(), 'cy', env, 'running')
}

const writeStderr = (msg: string): void => {
  process.stderr.write(msg)
}

const isLiveProcess = (pid: number): { alive: boolean, permissionDenied: boolean } => {
  try {
    process.kill(pid, 0)

    return { alive: true, permissionDenied: false }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code

    if (code === 'EPERM') {
      // Process exists but we can't signal it — still a live instance.
      return { alive: true, permissionDenied: true }
    }

    // ESRCH (no such process) and any other unexpected error is treated as dead.
    return { alive: false, permissionDenied: false }
  }
}

const parseDescriptor = async (filePath: string): Promise<Instance | null> => {
  let raw: string

  try {
    raw = await fsp.readFile(filePath, 'utf8')
  } catch (err) {
    writeStderr(`cypress: failed to read instance descriptor ${filePath}: ${(err as Error).message}\n`)

    return null
  }

  let data: any

  try {
    data = JSON.parse(raw)
  } catch (err) {
    writeStderr(`cypress: failed to parse instance descriptor ${filePath}: ${(err as Error).message}\n`)

    return null
  }

  // Required fields per design §4.1: pid, port, token.
  if (typeof data.pid !== 'number' || typeof data.port !== 'number' || typeof data.token !== 'string') {
    return null
  }

  return {
    pid: data.pid,
    port: data.port,
    token: data.token,
    projectRoot: typeof data.projectRoot === 'string' ? data.projectRoot : null,
    projectHash: typeof data.projectHash === 'string' ? data.projectHash : null,
    cypressVersion: typeof data.cypressVersion === 'string' ? data.cypressVersion : '',
    startedAt: typeof data.startedAt === 'string' ? data.startedAt : '',
    descriptorPath: filePath,
  }
}

/**
 * Read and validate all instance descriptors currently in `runningDir()`.
 *
 * - Missing dir → `[]`.
 * - Malformed / invalid descriptor files are skipped (malformed JSON also
 *   produces a stderr warning). Such files are left on disk because they
 *   may be from a different (future) Cypress version.
 * - Descriptors whose `pid` is no longer alive (`ESRCH`) are pruned from
 *   disk as a self-heal measure, matching the design doc.
 * - Descriptors whose `pid` exists but cannot be signalled (`EPERM`) are
 *   still returned — the process is alive, we just can't probe it.
 *
 * Returns surviving instances sorted by `startedAt` ascending.
 */
export const readInstances = async (): Promise<Instance[]> => {
  const dir = runningDir()

  let entries: string[]

  try {
    entries = await fsp.readdir(dir)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code

    if (code === 'ENOENT') {
      return []
    }

    throw err
  }

  const instances: Instance[] = []

  for (const entry of entries) {
    if (!entry.endsWith('.json')) {
      continue
    }

    const filePath = path.join(dir, entry)
    const descriptor = await parseDescriptor(filePath)

    if (!descriptor) {
      continue
    }

    const { alive } = isLiveProcess(descriptor.pid)

    if (!alive) {
      // Self-heal: prune stale descriptors whose pid is gone.
      try {
        await fsp.unlink(filePath)
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code

        // Ignore ENOENT (already deleted) — anything else warn but don't throw.
        if (code !== 'ENOENT') {
          writeStderr(`cypress: failed to prune stale instance descriptor ${filePath}: ${(err as Error).message}\n`)
        }
      }

      continue
    }

    instances.push(descriptor)
  }

  instances.sort((a, b) => {
    if (a.startedAt < b.startedAt) {
      return -1
    }

    if (a.startedAt > b.startedAt) {
      return 1
    }

    return 0
  })

  return instances
}

const isNumericPidSelector = (selector: string): boolean => /^\d+$/.test(selector)

/**
 * Resolve a single running instance from an optional selector.
 *
 * Selector semantics:
 *   - undefined: must be exactly one instance. Otherwise throws
 *     `NO_INSTANCE` or `AMBIGUOUS_INSTANCE`.
 *   - numeric (/^\d+$/): match by pid.
 *   - otherwise: match by projectRoot — exact → endsWith → substring.
 *     If multiple candidates remain at any tier → `AMBIGUOUS_INSTANCE`.
 */
export const resolveInstance = async (selector?: string): Promise<Instance> => {
  const instances = await readInstances()

  if (selector === undefined) {
    if (instances.length === 0) {
      throw new InstanceDiscoveryError('NO_INSTANCE', 'No running Cypress instances found.')
    }

    if (instances.length === 1) {
      return instances[0]
    }

    throw new InstanceDiscoveryError(
      'AMBIGUOUS_INSTANCE',
      `Multiple running Cypress instances found (${instances.length}). Use --instance <pid> to pick one.`,
      instances,
    )
  }

  if (isNumericPidSelector(selector)) {
    const pid = Number(selector)
    const match = instances.find((i) => i.pid === pid)

    if (!match) {
      throw new InstanceDiscoveryError('NO_INSTANCE', `No running Cypress instance with pid ${pid}.`)
    }

    return match
  }

  // String selector matched against projectRoot, most-specific tier first.
  const withProject = instances.filter((i) => i.projectRoot)

  const exact = withProject.filter((i) => i.projectRoot === selector)

  if (exact.length === 1) {
    return exact[0]
  }

  if (exact.length > 1) {
    throw new InstanceDiscoveryError(
      'AMBIGUOUS_INSTANCE',
      `Multiple running Cypress instances match projectRoot "${selector}". Use --instance <pid> to pick one.`,
      exact,
    )
  }

  const endsWith = withProject.filter((i) => i.projectRoot!.endsWith(selector))

  if (endsWith.length === 1) {
    return endsWith[0]
  }

  if (endsWith.length > 1) {
    throw new InstanceDiscoveryError(
      'AMBIGUOUS_INSTANCE',
      `Multiple running Cypress instances match projectRoot suffix "${selector}". Use --instance <pid> to pick one.`,
      endsWith,
    )
  }

  const substring = withProject.filter((i) => i.projectRoot!.includes(selector))

  if (substring.length === 1) {
    return substring[0]
  }

  if (substring.length > 1) {
    throw new InstanceDiscoveryError(
      'AMBIGUOUS_INSTANCE',
      `Multiple running Cypress instances match "${selector}". Use --instance <pid> to pick one.`,
      substring,
    )
  }

  throw new InstanceDiscoveryError('NO_INSTANCE', `No running Cypress instance matches "${selector}".`)
}
