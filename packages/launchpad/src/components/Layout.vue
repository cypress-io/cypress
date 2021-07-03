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
    <div class="bg-gray-900 text-gray-500 flex flex-col items-stretch">
      <SideBarItem
        v-for="i in sideMenuDefinition"
        :icon="i.icon"
        :active="!!i.active"
      />
      <div class="flex-grow" />
      <img src="../assets/cypress_s.png" class="m-5 w-7" />
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useStore } from "../store";

import SideBarItem from "./SideBarItem.vue";

export default defineComponent({
  components: {
    SideBarItem,
  },
  setup() {
    const store = useStore();
    const projectTitle = computed(() => store.getState().projectTitle);

    const sideMenuDefinition = [
      { icon: "clarity:dashboard-line" },
      { icon: "clarity-terminal-line" },
      { icon: "clarity-settings-line", active: true },
    ];

    return { projectTitle, sideMenuDefinition };
  },
});
</script>
