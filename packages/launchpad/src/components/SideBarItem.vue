<template>
  <div class="relative mt-3 min-w-25px cursor-pointer flex items-center justify-center overflow-hidden">
    <!-- Can't do a border-left solution because you need to round the corners. -->
    <span class="absolute -left-7px rounded min-w-10px h-full" :class="{ 'bg-green-300': active }" />
    <Icon :icon="icon" class="pl-0.25rem py-0.25rem min-h-25px min-w-25px w-full h-full" :class="{
      'text-green-300': active
    }"/>
  </div>
</template>

<script lang="ts">
import { Icon } from "@iconify/vue";
import { defineComponent } from "vue";
import { IconType } from '../types'

export default defineComponent({
  props: {
    icon: {
      type: Object as IconType,
      required: true,
    },
    active: Boolean,
  },
  components: {
    Icon,
  },
});
</script>