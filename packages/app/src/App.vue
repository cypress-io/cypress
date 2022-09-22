<template>
  <router-view v-slot="{ Component }">
    <component
      :is="Component"
    />
  </router-view>

  <template v-if="route.name !== 'SpecRunner'">
    <CloudViewerAndProject />
    <LoginConnectModals />
  </template>
</template>

<script setup lang="ts">
import LoginConnectModals from '@cy/gql-components/LoginConnectModals.vue'

import { useRoute } from 'vue-router'
import CloudViewerAndProject from '../../frontend-shared/src/gql-components/CloudViewerAndProject.vue'
const route = useRoute()

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
