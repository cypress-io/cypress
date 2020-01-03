import _ from 'lodash'
import { isDocument } from './document'

export const detectVisibility = ($el: any) => {
  const list = extractTransformInfoFromElements($el)

  if (existsInvisibleBackface(list)) {
    return elIsBackface(list) ? 'backface' : 'visible'
  }

  return elIsTransformedToZero(list) ? 'transformed' : 'visible'
}

type BackfaceVisibility = 'hidden' | 'visible'
type TransformStyle = 'flat' | 'preserve-3d'

interface TransformInfo {
  backfaceVisibility: BackfaceVisibility
  transformStyle: TransformStyle
  transform: string
}

const extractTransformInfoFromElements = ($el: any, list: TransformInfo[] = []) => {
  list.push(extractTransformInfo($el))

  const $parent = $el.parent()

  if (!$parent.length || isDocument($parent)) {
    return list
  }

  return extractTransformInfoFromElements($parent, list)
}

const extractTransformInfo = ($el): TransformInfo => {
  const el = $el[0]
  const style = getComputedStyle(el)

  return {
    backfaceVisibility: style.getPropertyValue('backface-visibility') as BackfaceVisibility,
    transformStyle: style.getPropertyValue('transform-style') as TransformStyle,
    transform: style.getPropertyValue('transform'),
  }
}

const existsInvisibleBackface = (list) => {
  return !!_.find(list, { backfaceVisibility: 'hidden' })
}

const numberRegex = /-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/g
const defaultNormal = [0, 0, 1]
const viewVector = [0, 0, -1]
// This function uses a simplified version of backface culling.
// https://en.wikipedia.org/wiki/Back-face_culling
//
// We defined view vector, (0, 0, -1), - eye to screen.
// and default normal vector of an element, (0, 0, 1)
// When dot product of them are >= 0, item is visible.
const elIsBackface = (list) => {
  const nextPreserve3d = (i) => {
    return i + 1 < list.length &&
    list[i + 1].transformStyle === 'preserve-3d'
  }

  let i = 0

  const finalNormal = (startIndex) => {
    i = startIndex
    let normal = findNormal(parseMatrix(list[i].transform))

    while (nextPreserve3d(i)) {
      i++
      normal = findNormal(parseMatrix(list[i].transform), normal)
    }

    return normal
  }

  const skipToNextFlat = () => {
    while (nextPreserve3d(i)) {
      i++
    }

    i++
  }

  if (1 < list.length && list[1].transformStyle === 'preserve-3d') {
    if (list[0].backfaceVisibility === 'hidden') {
      let normal = finalNormal(0)

      if (checkBackface(normal)) {
        return true
      }

      i++
    } else {
      if (list[1].backfaceVisibility === 'visible') {
        const { width, height } = list[0].el.getBoundingClientRect()

        if (width === 0 || height === 0) {
          return true
        }

        skipToNextFlat()
      } else {
        if (list[0].transform !== 'none') {
          skipToNextFlat()
        } else {
          i++

          let normal = finalNormal(i)

          if (checkBackface(normal)) {
            return true
          }

          i++
        }
      }
    }
  } else {
    for (; i < list.length; i++) {
      if (i > 0 && list[i].transformStyle === 'preserve-3d') {
        continue
      }

      if (list[i].backfaceVisibility === 'hidden' && list[i].transform.startsWith('matrix3d')) {
        let normal = findNormal(parseMatrix(list[i].transform))

        if (checkBackface(normal)) {
          return true
        }
      }
    }
  }

  return false
}

const checkBackface = (normal) => {
  // Simplified dot product.
  // viewVector[0] and viewVector[1] are always 0. So, they're ignored.
  let dot = viewVector[2] * normal[2]

  // Because of the floating point number rounding error,
  // cos(90deg) isn't 0. It's 6.12323e-17.
  // And it sometimes causes errors when dot product value is something like -6.12323e-17.
  // So, we're setting the dot product result to 0 when its absolute value is less than 1e-10(10^-10).
  if (Math.abs(dot) < 1e-10) {
    dot = 0
  }

  return dot >= 0
}

const parseMatrix = (transform) => {
  if (transform === 'none') {
    return []
  }

  if (transform.startsWith('matrix3d')) {
    return transform.substring(8).match(numberRegex)
  }

  return toMatrix3d(transform.match(numberRegex))
}

const findNormal = (matrix, normal = defaultNormal) => {
  if (matrix.length === 0) {
    return normal
  }

  const m = matrix // alias for shorter formula
  const v = normal // alias for shorter formula
  const computedNormal = [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
  ]

  return toUnitVector(computedNormal)
}

const toMatrix3d = (m2d) => {
  return [
    m2d[0], m2d[1], 0, 0,
    m2d[2], m2d[3], 0, 0,
    0, 0, 1, 0,
    m2d[4], m2d[5], 0, 1,
  ]
}

const toUnitVector = (v) => {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

  return [v[0] / length, v[1] / length, v[2] / length]
}

// This function checks 2 things that can happen: scale and rotate to 0 in width or height.
const elIsTransformedToZero = (list) => {
  return !!_.find(list, (info) => isTransformedToZero(info))
}

const isTransformedToZero = ({ transform }) => {
  if (transform === 'none') {
    return false
  }

  // To understand how this part works,
  // you need to understand tranformation matrix first.
  // Matrix is hard to explain with only text. So, check these articles.
  //
  // https://www.useragentman.com/blog/2011/01/07/css3-matrix-transform-for-the-mathematically-challenged/
  // https://en.wikipedia.org/wiki/Rotation_matrix#In_three_dimensions
  //
  if (transform.startsWith('matrix3d')) {
    const matrix3d = parseMatrix(transform)

    if (is3DMatrixScaledTo0(matrix3d)) {
      return true
    }

    return isElementOrthogonalWithView(matrix3d)
  }

  const m = transform.match(numberRegex)

  if (is2DMatrixScaledTo0(m)) {
    return true
  }

  return false
}

const is3DMatrixScaledTo0 = (m3d) => {
  const xAxisScaledTo0 = +m3d[0] === 0 && +m3d[4] === 0 && +m3d[8] === 0
  const yAxisScaledTo0 = +m3d[1] === 0 && +m3d[5] === 0 && +m3d[9] === 0
  const zAxisScaledTo0 = +m3d[2] === 0 && +m3d[6] === 0 && +m3d[10] === 0

  if (xAxisScaledTo0 || yAxisScaledTo0 || zAxisScaledTo0) {
    return true
  }

  return false
}

const is2DMatrixScaledTo0 = (m) => {
  const xAxisScaledTo0 = +m[0] === 0 && +m[2] === 0
  const yAxisScaledTo0 = +m[1] === 0 && +m[3] === 0

  if (xAxisScaledTo0 || yAxisScaledTo0) {
    return true
  }

  return false
}

const isElementOrthogonalWithView = (matrix3d) => {
  const elNormal = findNormal(matrix3d)
  // Simplified dot product.
  // [0] and [1] are always 0
  const dot = viewVector[2] * elNormal[2]

  return Math.abs(dot) <= 1e-10
}
