import glob from 'glob'
import childProcess from 'child_process'
import util from 'util'
import path from 'path'
import chalk from 'chalk'
import { monorepoPaths } from '../monorepoPaths'

const execAsync = util.promisify(childProcess.exec)

process.on('unhandledRejection', (reason) => {
  console.error(reason)
  process.exit(1)
})

export function getTsPackages (packagesPath: string = ''): Promise<Set<string>> {
  const dfd = {} as Record<string, any>

  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })

  glob(
    path.join(monorepoPaths.root, packagesPath, '/packages/*/package.json'),
    (err, packageJsons) => {
      if (err) {
        return dfd.reject(err)
      }

      type PackageJsonStructure = {
        name: string
        dependencies: Record<string, string>
        devDependencies: Record<string, string>
        scripts: Record<string, string>
      }
      const required = packageJsons.map((path) => {
        return require(path)
      }) as PackageJsonStructure[]

      const packages = new Set<string>()

      required.forEach((r) => {
        // Select only packages that have build-ts
        if (r.scripts && r.scripts['build-ts']) {
          packages.add(r.name)
        }
      })

      dfd.resolve(packages)
    },
  )

  return dfd.promise
}

export async function buildPackageTsc ({
  packagesPath = '',
  tsPackages = new Set(),
  onlyPackages,
}: {
  packagesPath?: string
  tsPackages?: Set<string>
  onlyPackages?: string[]
}) {
  console.log(
    chalk.blue(`TSC: Building deps for ${onlyPackages || 'All Packages'}`),
  )

  const errors = []

  let built = 0

  const packages = onlyPackages || [...Array.from(tsPackages)]

  for (const pkg of packages) {
    try {
      await execAsync('tsc', {
        cwd: path.join(
          __dirname,
          '../../',
          packagesPath,
          `/packages/${pkg.replace(/\@(packages|cypress|frontend)\//, '')}`,
        ),
      })

      built++
      console.log(
        `${chalk.green(`Built`)} ${pkg} ${chalk.magenta(
          `${built} / ${packages.length}`,
        )}`,
      )
    } catch (e) {
      console.log(
        `${chalk.red(`Failed built`)} ${pkg} ${chalk.magenta(
          `${built} / ${packages.length}`,
        )}`,
      )

      errors.push({ package: pkg, stdout: e.stdout })
    }
  }

  if (errors.length > 0) {
    errors.forEach((e) => {
      console.log(`Error building ${e.package}`)
      console.error(chalk.red(e.stdout))
    })

    process.exit(1)
  }
}
