<template>
  <li data-cy="dep" class="bg-blue-50 p-4">
    <p class="flex justify-between pb-2">
      <div class="text-md font-bold">
        {{ dependency.packageName }}
      </div>
      <a class="underline text-blue-800 text-sm">
        Learn more
      </a>
    </p>
    <p class="text-md">
      {{ dependency.description }}
    </p>
  </li>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Dependency } from '../supportedFrameworks'

export default defineComponent({
  props: {
    dependency: {
      type: Object as PropType<Dependency>,
      required: true
    }
  },
})
</script>