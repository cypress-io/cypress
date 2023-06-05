export const export1 = 'export1'

export const export2 = 'export2'

// @ts-expect-error
window.sideEffect = 'Side Effect'

export default {
  export1,
  export2,
}
