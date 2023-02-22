import { exec } from 'child_process'
import { promisify } from 'util'
import base64Url from 'base64url'
import fs from 'fs-extra'
import resolvePackagePath from 'resolve-package-path'

const execAsync = promisify(exec)

const getProcessBranchForPid = async (pid: string) => {
  const { stdout } = await execAsync('ps -eo pid=,ppid=')
  const processTree = stdout.split('\n').reduce((acc, line) => {
    const [pid, ppid] = line.trim().split(/\s+/)

    acc.set(pid, ppid)

    return acc
  }, new Map())

  const currentProcessBranch: string[] = []

  while (pid) {
    currentProcessBranch.push(pid)
    pid = processTree.get(pid)
  }

  return currentProcessBranch
}

const getCypressEnvUrlFromProcessBranch = async (pid: string) => {
  let error: { name: string, message: string, stack: string } | undefined
  let envUrl

  if (process.platform !== 'win32') {
    try {
      const processBranch = await getProcessBranchForPid(pid)
      const { stdout } = await execAsync(`ps eww -p ${processBranch.join(',')} -o pid=,command=`)

      const pidEnvUrlMapping = stdout.split('\n').reduce((acc, line) => {
        const cypressEnvUrl = line.trim().match(/(\d+)\s.*CYPRESS_ENV_URL=(\S+)\s/)

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

const getEnvInformationForProjectRoot = async (projectRoot: string, pid: string) => {
  let dependencies = {}
  let errors: { dependency?: string, name: string, message: string, stack: string }[] = []
  let envDependenciesVar = process.env.CYPRESS_ENV_DEPENDENCIES
  let envUrl = process.env.CYPRESS_ENV_URL

  if (envDependenciesVar) {
    let checkProcessTree = true
    const envDependenciesInformation = JSON.parse(base64Url.decode(envDependenciesVar)) as Record<string, { processTreeRequirement: 'presence required' | 'absence required' | 'irrelevant' }>

    await Promise.all(Object.entries(envDependenciesInformation).map(async ([dependency, { processTreeRequirement }]) => {
      try {
        const packageJsonPath = resolvePackagePath(dependency, projectRoot)

        if (packageJsonPath) {
          const packageVersion = (await fs.readJSON(packageJsonPath)).version

          dependencies[dependency] = {
            version: packageVersion,
          }
        }
      } catch (error) {
        errors.push({
          dependency,
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }
      if (processTreeRequirement === 'presence required' && !dependencies[dependency]) {
        checkProcessTree = false
      } else if (processTreeRequirement === 'absence required' && dependencies[dependency]) {
        checkProcessTree = false
      }
    }))

    if (!envUrl && checkProcessTree) {
      const { envUrl: processTreeEnvUrl, error } = await getCypressEnvUrlFromProcessBranch(pid)

      envUrl = processTreeEnvUrl
      if (error) {
        errors.push(error)
      }
    }
  }

  return {
    ...(envUrl ? { envUrl } : {}),
    ...(errors.length > 0 ? { errors } : {}),
    ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
  }
}

export default getEnvInformationForProjectRoot
