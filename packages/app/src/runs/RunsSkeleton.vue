<template>
  <div
    data-cy="runs-loader"
  >
    <div
      v-for="i in numberOfLines"
      :key="i"
      class="mb-4"
    >
      <ListRowHeader
        disabled
        class="border border-gray-100"
      >
        <template #icon>
          <div class="h-[20px] w-[20px] bg-gray-100 rounded-xl mx-[2px]" />
        </template>
        <template #header>
          <div class="w-[256px] rounded-xl h-[16px] bg-gray-50 my-[4px]" />
        </template>
        <template #description>
          <div
            v-for="j in 4"
            :key="j"
            class="rounded-lg h-[8px] bg-gray-50 mr-[20px] inline-block"
            :class="j === 4 ? 'w-[64px]' : 'w-[80px]'"
          />
        </template>
        <template #right>
          <div
            v-if="i >= 2"
            class="rounded-lg h-[16px] bg-gray-50 w-[216px]"
          />
        </template>
      </ListRowHeader>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ListRowHeader from '@cy/components/ListRowHeader.vue'

const numberOfLines = 20
</script>
