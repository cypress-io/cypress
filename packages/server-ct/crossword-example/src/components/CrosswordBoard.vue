<template>
  <div class="crossword-board" data-testid="crossword">
    <div v-for="(row, i) in crossword.rows" :key="`r-${i}`"
         data-testid="row" class="crossword-row">
      <Cell v-for="({ letter, number, index, showLetter, blockedOut }, j) in row"
            :initial-value="boardState[i][j]"
            :show-letter="solved || showLetter"
            :key="`${crossword.id}-${index}`"
            :ref="index"
            :blocked-out="blockedOut"
            :letter="letter"
            :number="number"
            v-model="boardState[i][j]"

      />
    </div>
  </div>
</template>

<script>
  import Cell from './Cell'

  const makeBoardState = (crossword, initialBoard = []) => {
    const state = []

    for (let i = 0; i < crossword.size.rows; i++) {
      const row = []
      for (let j = 0; j < crossword.size.cols; j++) {
        if (initialBoard[i] && initialBoard[i][j]) {
          row.push(initialBoard[i][j])
        } else {
          row.push('')
        }
      }
      state.push(row)
    }
    return state
  }

  export default {
    components: { Cell },
    props: {
      solved: { type: Boolean, default: false },
      crossword: { type: Object, required: true },
      initialBoard: { type: Array, required: false, default: () => ([]) },
    },
    data() {
      return {
        boardState: makeBoardState(this.crossword, this.initialBoard)
      }
    },
    methods: {
      focus(clue) {
        const { index } = this.crossword.cells.find((cell) => {
          return cell.number === clue.number
        })
        this.$refs[index][0].focus()
      },

    },
    watch: {
      boardState(state) {
        this.$emit('update-board', state)
      },
    }
  }
</script>

<style lang="scss" scoped src="./crossword.scss"></style>
