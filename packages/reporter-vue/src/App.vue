<template>
  <main class="max-w-800 w-80% p-8">
    <header class="m-0-auto">
    <img class="max-w-280px m-0-auto p-4" alt="Cypress Logo" src="./assets/cypress-logo.png" />
    <h1 class="text-center text-2xl font-weight-light">Reporter Playground</h1>
    <hr class="mt-4"/>
  </header>
  <article class="pt-4">
  <h2 class="text-lg font-weight-light">Tools</h2>
    <p><strong>Build: </strong>Rollup w/ Vite</p>
    <p><strong>Framework: </strong>Vue 3</p>
    <p><strong>CSS:</strong> WindiCSS</p>
    <p><strong>Icons:</strong> Iconify</p>
    <h2 class="text-lg font-weight-light">Testing</h2>

    Tests are written with Cypress component testing and launched via <code>yarn cypress:open</code>.
  </article>
  </main>
</template>

<style scoped lang="scss">
main {
  p {
    margin: 0.2rem 0;
  }

  h2, h1 {
    margin: 1.2rem 0 0.5rem;
  }
}
</style>