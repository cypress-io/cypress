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
      <i-clarity-dashboard-line class="mt-3 p-3 h-13 w-13" />
      <i-clarity-terminal-line class="mt-3 p-3 h-13 w-13"/>
      <i-clarity-settings-line class="mt-3 p-3 h-13 w-13"/>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  setup() {
    const projectTitle = "Project title";

    return { projectTitle };
  },
});
</script>
