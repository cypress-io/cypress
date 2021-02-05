<template>
  <div class="home">
    <template v-if="crossword">
      <Clues v-for="(clues, direction) in crossword.clues"
             :key="direction"
             :class="direction"
             class="clues"
             :clues="clues"
             @clue-selected="focusClue"
      >
      </Clues>
      <section data-testid="crossword-section"
               class="crossword"
               :class="classes" :key="loading">
        <h1>Component Testing with Crosswords</h1>

        <p v-if="error">
          Houston, we have a problem:
          <pre><code>{{ error }}</code></pre>
        </p>

        <Crossword :loading="loading" ref="crossword"/>
      </section>
    </template>
  </div>
</template>

<script>
  import Clues from '../components/Clues'
  import Crossword from '../components/Crossword'
  import { mapState, mapActions } from 'vuex'

  export default {
    name: 'Home',
    components: {
      Clues,
      Crossword
    },
    data() {
      return {
        loading: false,
        error: null,
      }
    },
    methods: {
        focusClue(clue) {
          this.$refs.crossword.focus(clue)
        },
        loadCrosswordOrFallback() {
          const { date } = this.$router.currentRoute.params

          this.loading = true
          this.error = null

          this.fetchCrossword(date)
            .then(() => this.loading = false )
            .catch((err) => {
              this.loading = false
              this.error = err
            })
        },
      ...mapActions(['fetchCrossword'])
      },
      computed: {
        classes()  {
          return this.crossword.size.cols >= 16 ? 'crossword-lg' : 'crossword-md'
        },
      ...mapState(['crossword'])
      },
      created() {
        this.loading = true;
        this.loadCrosswordOrFallback()
      },
      watch: {
        '$route': function () {
          this.loading = true
          this.loadCrosswordOrFallback()
        }
      }
    }
</script>

<style lang="scss" scoped>
  .home {
    display: grid;
    width: 100%;
    position: relative;
    grid-template-rows: 1fr;
  }

  // aside, down styling
  .clues {
    width: auto;
    padding-top: 0.5rem;
    padding-left: 1rem;
  }

  .crossword {
    top: 0;
    overflow: auto;
    background: white;
    display: flex;
    flex-direction: column;
    grid-gap: 0.8rem;
  }

  // crossword
  // ------------
  // aside | down
  @media (max-width: 750px) {
    .home {
      grid-template-columns:  repeat(auto-fit, minmax(250px, 1fr) );
      grid-template-rows: auto auto;
    }

    .across {
      grid-column: 1
    }

    .down {
      grid-column: 2;
    }

    .crossword {
      grid-row: 1;
      grid-column-start: 1;
      grid-column-end: 3;
    }

    .across, .down { grid-row: 2; }
    .clues + .clues {
      border: none;
    }

    .crossword {
      border-bottom: 1px solid #dadada;
    }
  }

  // aside | crossword
  // down  | crossword
  @media (min-width: 751px) {
    .home {
      grid-template-columns: minmax(18ch, 1fr) 2fr;
      grid-template-rows: 1fr;
    }

    .clues {
      grid-column: 1;
    }

    .down {
      grid-row: 2;
    }

    .crossword {
      position: sticky;
    }
  }

  // aside | crossword | down
  @media (min-width: 980px) {
    .home {
      grid-template-columns: minmax(18ch, 27ch) 2fr minmax(18ch, 27ch);
      grid-gap: 1rem;
    }

    .aside, .crossword, .down {
      grid-row: 1;
    }

    .aside {
      grid-column: 1;
    }

    .crossword {
      grid-column: 2;
    }

    .down {
      grid-column: 3;
    }
  }

  @media (max-width: 1200px) {
    .crossword-lg { --scale: 0.8; }
    .crossword-md { --scale: 0.8; }
  }

  @media (min-width: 1200px) and (max-width: 1500px) {
    .crossword-lg { --scale: 1.0; }
    .crossword-md { --scale: 1.2; }
  }

  @media (min-width: 1501px) {
    .crossword-lg { --scale: 1.1; }
    .crossword-md { --scale: 1.4; }
  }
</style>
