import { TextSize } from './types'

import jsTypography from './jsTypography.scss'

const sizes: TextSize[] = ['xs', 's', 'ms', 'm', 'ml', 'l', 'xl', '2xl', '3xl', '4xl']
const monoSizes: TextSize[] = ['mono-s', 'mono-m']

/**
 * Converts a t-shirt typography size into the corresponding REM float
 */
export const typographySizeFromSize = (size: TextSize): number => {
  const key = `text-${size}` as const

  return parseFloat(jsTypography[key])
}

export const modifySize = (size: TextSize, numberOfSizes: number): TextSize => {
  const sizeArray = !size.startsWith('mono') ? sizes : monoSizes

  const index = sizeArray.indexOf(size)

  if (index === -1) {
    throw new Error(`Could not find size ${size}`)
  }

  if (numberOfSizes > 0 && index + numberOfSizes < sizeArray.length) {
    return sizeArray[index + numberOfSizes]
  } else if (numberOfSizes < 0 && index + numberOfSizes > -1) {
    return sizeArray[index + numberOfSizes]
  }

  throw new Error(`Cannot add ${numberOfSizes} to size ${size}`)
}

export const paddingClass = (padding: TextSize): string => `padding-${padding}`
