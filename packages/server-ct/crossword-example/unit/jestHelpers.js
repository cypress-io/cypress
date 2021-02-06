export function fillCrossword (inputWrappers, options) {
  const letters = options.partially ? options.crossword.grid.slice(0, 15) : options.crossword.grid

  letters.forEach((letter, idx) => {
    if (letter !== '.') {
      // setValue does Vue-specific stuff under the hood
      // to make sure the proper methods are run
      inputWrappers[idx].setValue(letter)
    }
  })
}

export function getCrossword (inputWrappers) {
  return Array.from(inputWrappers.wrappers)
  .map((wrapper) => wrapper.element.value)
  .join('')
}
