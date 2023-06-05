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
