<script lang="ts" setup>
import ListRow from '@cy/components/ListRow.vue'
import ProgressCircle from '@cy/components/ProgressCircle.vue'

withDefaults(defineProps<{
  numberOfLines?: number
}>(), {
  numberOfLines: 20,
})
</script>

<template>
  <div class="overflow-y-hidden">
    <ListRow
      v-for="i in numberOfLines"
      :key="i"
      disabled
      class="bg-gray-50"
    >
      <template #icon>
        <ProgressCircle
          v-if="i === 1"
          :progress="25"
          :radius="12"
          :stroke="2"
          class="icon-dark-gray-300 icon-light-gray-100"
        />
        <i-cy-status-failed-solid_x24
          v-else-if="i === 2"
          class="h-24px w-24px icon-dark-gray-100"
        />
        <i-cy-status-errored-solid_x24
          v-else-if="i === 3"
          class="h-24px w-24px icon-dark-gray-100"
        />
        <i-cy-status-passed-solid_x24
          v-else
          class="h-24px w-24px icon-dark-gray-100"
        />
      </template>
      <template #header>
        <div class="w-256px rounded-xl h-16px bg-gray-100 mt-4px" />
      </template>
      <template #description>
        <div
          v-for="j in 4"
          :key="j"
          class="rounded-lg h-8px bg-gray-100 mr-20px inline-block"
          :class="j === 4 ? 'w-64px' : 'w-80px'"
        />
      </template>
      <template #right>
        <div
          v-if="i >= 2"
          class="rounded-lg h-16px bg-gray-100 w-166px"
        />
      </template>
    </ListRow>
  </div>
</template>
