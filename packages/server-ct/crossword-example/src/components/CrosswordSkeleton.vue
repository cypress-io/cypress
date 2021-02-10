<template>
  <div data-testid="crossword-skeleton" class="crossword-board skeleton" :class="classes">
    <div v-for="(row, i) in finalCrossword.rows" :key="i" class="crossword-row">
      <div v-for="(cell, j) in row"
           :key="j"
           class="cell"
           :class="cell.blockedOut ? 'blocked-out' : '' ">
      </div>
    </div>
  </div>
</template>

<script>
  import crosswords from '../../cypress/fixtures/crosswords'
  export default {
    props: {
      crossword: { default: null }
    },
    computed: {
      classes()  {
        return this.finalCrossword.size.cols >= 16 ? 'crossword-lg' : 'crossword-md'
      },
      finalCrossword() { return this.crossword || crosswords.previousCrossword }
    }
  }
</script>

<style scoped lang="scss">
.skeleton.crossword-board {
  opacity: 0.7;

  &:after {
    content: '';
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .2), transparent);
    animation: loading 2s infinite;
  }
}

@keyframes loading {
  100% {
    transform: translateX(100%);
  }
}
</style>
<style lang="scss" src="./crossword.scss"></style>
