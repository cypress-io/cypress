<template>
  <router-view v-slot="{ Component }">
    <!--
      TODO(lachlan): put this back after doing proper cleanup when unmounting the runner page
      keep-alive works fine for Vue but has some weird effects on the React based Reporter
      For now it's way more simple to just unmount and remount the components when changing page.
    -->
    <!-- <keep-alive> -->
    <component :is="Component" />
    <!-- </keep-alive> -->
  </router-view>
</template>

<script lang="ts" setup>

import {
  App_OpenExternalDocument,
} from './generated/graphql'

import { gql, useMutation } from '@urql/vue'

import { addExternalLinkClickListener } from '../../frontend-shared/src/utils/addExternalLinkClickListener'

gql`
mutation App_OpenExternal ($url: String!) {
  openExternal(url: $url)
}
`

const openExternalMutation = useMutation(App_OpenExternalDocument)

addExternalLinkClickListener(openExternalMutation)

</script>
<style>
.reporter {
  position: relative;
  width: 100%;
}
</style>
