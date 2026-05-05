import path from 'path'
import cachedir from 'cachedir'
import untildify from 'untildify'

const BUNDLES_DIRNAME = 'bundles'

const resolveCypressCacheRoot = (): string => {
  const override = process.env.CYPRESS_CACHE_FOLDER

  if (override) {
    return path.resolve(untildify(override))
  }

  return cachedir('Cypress')
}

export const getBundleCacheRoot = (): string => {
  return path.join(resolveCypressCacheRoot(), BUNDLES_DIRNAME)
}

export const getBundleCacheDir = (kind: 'cy-prompt' | 'studio'): string => {
  return path.join(getBundleCacheRoot(), kind)
}
