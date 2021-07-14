<template>
  <div class="relative mt-3">
    <div v-if="active" class="absolute bg-green-300 w-1 h-full rounded-r" />
    <Icon
      :icon="icon"
      class="block p-3 h-13 w-13 mx-auto"
      :class="active ? 'text-green-300' : undefined"
    />
  </div>
</template>

<script lang="ts">
import { Icon } from "@iconify/vue";
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    icon: String,
    active: Boolean,
  },
  components: {
    Icon,
  },
});
</script>
