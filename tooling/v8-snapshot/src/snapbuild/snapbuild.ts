import { strict as assert } from 'assert'
import os from 'os'

const platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`

const packages = new Map([
  ['win32 ia32 LE', 'snapbuild-windows-32'],
  ['win32 x64 LE', 'snapbuild-windows-64'],
  ['darwin arm64 LE', 'snapbuild-darwin-arm64'],
  ['android arm64 LE', 'snapbuild-android-arm64'],
  ['darwin x64 LE', 'snapbuild-darwin-64'],
  ['freebsd arm64 LE', 'snapbuild-freebsd-arm64'],
  ['freebsd x64 LE', 'snapbuild-freebsd-64'],
  ['linux arm LE', 'snapbuild-linux-arm'],
  ['linux arm64 LE', 'snapbuild-linux-arm64'],
  ['linux ia32 LE', 'snapbuild-linux-32'],
  ['linux mips64el LE', 'snapbuild-linux-mips64le'],
  ['linux ppc64 LE', 'snapbuild-linux-ppc64le'],
  ['linux x64 LE', 'snapbuild-linux-64'],
])

const uri = packages.get(platformKey)

assert(uri, `no binary package found for platform '{platformKey}'`)

export const binary = require.resolve(uri)
