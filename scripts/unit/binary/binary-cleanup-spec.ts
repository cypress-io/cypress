import { expect } from 'chai'
import del from 'del'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'

import { getUnneededFileGlobs, UNNEEDED_FILE_GLOBS } from '../../binary/binary-cleanup-globs'

// One real-world path per deny-list glob, as they appear in the packed app
const REMOVED_FIXTURES = [
  'node_modules/is-glob/test/index.js',
  'node_modules/pump/tests/index.js',
  'node_modules/prettier/esm/standalone.mjs',
  'node_modules/prettier/standalone.js',
  'node_modules/prettier/bin-prettier.js',
  'node_modules/@babel/runtime/helpers/esm/extends.js',
  'node_modules/ramda/es/index.js',
  'node_modules/jimp/es/index.js',
  'node_modules/nexus/dist-esm/index.js',
  'node_modules/@graphql-tools/utils/cjs/index.mjs',
  'node_modules/graphql/index.mjs',
  'node_modules/@opentelemetry/api/build/esm/index.js',
  'node_modules/@opentelemetry/api/build/esnext/index.js',
  'node_modules/zod/index.js.map',
  'node_modules/zod/index.d.ts.map',
  'node_modules/zod/README.md',
  'node_modules/zod/index.d.ts',
  'node_modules/zod/index.d.cts',
  'node_modules/zod/index.d.mts',
  'node_modules/graphql/index.js.flow',
  'node_modules/zod/src/index.ts',
  'node_modules/webdriver/src/index.cts',
  'node_modules/@opentelemetry/api/src/index.mts',
  'node_modules/JSV/jsdoc-toolkit/app/run.js',
  'node_modules/JSV/docs/index.html',
  'node_modules/fluent-ffmpeg/doc/index.html',
  'node_modules/qs/.github/FUNDING.yml',
  'node_modules/qs/.eslintrc',
  'node_modules/qs/.eslintrc.json',
  'node_modules/semver/.prettierrc.js',
  'node_modules/semver/.nycrc',
  'node_modules/qs/.npmignore',
  'node_modules/qs/.editorconfig',
  'node_modules/qs/.travis.yml',
  'node_modules/@babel/core/node_modules/.bin/semver',
  'node_modules/registry-js/build/node_gyp_bins/python3',
  'node_modules/better-sqlite3/bin/darwin-arm64/better_sqlite3.node',
  'node_modules/registry-js/prebuilds/win32-x64/registry.node',
  'node_modules/bare-fs/prebuilds/linux-x64/bare-fs.bare',
  'node_modules/registry-js/src/main.cc',
  'node_modules/registry-js/build/Release/obj.target/registry.o',
  'node_modules/better-sqlite3/deps/sqlite3/sqlite3.c',
  'node_modules/better-sqlite3/deps/sqlite3/sqlite3.h',
  'node_modules/better-sqlite3/src/addon.cpp',
  'node_modules/better-sqlite3/deps/sqlite3.gyp',
  'node_modules/bare-fs/CMakeLists.txt',
  'node_modules/debug/Makefile',
  'packages/server/patches/http-proxy+1.18.1.patch',
  'node_modules/ramda/dist/ramda.js',
  'node_modules/jimp/browser/lib/jimp.js',
  'node_modules/@jimp/core/src/index.js',
  'node_modules/nexus/src/index.js',
  'node_modules/source-map/dist/source-map.js',
  'node_modules/source-map-js/dist/source-map.js',
  'node_modules/pako/dist/pako.js',
  'node_modules/node-forge/dist/forge.min.js',
  'node_modules/pngjs/browser.js',
  'node_modules/plist/dist/plist.js',
  'yarn.lock',
]

const KEPT_FIXTURES = [
  'index.js',
  'package.json',
  'packages/server/lib/cloud/encryption.js',
  'node_modules/zod/index.js',
  'node_modules/zod/LICENSE.md',
  'node_modules/@opentelemetry/api/build/src/index.js',
  'node_modules/better-sqlite3/build/Release/better_sqlite3.node',
  'node_modules/semver/bin/semver.js',
  'node_modules/some-module/.gitkeep',
]

// `del` resolves literal glob segments on disk and returns them as written in
// the glob, so on macOS and Windows a mis-cased segment still yields matches.
// Comparing each match against the names on disk catches it on every platform.
const existsWithExactCase = async (root: string, match: string) => {
  let dir = root

  for (const segment of path.relative(root, match).split(path.sep)) {
    if (!(await fs.readdir(dir)).includes(segment)) {
      return false
    }

    dir = path.join(dir, segment)
  }

  return true
}

const findMatches = async (root: string, segments: string[]) => {
  const matches: string[] = await del(path.join(root, ...segments), { force: true, dryRun: true })
  const exact = await Promise.all(matches.map((match) => existsWithExactCase(root, match)))

  return matches.filter((_match, i) => exact[i])
}

describe('binary-cleanup', () => {
  let root: string

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'binary-cleanup-'))

    await Promise.all([...REMOVED_FIXTURES, ...KEPT_FIXTURES].map((fixture) => fs.outputFile(path.join(root, fixture), '')))
  })

  afterEach(async () => {
    await fs.remove(root)
  })

  it('matches something with every deny-list glob', async () => {
    for (const segments of UNNEEDED_FILE_GLOBS) {
      const matches = await findMatches(root, segments)

      expect(matches, `${segments.join('/')} matched nothing`).not.to.be.empty
    }
  })

  it('removes every denied fixture and keeps the rest', async () => {
    await del(getUnneededFileGlobs(root), { force: true })

    const remaining = REMOVED_FIXTURES.filter((fixture) => fs.existsSync(path.join(root, fixture)))
    const missing = KEPT_FIXTURES.filter((fixture) => !fs.existsSync(path.join(root, fixture)))

    expect(remaining, 'not removed').to.be.empty
    expect(missing, 'removed but should be kept').to.be.empty
  })
})
