<template>
  <div>
    <p>
      Time to install dependencies.
      You need these ones:

      <ul class="list-disc list-inside">
        <li>Webpack dev server</li>
        <li>@cypress/react</li>
      </ul>

    </p>

    <p>
      Just run <code>npm install @cypress/react @cypress/wepback-dev-server 
      and you are ready to go!</code>
    </p>
  </div>
</template>

<script lang="ts">
import { defineWizardStep } from '../wizards/shared'

export default defineWizardStep({})
</script>