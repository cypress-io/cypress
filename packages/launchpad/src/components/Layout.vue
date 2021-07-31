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
        :key="i.icon"
        v-for="i in sideMenuDefinition"
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
import { computed, defineComponent, PropType } from "vue";
import SideBarItem from "./SideBarItem.vue";
import bottomBackground from '../images/bottom_filler.svg'
import { gql } from "@urql/core";
import { useQuery } from '@urql/vue'
import { LayoutDocument } from "../generated/graphql";
// import { LayoutFragment } from "../generated/graphql";

// TODO: Make this a fragment?
// gql`
// fragment Layout on App {
//   activeProject {
//     title
//   }
// }
// `

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
  // props: {
  //   gql: {
  //     type: Object as PropType<LayoutFragment>,
  //     required: true
  //   }
  // },
  setup() {
    const result = useQuery({
      query: LayoutDocument
    })

    const projectTitle = computed(() => result.data.value?.app.activeProject?.title);

    const sideMenuDefinition = [
      { icon: "clarity:dashboard-line" },
      { icon: "clarity-terminal-line" },
      { icon: "clarity-settings-line", active: true },
    ];

    return { projectTitle, sideMenuDefinition, bottomBackground };
  },
});
</script>
