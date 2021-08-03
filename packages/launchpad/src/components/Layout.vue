<template>
  <div
    class="
      min-h-screen
      grid grid-cols-launchpad grid-rows-launchpad
      bg-white
      relative
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
      <i-clarity-menu-line class="p-3 h-13 w-13" />
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
    <div class="bg-gray-900 text-gray-500 flex flex-col items-stretch" :style="`background-image: url('${bottomBackground}');`" style="background-position: bottom center;background-repeat: no-repeat;">
      <SideBarItem
        v-for="(i, idx) in sideMenuDefinition"
        :key="idx"
        class="pr-8px"
        :icon="i.icon"
        :active="!!i.active"
      />
      <div class="flex-grow" />
      <img src="../images/cypress_s.png" class="m-4 mx-auto w-7" />
    </div>
    <div class="flex items-stretch flex-col">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import SideBarItem from "./SideBarItem.vue";
import bottomBackground from '../images/bottom_filler.svg'
import { gql } from "@urql/core";
import { useQuery } from '@urql/vue'
import { LayoutDocument } from "../generated/graphql";
import IconDashboardLine from 'virtual:vite-icons/clarity/dashboard-line'
import IconTerminalLine from 'virtual:vite-icons/clarity/terminal-line'
import IconSettingsLine from 'virtual:vite-icons/clarity/settings-line'

gql`
query Layout {
  app {
    activeProject {
      title
    }
  }
}
`

export default defineComponent({
  components: {
    SideBarItem,
  },
  setup() {
    const result = useQuery({
      query: LayoutDocument
    })

    const projectTitle = computed(() => result.data.value?.app.activeProject?.title);

    const sideMenuDefinition = [
      { icon: IconDashboardLine },
      { icon: IconTerminalLine },
      { icon: IconSettingsLine, active: true },
    ];

    return { projectTitle, sideMenuDefinition, bottomBackground };
  },
});
</script>
