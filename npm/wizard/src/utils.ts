import semver from 'semver'
import chalk from 'chalk'
import ora from 'ora'
import util from 'util'
import { exec } from 'child_process'

/**
 * Compare available version range with the provided version from package.json
 * @param packageName Package name used to display a helper message to user.
 */
export function validateSemverVersion (
  version: string,
  allowedVersionRange: string,
  packageName?: string,
) {
  let isValid: boolean

  try {
    const minAvailableVersion = semver.minVersion(version)?.raw

    isValid = Boolean(
      minAvailableVersion &&
        semver.satisfies(minAvailableVersion, allowedVersionRange),
    )
  } catch (e) {
    // handle not semver versions like "latest", "git:" or "file:"
    isValid = false
  }

  if (!isValid && packageName) {
    const packageNameSymbol = chalk.green(packageName)

    console.warn(
      `It seems like you are using ${packageNameSymbol} with version ${chalk.bold(
        version,
      )}, however we support only ${packageNameSymbol} projects with version ${chalk.bold(
        allowedVersionRange,
      )}. \n`,
    )
  }

  return isValid
}

const execAsync = util.promisify(exec)

export async function installDependency (name: string, options: { useYarn: boolean}) {
  let cliSpinner = ora(`Installing ${name}`).start()
  const commandToRun = options.useYarn ? 'yarn add cypress --dev' : 'npm install -D cypress'

  try {
    await execAsync(commandToRun)
  } catch (e) {
    cliSpinner.fail(`Can not install cypress using ${chalk.inverse(commandToRun)}`)
    console.log(e)

    process.exit(1)
  }

  cliSpinner.succeed()
}
