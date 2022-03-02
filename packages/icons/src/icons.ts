import path from 'path'
import { promises as fs } from 'fs'

const dist = [__dirname, '..', 'dist']

function distPath (...args: string[]) {
  return path.join.apply(path, dist.concat([...args]))
}

export const getPathToFavicon = (filename: string) => {
  return distPath('favicon', filename)
}

export const getPathToIcon = (filename: string) => {
  return distPath('icons', filename)
}

export const getPathToLogo = (filename: string) => {
  return distPath('logo', filename)
}

export async function getIconsAsDataURLs () {
  const iconFilenames = await fs.readdir(getPathToIcon('.'))

  const resultWithNulls = await Promise.all(iconFilenames.map(async iconFilename => {
    const matches = /^icon_(?<width>[0-9]+)x(?<height>[0-9]+)(?<scaleFactorSlug>@[0-9]+x)?\.png$/.exec(iconFilename)

    if (!matches) return null

    const base64 = await fs.readFile(getPathToIcon(iconFilename), { encoding: 'base64' })
    const { width, height, scaleFactorSlug } = matches.groups!

    return {
      width: Number(width),
      height: Number(height),
      scaleFactor: scaleFactorSlug ? Number(scaleFactorSlug.slice(1, -1)) : undefined,
      dataURL: `data:image/png;base64,${base64}`
    }
  }))

  return resultWithNulls
  .filter(x => x) as Array<{ scaleFactor: number, width: number, height: number, dataURL: string }>
}