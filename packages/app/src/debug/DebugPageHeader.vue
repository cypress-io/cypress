<template>
  <div
    data-cy="debug"
    class="flex flex-col pb-24px gap-16px"
  >
    <div
      :data-cy="`debug-header-${run.id}`"
      class="w-full px-24px block overflow-hidden flex items-center border border-color-red gap-y-8"
    >
      <div
        :data-cy="'header-top'"
        class="flex flex-row self-stretch items-center gap-x-2"
      >
        <span
          class="font-medium text-lg text-gray-900"
        >
          {{ test.name }}
        </span>
        <div class="flex flex-row justify-center items-center border rounded border-gray-100">
          <span
            class=" text-sm font-medium text-gray-700 border-r-1px"
          >
            Run #468
          </span>
          <span
            class="font-normal text-sm text-orange-500"
          >
            You are 2 commits ahead
          </span>
        </div>
      </div>
      <div
        :data-cy="'metadata'"
        class="flex flex-row gap-x-2 items-center"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'

const run = computed(() => {
  return ({ id: 1, url: 'something.cypress.com' })
})

const test = computed(() => {
  return ({ name: 'Adding a hover state to the button component' })
})

</script>
