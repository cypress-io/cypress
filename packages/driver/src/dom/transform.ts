import _ from 'lodash'
import { getParent } from './elements'
import { isDocument } from './document'

export const detectVisibility = ($el: any) => {
  const list = extractTransformInfoFromElements($el)

  if (existsInvisibleBackface(list)) {
    return elIsBackface(list) ? 'backface' : 'visible'
  }

  return elIsTransformedToZero(list) ? 'transformed' : 'visible'
}

type BackfaceVisibility = 'hidden' | 'visible' | ''
type TransformStyle = 'flat' | 'preserve-3d'
type Matrix2D = [
  number, number, number,
  number, number, number,
]
type Matrix3D = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
]

type Vector3 = [number, number, number]

interface TransformInfo {
  backfaceVisibility: BackfaceVisibility
  transformStyle: TransformStyle
  transform: string
}

const extractTransformInfoFromElements = ($el: any, list: TransformInfo[] = []): TransformInfo[] => {
  const info = extractTransformInfo($el)

  if (info) {
    list.push(info)
  }

  const $parent = getParent($el)

  if (!$parent.length || isDocument($parent)) {
    return list
  }

  return extractTransformInfoFromElements($parent, list)
}

const extractTransformInfo = ($el): TransformInfo | null => {
  const el = $el[0]
  const style = getComputedStyle(el)

  const backfaceVisibility = style.getPropertyValue('backface-visibility') as BackfaceVisibility

  // When an element is not in the DOM tree, getComputedStyle() returns empty string.
  // In an edge case from frameworks like `vue-fragment`
  // `parentNode` is modified and out of the DOM tree.
  // @see https://github.com/cypress-io/cypress/pull/6787
  // @see https://github.com/cypress-io/cypress/issues/6745
  if (backfaceVisibility === '') {
    return null
  }

  return {
    backfaceVisibility,
    transformStyle: style.getPropertyValue('transform-style') as TransformStyle,
    transform: style.getPropertyValue('transform'),
  }
}

const existsInvisibleBackface = (list: TransformInfo[]) => {
  return !!_.find(list, { backfaceVisibility: 'hidden' })
}

const numberRegex = /-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/g
const defaultNormal: Vector3 = [0, 0, 1]
const viewVector: Vector3 = [0, 0, -1]
const identityMatrix3D: Matrix3D = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]

// It became 1e-5 from 1e-10. Because 30deg + 30deg + 30deg is 6.0568e-7 and it caused a false negative.
const TINY_NUMBER = 1e-5

const nextPreserve3d = (i: number, list: TransformInfo[]) => {
  return i + 1 < list.length &&
  list[i + 1].transformStyle === 'preserve-3d'
}

const finalNormal = (startIndex: number, list: TransformInfo[]) => {
  let i = startIndex
  let normal = findNormal(parseMatrix3D(list[i].transform))

  while (nextPreserve3d(i, list)) {
    i++
    normal = findNormal(parseMatrix3D(list[i].transform), normal)
  }

  return normal
}

const elIsBackface = (list: TransformInfo[]) => {
  // When the direct parent of the target has style, preserve-3d
  if (list.length > 1 && list[1].transformStyle === 'preserve-3d') {
    // When the target is backface-invisible a2-1-1 ~ a2-1-4
    if (list[0].backfaceVisibility === 'hidden') {
      let normal = finalNormal(0, list)

      if (checkBackface(normal)) {
        return true
      }
    } else {
      // When the direct parent of the target is backface-invisible
      if (list[1].backfaceVisibility === 'hidden') {
        // If it is not none, it is visible. Check a2-3-1
        if (list[0].transform === 'none') {
          let normal = finalNormal(1, list)

          if (checkBackface(normal)) {
            return true
          }
        }
      }

      // Check 90deg a2-2-3, a2-2-4.
      let normal = finalNormal(0, list)

      return isElementOrthogonalWithView(normal)
    }
  } else {
    for (let i = 0; i < list.length; i++) {
      // Ignore preserve-3d when it is not a direct parent.
      // Why? -> https://github.com/cypress-io/cypress/pull/5916
      if (i > 0 && list[i].transformStyle === 'preserve-3d') {
        continue
      }

      if (list[i].backfaceVisibility === 'hidden' && list[i].transform.startsWith('matrix3d')) {
        let normal = findNormal(parseMatrix3D(list[i].transform))

        if (checkBackface(normal)) {
          return true
        }
      }
    }
  }

  return false
}

