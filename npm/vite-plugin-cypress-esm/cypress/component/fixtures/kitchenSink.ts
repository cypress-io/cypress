export const export1 = 'export1'

export const export2 = 'export2'

export const export3 = 'export3'

export const export4 = 'export4'

export const export5 = 'export5'

// @ts-expect-error
window.sideEffect = 'Side Effect'

export default {
  export1,
  export2,
}
