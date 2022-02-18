import type { Bundler, FrontendFramework, PackageJson } from '@packages/types'
import * as semver from 'semver'

export function detectVariant ({ dependencies, devDependencies }: PackageJson = {}, options: { framework: FrontendFramework, bundler: Bundler }) {
  const getPackage = (pack: string) => dependencies?.[pack] ?? devDependencies?.[pack]

  let variant = [...options.framework.variants].find((variant) => {
    if (variant.bundler !== options.bundler.type) {
      return false
    }

    for (const dep of variant.deps) {
      const packageDep = semver.coerce(getPackage(dep.package))?.version

      if (!packageDep) {
        return false
      }

      const doesSatisfy = semver.satisfies(packageDep, dep.satisfies)

      if (!doesSatisfy) {
        return false
      }
    }

    return true
  })

  if (!variant) {
    variant = options.framework.variants[0]
  }

  return variant
}
