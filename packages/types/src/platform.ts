/// <reference types="node" />
export const SUPPORTED_PLATFORMS = ['linux', 'darwin', 'win32'] as const

export type PlatformName = typeof SUPPORTED_PLATFORMS[number]

export function assertValidPlatform (platform: NodeJS.Platform): asserts platform is PlatformName {
  if (!SUPPORTED_PLATFORMS.includes(platform as any)) {
    throw new Error(`Unsupported platform ${platform}, expected ${SUPPORTED_PLATFORMS.join(', ')}`)
  }
}
