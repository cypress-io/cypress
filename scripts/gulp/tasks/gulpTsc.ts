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

export async function checkTs () {
  const [a, b] = await Promise.all([
    getTsPackages(),
    getTsPackages('npm'),
  ])

  await checkPackageTsc({
    tsPackages: new Set([...a, ...b]),
  })
}

export function getTsPackages (packagesPath: string = 'packages'): Promise<Set<string>> {
  const dfd = {} as Record<string, any>

  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })

  glob(
    path.join(monorepoPaths.root, packagesPath, '/*/package.json'),
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
        // Select only packages that have check-ts
        if (r.scripts && r.scripts['check-ts']) {
          packages.add(`${packagesPath}/${r.name}`)
        }
      })

      dfd.resolve(packages)
    },
  )

  return dfd.promise
}

export async function checkPackageTsc ({
  tsPackages = new Set(),
  onlyPackages,
}: {
  packagesPath?: string
  tsPackages?: Set<string>
  onlyPackages?: string[]
}) {
  const packages = onlyPackages || [...Array.from(tsPackages)]

  console.log(
    chalk.blue(`TSC: Checking types for ${onlyPackages || packages.join(', ')}`),
  )

  const errors = []

  let built = 0

  for (const pkg of packages) {
    const cwd = path.join(
      monorepoPaths.root,
      `/${pkg.replace(/\@(packages|cypress)\//, '')}`,
    )

    try {
      built++
      await execAsync('yarn check-ts', { cwd })

      console.log(
        `${chalk.green(`Built`)} ${cwd} ${chalk.magenta(
          `${built} / ${packages.length}`,
        )}`,
      )
    } catch (e: unknown?) {
      console.log(
        `${chalk.red(`Failed building`)} ${cwd} ${chalk.magenta(
          `${built} / ${packages.length}`,
        )}`,
      )

      console.error(chalk.red(e.stdout))

      errors.push({ package: cwd })
    }
  }

  if (errors.length > 0) {
    errors.forEach((e) => {
      console.log(`Error building ${e.package}`)
    })

    process.exit(1)
  }
}
