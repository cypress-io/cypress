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
import { onBeforeUnmount } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { App_ShowLaunchpadDocument } from './generated/graphql'

gql`
mutation App_ShowLaunchpad {
  showLaunchpadOnAppExit
}
`

const showLaunchpad = useMutation(App_ShowLaunchpadDocument)

window.addEventListener('beforeunload', () => {
  showLaunchpad.executeMutation({})
})

</script>

<style>
.reporter {
  position: relative;
  width: 100%;
}
</style>
