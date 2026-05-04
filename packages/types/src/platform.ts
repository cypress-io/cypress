/// <reference types="node" />
const SUPPORTED_PLATFORMS = ['linux', 'darwin', 'win32'] as const

export type PlatformName = typeof SUPPORTED_PLATFORMS[number]