// This function uses a simplified version of backface culling.
// https://en.wikipedia.org/wiki/Back-face_culling
//
// We defined view vector, (0, 0, -1), - eye to screen.
// and default normal vector of an element, (0, 0, 1)
// When dot product of them are >= 0, item is visible.
const checkBackface = (normal: Vector3) => {
  // Simplified dot product.
  // viewVector[0] and viewVector[1] are always 0. So, they're ignored.
  let dot = viewVector[2] * normal[2]

  // Because of the floating point number rounding error,
  // cos(90deg) isn't 0. It's 6.12323e-17.
  // And it sometimes causes errors when dot product value is something like -6.12323e-17.
  // So, we're setting the dot product result to 0 when its absolute value is less than SMALL_NUMBER(10^-10).
  if (Math.abs(dot) < TINY_NUMBER) {
    dot = 0
  }

  return dot >= 0
}

const parseMatrix3D = (transform: string): Matrix3D => {
  if (transform === 'none') {
    return identityMatrix3D
  }

  if (transform.startsWith('matrix3d')) {
    const matrix: Matrix3D = transform.substring(8).match(numberRegex)!.map((n) => {
      return parseFloat(n)
    }) as Matrix3D

    return matrix
  }

  return toMatrix3d(transform.match(numberRegex)!.map((n) => parseFloat(n)) as Matrix2D)
}

const parseMatrix2D = (transform: string): Matrix2D => {
  return transform.match(numberRegex)!.map((n) => parseFloat(n)) as Matrix2D
}

const findNormal = (matrix: Matrix3D, normal: Vector3 = defaultNormal): Vector3 => {
  const m = matrix // alias for shorter formula
  const v = normal // alias for shorter formula
  const computedNormal: Vector3 = [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
  ]

  return toUnitVector(computedNormal)
}

const toMatrix3d = (m2d: Matrix2D): Matrix3D => {
  return [
    m2d[0], m2d[1], 0, 0,
    m2d[2], m2d[3], 0, 0,
    0, 0, 1, 0,
    m2d[4], m2d[5], 0, 1,
  ]
}

const toUnitVector = (v: Vector3): Vector3 => {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

  return [v[0] / length, v[1] / length, v[2] / length]
}

// This function checks 2 things that can happen: scale and rotate to 0 in width or height.
const elIsTransformedToZero = (list: TransformInfo[]) => {
  if (list.some((info) => info.transformStyle === 'preserve-3d')) {
    const normal = finalNormal(0, list)

    return isElementOrthogonalWithView(normal)
  }

  return !!_.find(list, (info) => isTransformedToZero(info))
}

const isTransformedToZero = ({ transform }: TransformInfo) => {
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
    const matrix3d = parseMatrix3D(transform)

    if (is3DMatrixScaledTo0(matrix3d)) {
      return true
    }

    const normal = findNormal(matrix3d)

    return isElementOrthogonalWithView(normal)
  }

  const m = parseMatrix2D(transform)

  if (is2DMatrixScaledTo0(m)) {
    return true
  }

  return false
}

const is3DMatrixScaledTo0 = (m3d: Matrix3D) => {
  const xAxisScaledTo0 = m3d[0] === 0 && m3d[4] === 0 && m3d[8] === 0
  const yAxisScaledTo0 = m3d[1] === 0 && m3d[5] === 0 && m3d[9] === 0
  const zAxisScaledTo0 = m3d[2] === 0 && m3d[6] === 0 && m3d[10] === 0

  if (xAxisScaledTo0 || yAxisScaledTo0 || zAxisScaledTo0) {
    return true
  }

  return false
}

const is2DMatrixScaledTo0 = (m: Matrix2D) => {
  const xAxisScaledTo0 = m[0] === 0 && m[2] === 0
  const yAxisScaledTo0 = m[1] === 0 && m[3] === 0

  if (xAxisScaledTo0 || yAxisScaledTo0) {
    return true
  }

  return false
}

const isElementOrthogonalWithView = (normal: Vector3) => {
  // Simplified dot product.
  // [0] and [1] are always 0
  const dot = viewVector[2] * normal[2]

  return Math.abs(dot) < TINY_NUMBER
}
