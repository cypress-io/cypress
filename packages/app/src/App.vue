<template>
  <router-view v-slot="{ Component }">
    <component
      :is="Component"
    />
  </router-view>

  <template v-if="!isRunMode">
    <!--
      avoiding graphql in run mode
    -->
    <CloudViewerAndProject />
    <LoginConnectModals />
  </template>
</template>

<script setup lang="ts">
import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'
import LoginConnectModals from '@cy/gql-components/LoginConnectModals.vue'
import CloudViewerAndProject from '@packages/frontend-shared/src/gql-components/CloudViewerAndProject.vue'
</script>

<style lang="scss">
html,
body,
#app {
  @apply bg-white h-full;
}

@font-face {
  font-family: "Fira Code";
  src: local("Fira Code"),
   url('../../frontend-shared/src/assets/fonts/FiraCode-VariableFont_wght.ttf') format("truetype");
}
</style>
