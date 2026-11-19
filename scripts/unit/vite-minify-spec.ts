import { expect } from 'chai'
import path from 'path'
import type { ResolvedConfig } from 'vite'

const repoRoot = path.join(__dirname, '..', '..')

const resolveBuild = async (pkg: 'app' | 'launchpad', inlineBuild = {}): Promise<ResolvedConfig['build']> => {
  const { resolveConfig } = await import('vite')
  const root = path.join(repoRoot, 'packages', pkg)
  const config = await resolveConfig({
    root,
    configFile: path.join(root, 'vite.config.mjs'),
    logLevel: 'silent',
    build: inlineBuild,
  }, 'build', 'production')

  return config.build
}

describe('app and launchpad Vite builds', function () {
  // Loading each config bundles it and its plugins, which is slow on a cold disk
  this.timeout(120000)

  it('minify production output with the same minifier', async () => {
    const app = await resolveBuild('app')
    const launchpad = await resolveBuild('launchpad')

    expect(launchpad.minify).to.equal('oxc')
    expect(app.minify).to.equal(launchpad.minify)
    expect(app.cssMinify).to.equal(launchpad.cssMinify)
  })

  it('keeps the build options a package sets for itself', async () => {
    const app = await resolveBuild('app')

    expect(app.target).to.equal('ES2022')
  })

  // `yarn dev` runs `vite build --minify false`, which Vite applies as inline config
  it('leaves JS and CSS unminified when built with --minify false', async () => {
    for (const pkg of ['app', 'launchpad'] as const) {
      const build = await resolveBuild(pkg, { minify: false })

      expect(build.minify, pkg).to.equal(false)
      expect(build.cssMinify, pkg).to.equal(false)
    }
  })
})
