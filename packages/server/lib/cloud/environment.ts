import { exec } from 'child_process'
import { promisify } from 'util'
import base64Url from 'base64url'
import fs from 'fs-extra'
import resolvePackagePath from 'resolve-package-path'

const execAsync = promisify(exec)

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
      const { stdout } = await execAsync(`ps eww -p ${processBranch.join(',')} -o pid=,command=`)

      const pidEnvUrlMapping = stdout.split('\n').reduce((acc, line) => {
        const cypressEnvUrl = line.trim().match(/(\d+)\s.*CYPRESS_API_URL=(\S+)\s/)

        if (cypressEnvUrl) {
          acc.set(cypressEnvUrl[1], cypressEnvUrl[2])
        }

        return acc
      }, new Map())

      const foundPid = processBranch.find((pid) => pidEnvUrlMapping.get(pid))

      if (foundPid) {
        envUrl = pidEnvUrlMapping.get(foundPid)
      }
    } catch (err) {
      error = err
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
  let dependencies = {}
  let errors: { dependency?: string, name: string, message: string, stack: string }[] = []
  let envDependenciesVar = process.env.CYPRESS_ENV_DEPENDENCIES
  let envUrl = process.env.CYPRESS_API_URL
  let checkProcessTree

  if (envDependenciesVar) {
    const envDependenciesInformation = JSON.parse(base64Url.decode(envDependenciesVar)) as DependencyInformation

    const packageToJsonMapping: Record<string, string> = {}

    envDependenciesInformation.maybeCheckProcessTreeIfPresent.forEach((dependency) => {
      try {
        const packageJsonPath = resolvePackagePath(dependency, projectRoot)

        if (packageJsonPath) {
          packageToJsonMapping[dependency] = packageJsonPath
          checkProcessTree = true
        }
      } catch (error) {
        errors.push({
          dependency,
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }
    })

    envDependenciesInformation.neverCheckProcessTreeIfPresent.forEach((dependency) => {
      try {
        const packageJsonPath = resolvePackagePath(dependency, projectRoot)

        if (packageJsonPath) {
          packageToJsonMapping[dependency] = packageJsonPath
          checkProcessTree = false
        }
      } catch (error) {
        errors.push({
          dependency,
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }
    })

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
