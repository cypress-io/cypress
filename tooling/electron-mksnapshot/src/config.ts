import path from 'path'

export type VersionMeta = Record<string, string | boolean> & {
  platform: string
  arch: string | null
  version: string
  isWindows: boolean
  snapshotBlobFile: string
  v8ContextFile: string
}

const isWindows = process.platform === 'win32'

const projectRootDir = path.join(__dirname, '..')
const binDir = path.join(projectRootDir, 'bin')
const mksnapshotBinary = path.join(
  binDir,
  isWindows ? 'mksnapshot.exe' : 'mksnapshot',
)
const versionMetaPath = path.join(binDir, 'meta.json')

const platform = process.env.npm_config_platform || process.platform
const targetArch = process.env.npm_config_arch || process.arch

const crossArchDirs = [
  'clang_x86_v8_arm',
  'clang_x64_v8_arm64',
  'win_clang_x64',
]

let v8ContextFile = 'v8_context_snapshot.bin'

if (platform === 'darwin') {
  if (targetArch === 'arm64') {
    v8ContextFile = 'v8_context_snapshot.arm64.bin'
  } else {
    v8ContextFile = 'v8_context_snapshot.x86_64.bin'
  }
}

const snapshotBlobFile = 'snapshot_blob.bin'

class Config {
  constructor (
    readonly platform: string,
    readonly projectRootDir: string,
    readonly binDir: string,
    readonly mksnapshotBinary: string,
    readonly crossArchDirs: string[],
    readonly isWindows: boolean,
    readonly snapshotBlobFile: string,
    readonly v8ContextFile: string,
    readonly versionMetaPath: string,
    readonly archToDownload?: string,
  ) {}

  versionMeta (version: string): VersionMeta {
    return {
      platform: this.platform,
      arch: this.archToDownload ?? null,
      version,
      isWindows: this.isWindows,
      snapshotBlobFile: this.snapshotBlobFile,
      v8ContextFile: this.v8ContextFile,
    } as VersionMeta
  }

  versionMetaJSON (version: string) {
    return JSON.stringify(this.versionMeta(version), null, 2)
  }
}

export const config = new Config(
  platform,
  projectRootDir,
  binDir,
  mksnapshotBinary,
  crossArchDirs,
  isWindows,
  snapshotBlobFile,
  v8ContextFile,
  versionMetaPath,
  process.env.npm_config_arch,
)
