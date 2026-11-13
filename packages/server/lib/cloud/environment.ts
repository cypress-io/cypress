import { exec } from 'child_process'
import { promisify } from 'util'
import base64Url from 'base64url'
import fs from 'fs-extra'
import resolvePackagePath from 'resolve-package-path'

const execAsync = promisify(exec)

const PROCESS_BRANCH_ENV_MAX_BUFFER = 32 * 1024 * 1024

// See https://whimsical.com/encryption-logic-BtJJkN7TxacK8kaHDgH1zM for more information on what this is doing
const getProcessBranchForPid = async (pid: string) => {
  const { stdout } = await execAsync('ps -eo pid=,ppid=')
  const processTree = stdout.split('\n').reduce((acc, line) => {
    const [pid, ppid] = line.trim().split(/\s+/)

    acc.set(pid, ppid)

    return acc
  }, new Map())

  const currentProcessBranch: string[] = []

  while (pid && pid !== '0') {
    currentProcessBranch.push(pid)
    pid = processTree.get(pid)
  }

  return currentProcessBranch
}

const CYPRESS_API_URL_KEY = 'CYPRESS_API_URL='
const LEADING_PID = /^(\d+)\s/
const WHITESPACE = /\s/

// Reads the pid and CYPRESS_API_URL value from one line of `ps eww -o pid=,command=`.
// CI environments make these lines tens of KB, so every scan here is linear in the
// line length. When the key appears more than once, the last occurrence wins, and
// the value must be followed by whitespace, so a value that is the final token on
// the line is not read.
export const parsePsEnvLine = (line: string): { pid: string, envUrl: string } | undefined => {
  const trimmed = line.trim()
  const pidMatch = LEADING_PID.exec(trimmed)

  if (!pidMatch) {
    return undefined
  }

  const searchStart = pidMatch[0].length

  let lastWhitespace = trimmed.length - 1

  while (lastWhitespace >= searchStart && !WHITESPACE.test(trimmed[lastWhitespace])) {
    lastWhitespace--
  }

  // The value needs at least one character before that trailing whitespace
  let keyIndex = trimmed.lastIndexOf(CYPRESS_API_URL_KEY, lastWhitespace - CYPRESS_API_URL_KEY.length - 1)

  while (keyIndex >= searchStart) {
    const valueStart = keyIndex + CYPRESS_API_URL_KEY.length

    if (!WHITESPACE.test(trimmed[valueStart])) {
      let valueEnd = valueStart + 1

      // Always terminates, because lastWhitespace lies after valueStart
      while (!WHITESPACE.test(trimmed[valueEnd])) {
        valueEnd++
      }

      return { pid: pidMatch[1], envUrl: trimmed.slice(valueStart, valueEnd) }
    }

    keyIndex = trimmed.lastIndexOf(CYPRESS_API_URL_KEY, keyIndex - 1)
  }

  return undefined
}

interface GetCypressEnvUrlFromProcessBranch {
  envUrl?: string
  error?: {
    dependency?: string
    name: string
    message: string
    stack: string
  }
}

// See https://whimsical.com/encryption-logic-BtJJkN7TxacK8kaHDgH1zM for more information on what this is doing
const getCypressEnvUrlFromProcessBranch = async (pid: string): Promise<GetCypressEnvUrlFromProcessBranch> => {
  let error: { name: string, message: string, stack: string } | undefined
  let envUrl: string | undefined

  if (process.platform !== 'win32') {
    try {
      const processBranch = await getProcessBranchForPid(pid)
      // `ps eww` prints the full environment of every ancestor, which can
      // outgrow exec's default buffer in CI environments with many variables
      const { stdout } = await execAsync(`ps eww -p ${processBranch.join(',')} -o pid=,command=`, { maxBuffer: PROCESS_BRANCH_ENV_MAX_BUFFER })

      const pidEnvUrlMapping = stdout.split('\n').reduce((acc, line) => {
        const parsed = parsePsEnvLine(line)

        if (parsed) {
          acc.set(parsed.pid, parsed.envUrl)
        }

        return acc
      }, new Map())

      const foundPid = processBranch.find((pid) => pidEnvUrlMapping.get(pid))

      if (foundPid) {
        envUrl = pidEnvUrlMapping.get(foundPid)
      }
    } catch (err) {
      error = err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack ?? '' }
        : { name: 'Error', message: 'Reading the process tree failed with a non-Error value', stack: '' }
    }
  }

  return {
    envUrl,
    error,
  }
}

interface DependencyInformation {
  maybeCheckProcessTreeIfPresent: string[]
  neverCheckProcessTreeIfPresent: string[]
}

// See https://whimsical.com/encryption-logic-BtJJkN7TxacK8kaHDgH1zM for more information on what this is doing
const getEnvInformationForProjectRoot = async (projectRoot: string, pid: string) => {
  const dependencies = {}
  const errors: { dependency?: string, name: string, message: string, stack: string }[] = []
  const envDependencies = process.env.CYPRESS_ENV_DEPENDENCIES
  let envUrl = process.env.CYPRESS_API_URL
  let checkProcessTree

  if (envDependencies) {
    const envDependenciesInformation = JSON.parse(base64Url.decode(envDependencies)) as DependencyInformation

    const packageToJsonMapping: Record<string, string> = {}

    const processDependency = ({ checkOnFound }) => {
      return (dependency) => {
        try {
          const packageJsonPath = resolvePackagePath(dependency, projectRoot)

          if (packageJsonPath) {
            packageToJsonMapping[dependency] = packageJsonPath
            checkProcessTree = checkOnFound
          }
        } catch (error) {
          errors.push({
            dependency,
            name: error.name,
            message: error.message,
            stack: error.stack,
          })
        }
      }
    }

    envDependenciesInformation.maybeCheckProcessTreeIfPresent.forEach(processDependency({ checkOnFound: true }))
    envDependenciesInformation.neverCheckProcessTreeIfPresent.forEach(processDependency({ checkOnFound: false }))

    const [{ envUrl: processTreeEnvUrl, error: processTreeError }] = await Promise.all([
      checkProcessTree ? getCypressEnvUrlFromProcessBranch(pid) : { envUrl: undefined, error: undefined },
      ...Object.entries(packageToJsonMapping).map(async ([dependency, packageJsonPath]) => {
        try {
          const packageVersion = (await fs.readJSON(packageJsonPath)).version

          dependencies[dependency] = {
            version: packageVersion,
          }
        } catch (error) {
          errors.push({
            dependency,
            name: error.name,
            message: error.message,
            stack: error.stack,
          })
        }
      }),
    ])

    if (processTreeEnvUrl || processTreeError) {
      envUrl = processTreeEnvUrl
      if (processTreeError) {
        errors.push(processTreeError)
      }
    }
  }

  return {
    envUrl,
    errors,
    dependencies,
  }
}

export default getEnvInformationForProjectRoot
