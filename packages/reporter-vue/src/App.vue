<template>
  <main class="max-w-800 w-80% p-8 font-mono">
    <header>
    <img class="max-w-280px pb-10" alt="Cypress Logo" src="./assets/cypress-logo.png" />
    <h1 class=" text-2xl font-weight-light">
      <!-- <IconCheck class="inline text-3xl mb-1"></IconCheck>
      <IconX class="inline text-2xl mb-1"></IconX> -->
      Reporter Playground
      
    </h1>
    <hr class="mt-4"/>
  </header>
  <article class="pt-4">
  <h2 class="text-lg font-weight-light">
  <i-mdi-tools class="text-xl inline"></i-mdi-tools>
  Tools
  </h2>
    <p><strong>Build: </strong>Rollup w/ Vite</p>
    <p><strong>Framework: </strong>Vue 3</p>
    <p><strong>CSS:</strong> WindiCSS</p>
    <p><strong>Icons:</strong> Iconify, currently with the <a href="https://iconify.design/icon-sets/clarity/">Clarity set</a></p>
    
    <h2 class="text-lg font-weight-light hover:text-green-600">
    <i-mdi-flask class="text-xl inline"></i-mdi-flask>
    Testing
    </h2>

    Tests are written with Cypress component testing and launched via <code>yarn cypress:open</code>.
  </article>
  </main>
</template>

<script setup lang="ts">
import IMdiFlask from 'virtual:vite-icons/mdi/flask'
import IMdiTools from 'virtual:vite-icons/mdi/tools'

</script>

<style scoped lang="scss">
main {
  p {
    margin: 0.2rem 0;
  }

  h2, h1 {
    margin: 1.2rem 0 0.5rem;
  }

  a {
    @apply text-blue-600 underline hover:text-blue-400;
  }
}
</style>