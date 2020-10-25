<template>
  <div>
    <h1>{{ docgen.displayName }}</h1>
    <blockquote><em>{{ docgen.description }}</em></blockquote>
    <Props v-for="(section, key) in sections" :props="section" :header="key">
      <template #header="{ header }"><h3>{{ header }}</h3></template>
    </Props>
  </div>
</template>

<script>
  import Props from './Props'
  export default {
    components: { Props },
    props: {
      docgen: { type: Object, required: true }
    },
    computed: {
      sections() {
        const { props, slots, events } = this.docgen
        return { props, slots, events }
      }
    }
  }
</script>

<style scoped>
  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.1rem;
  }

  h3 {
    font-size: 1rem;
  }

  blockquote {
    background: #f9f9f9;
    border-left: 10px solid #ccc;
    margin: 1.5em 10px;
    padding: 0.5em 10px;
    quotes: "\201C""\201D""\2018""\2019";
  }
  blockquote:before {
    color: #ccc;
    content: open-quote;
    font-size: 4em;
    line-height: 0.1em;
    margin-right: 0.25em;
    vertical-align: -0.4em;
  }
  blockquote p {
    display: inline;
  }
</style>
