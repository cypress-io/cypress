/**
 * WindiCSS will strip out any styles that aren't used.
 * We do a lot of dynamic stuff, and we're not too concerned
 * ith bundle size, so this is a pretty greedy list
 */
import Colors from 'windicss/colors'
import { map, reduce, kebabCase, isObject } from 'lodash'

export const safelist = reduce(Colors, (acc, variants, colorName) => {
  const name = kebabCase(colorName)

  const classesForColor = map(variants, (_: string, k: string) => {
    const classes = `before:bg-${name}
    before:text-${name}
    bg-${name}
    text-${name}`

    if (isObject(variants)) {
      // weighted colors
      return classes.split(' ').map((selector) => `${selector}-${k}`)
    }

    // else, black + white
    return classes
  })

  return `${acc} ${classesForColor.join(' ')}`
}, '')
