<template>
  <div class="crossword-container">
    <template v-if="crossword">
      <header>
      <router-link :to="yesterday"><BaseButton data-testid="prev">👈👈 Prev</BaseButton></router-link>
      <h3 data-testid="crossword-title" v-html="title"></h3>
      <router-link :to="tomorrow"><BaseButton data-testid="next">Next 👉👉</BaseButton></router-link>
      </header>
      <transition name="fade" mode="out-in">
        <CrosswordBoard
            v-if="!loading"
            ref="board"
            :key="`${crossword.id}`"
            :crossword="crossword"
            :solved="solved"
            :initial-board="board"
            @update-board="setBoardState"
        />
        <CrosswordSkeleton data-testid="crossword-skeleton" :crossword="crossword" v-else></CrosswordSkeleton>
      </transition>
      <p>By {{ crossword.author }}, {{ crossword.date }}</p>
    </template>

  </div>
</template>

<script>
  import CrosswordBoard from './CrosswordBoard'
  import Clues from './Clues'
  import BaseButton from './BaseButton'
  import { mapState, mapActions, mapGetters } from 'vuex'
  import CrosswordSkeleton from './CrosswordSkeleton'

  export default {
    props: {
      loading: { default: false },
    },
    components: {CrosswordSkeleton, CrosswordBoard, Clues, BaseButton },
    computed: {
      title() {
        const date = new Date(this.crossword.date)

        const dateTimeFormat = new Intl.DateTimeFormat('en', {
          year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
        })

        return this.crossword.isSunday ?
          `${this.crossword.title}, ${dateTimeFormat.format(date)}` :
          this.crossword.title
      },
      ...mapState(['crossword', 'solved', 'board']),
      ...mapGetters(['yesterday', 'tomorrow'])
    },
    methods: {
      solve(clue) {
        this.$refs.board.toggleShowClueNumber(clue)
      },
      focus(clue) {
        this.$refs.board.focus(clue)
      },
      ...mapActions(['setBoardState'])
    },
  }
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity, height, width  .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
  width: min-content;
  height: min-content;
}
</style>
<style scoped>
  p {
    text-align: center;
  }

  h2 {
    text-transform: uppercase;
  }

  header {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .crossword-container {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    grid-gap: 3rem;
  }
</style>
