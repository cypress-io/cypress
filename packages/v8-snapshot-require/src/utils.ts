import path from 'path'

/**
 * Normalizes the given path to have forward slashes at all times.
 * This is used to resolve modules from the snapshot as they are always stored
 * with forward slashes there.
 * @category loader
 */
export const forwardSlash =
  path.sep === path.posix.sep
    ? (p: string) => p
    : (p: string) => p.replace(/(\\)+/g, '/')
