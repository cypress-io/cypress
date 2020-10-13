import semver from 'semver'
import chalk from 'chalk'

/**
 * Compare available version range with the provided version from package.json
 * @param packageName Package name used to display a helper message to user.
 */
export function validateSemverVersion(
  version: string,
  allowedVersionRange: string,
  packageName?: string,
) {
  const minAvailableVersion = semver.minVersion(version)?.raw

  const isValid = Boolean(
    minAvailableVersion &&
      semver.satisfies(minAvailableVersion, allowedVersionRange),
  )

  if (!isValid && packageName) {
    const packageNameSymbol = chalk.green(packageName)

    console.warn(
      `It seems like you are using ${packageNameSymbol} with version ${chalk.bold(
        version,
      )}, however we support only ${packageNameSymbol} projects with version ${chalk.bold(
        allowedVersionRange,
      )}. Trying to find another template...`,
    )
  }

  return isValid
}
