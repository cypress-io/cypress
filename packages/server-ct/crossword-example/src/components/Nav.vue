<template>
  <nav>
    <slot/>
    <form @reset="reset" @submit.prevent>
      <BaseButton data-testid="reset" type="reset">Restart Crossword 🗑</BaseButton>
      <BaseButton @click.native="toggleAnswersVisible" data-testid="auto-solve">✨ Magic Solve Button ✨</BaseButton>
    </form>
  </nav>
</template>

<script>
  import { toggleCrosswordSize } from '../utils'
  import { mapActions, mapGetters } from 'vuex'
  import BaseButton from './BaseButton'

  export default {
    components: { BaseButton },
    computed: {
      ...mapGetters(['yesterday', 'tomorrow'])
    },
    methods: {
      ...mapActions(['reset', 'toggleAnswersVisible']),
      toggleCrosswordSize,
    }
  }
</script>

<style scoped lang="scss">
  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }

  hr {
    background-color: #dadada;
    border: none;
    height: 1px;
    width: calc(100% + 1rem);
    margin-left: -1rem;
  }

  p {
    font-weight: normal;
  }

  form button {
    display: inline-block;
  }

  /** Top Header **/
    nav, form {
      align-items: center;
      flex-wrap: wrap;
      display: flex;
      grid-gap: 10px;
    }

    nav {
      $padding: 15px;

      width: calc(100vw - (#{$padding} * 2));
      border-bottom: 1px solid #dadada;
      padding: 15px;

      > :last-child {
        margin-right: 0;
      }
    }

    nav {
      grid-row: 1;
      grid-column-start: 1;
      grid-column-end: 4;
      height: auto;
      grid-gap: 10px;

      flex-direction: row;

      display: flex;

      p { display: none; }

      hr {
        display: none;
      }

      form {
        display: flex;
      }
    }
</style>
