import { isSunday } from '../utils/date'
import { flatten } from 'lodash'

const setProp = (varName, val) => document.documentElement.style.setProperty(varName, val)

export function toggleCrosswordSize (factor) {
  setProp('--scale', factor)
}

export const hash = (s) => {
  return s.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)

    return a & a
  }, 0)
}

const matchNumber = (text) => parseInt(text.match(/(\d+)\w?/)[0], 10)

const makeClue = (clue, idx, direction, { answers }) => {
  let text = clue

  if (typeof clue === 'object') {
    text = clue.text
    idx = clue.index
  }

  const answer = answers[direction][idx]

  matchNumber(text)

  return {
    direction,
    text,
    number: matchNumber(text),
    answer,
    indices: [],
  }
}

function make2DGrid (crossword) {
  const newRowLimit = crossword.size.cols
  const rows = []
  let currentRow = []
  let rowIdx = 0
  let colIdx = 0

  for (let i = 0; i < crossword.grid.length; i++) {
    const letter = crossword.grid[i]
    const number = crossword.gridnums[i]

    const cell = {
      letter: letter || '',
      number: number || '',
      blockedOut: letter === '.',
      index: i,
      rowIdx,
      colIdx,
      showLetter: false,
    }

    currentRow.push(cell)

    colIdx++
    if (currentRow.length === newRowLimit) {
      rows.push(Array.from(currentRow))
      colIdx = 0
      rowIdx++
      currentRow = []
    }
  }

  return rows
}

export function createCrossword (crossword, two) {
  crossword.clues = {
    across: crossword.clues.across.map((c, idx) => makeClue(c, idx, 'across', crossword)),
    down: crossword.clues.down.map((c, idx) => makeClue(c, idx, 'down', crossword)),
  }

  crossword.rows = make2DGrid(crossword)
  crossword.cells = flatten(crossword.rows)

  // for (let i = 0; i < crossword.rows.length; i++) {
  //   for (let j = 0; j < crossword.rows[i].length; j++) {
  //     const cell = crossword.rows[i][j]
  //     crossword.cells.push(cell)
  //   }
  // }

  crossword.isSunday = isSunday(crossword.date)
  crossword.id = crossword.date

  return crossword
}
