<template>
  <nav>
    <h3>{{ clues[0].direction }}</h3>
    <slot></slot>
    <ul>
      <li v-for="clue in clues">
        <span @click="$emit('clue-selected', clue)" v-html="clue.text"/>
      </li>
    </ul>
  </nav>

</template>

<script>
  import { mapActions } from 'vuex'

  export default {
    props: ['clues'],
  }
</script>

<style lang="scss" scoped>
  nav {
    position: relative;
    overflow: scroll;
    border-right: 1px solid #dadada;
    border-left: 1px solid #dadada;

    text-align: left;
  }

  h3 {
    text-transform: uppercase;
    text-align: center;
  }

  ul h3, ul, li {
    margin-block-end: 0;
    margin-block-start: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;
    padding-inline-start: 0;
    padding-inline-end: 0;
  }
  ul {
    /*display: flex;*/
    list-style-type: none;
    text-align: left;
    li {
      font-size: 1rem;
    }
  }
</style>
