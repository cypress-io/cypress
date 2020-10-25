<template>
  <section id="specs">
    <h2>Spec Files</h2>
    <p v-for="spec in specs">{{ spec }}</p>
    <button @click="runAllSpecs" class="button -blue center run-all">Run All</button>
  </section>
</template>

<script>
  export default {
    props: [ 'specs' ],
    methods: {
      runAllSpecs() { window.runAllSpecs() }
    }
  }
</script>
