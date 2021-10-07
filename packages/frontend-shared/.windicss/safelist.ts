/**
 * WindiCSS will strip out any styles that aren't used.
 * We do a lot of dynamic stuff, and we're not too concerned
 * ith bundle size, so this is a pretty greedy list
 */
import { colors } from './colors'
import { map, reduce, kebabCase } from 'lodash'

const textSafelist = ['xs', 'sm', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'].map((v) => `text-${v}`).join(' ')
const colorSafelist = reduce(colors, (acc, variants, colorName) => {
  const name = kebabCase(colorName)

  return `${acc}
    ${map(variants, (_: string, k: string) => {
    if (k === 'DEFAULT') return ``

    return `
    icon-light-${name}-${k}
    icon-dark-${name}-${k}
    bg-${name}-${k}
    text-${name}-${k}
    before:bg-${name}-${k}
    before:text-${name}-${k}`
  }).join(' ')}`
}, '')

export const safelist = `${textSafelist} ${colorSafelist}`
