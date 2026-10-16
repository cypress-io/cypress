import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { createBundleAsync } from '../../src/generator/create-snapshot-script'

use(chaiAsPromised)

describe('create-bundle', () => {
  // NOTE: the fake bundler is executed via its shebang, which Windows does not honor.
  const itSurfacesStderr = process.platform === 'win32' ? it.skip : it

  itSurfacesStderr('rejects with the bundler stderr when the bundler exits non-zero', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'minimal')
    const entryFilePath = path.join(projectBaseDir, 'entry.js')
    const fakeBundler = path.join(os.tmpdir(), `failing-bundler-${process.pid}.js`)

    // The bundler is spawned with a replaced env (no PATH), so point the shebang
    // straight at the running node binary rather than relying on `/usr/bin/env`.
    await fs.writeFile(
      fakeBundler,
      [
        `#!${process.execPath}`,
        `process.stderr.write('bundler failed on ./offending-module.js\\n')`,
        'process.exit(1)',
      ].join('\n'),
      { mode: 0o755 },
    )

    try {
      await expect(createBundleAsync({
        baseDirPath: projectBaseDir,
        entryFilePath,
        bundlerPath: fakeBundler,
        nodeModulesOnly: false,
        supportTypeScript: false,
        integrityCheckSource: undefined,
      })).to.be.rejectedWith(/bundler failed on \.\/offending-module\.js/)
    } finally {
      await fs.remove(fakeBundler)
    }
  })
})
