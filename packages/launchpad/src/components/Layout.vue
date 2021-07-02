<template>
  <div
    class="
      min-h-screen
      grid grid-cols-launchpad grid-rows-launchpad
      bg-white
      relative
      text-center
    "
  >
    <div
      class="
        border-b
        bg-gray-900
        text-gray-200
        border-gray-700
        flex
        items-center
        justify-center
        text-lg
      "
    >
      <i-clarity-menu-line class="p-3 h-13 w-13"/>
    </div>
    <div
      class="
        border-b
        text-gray-600
        border-gray-200
        flex
        items-center
        text-left
        px-5
        text-sm
      "
    >
      {{ projectTitle }}
    </div>
    <div class="bg-gray-900 text-gray-500 flex flex-col items-center">
      <SideBarItem v-for="i in sideMenuDefinition" :icon="i.icon" :active="!!i.active"/>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import SideBarItem from "./SideBarItem.vue"

export default defineComponent({
  components: {
    SideBarItem
  },
  setup() {
    const projectTitle = "Project title";

    const sideMenuDefinition = [
      {icon:'clarity:dashboard-line'}, 
      {icon:'clarity-terminal-line'}, 
      {icon:'clarity-settings-line', active:true}
    ]

    return { projectTitle, sideMenuDefinition};
  },
});
</script>
