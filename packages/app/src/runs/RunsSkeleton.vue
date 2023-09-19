<template>
  <ul
    v-if="isUsingGit"
    data-cy="runsSkeleton-git"
    class="flex flex-col mb-[24px] gap-[16px] relative before:content-[''] before:absolute before:top-[20px] before:bottom-[10px] before:w-[2px] before:border-2 before:border-dashed before:border-l-0 before:border-y-0 before:border-r-gray-100 before:left-[7px]"
  >
    <li
      v-for="i in numberOfLinesGit"
      :key="i"
    >
      <div
        class="flex items-center my-[10px] gap-[8px] children:h-[14px]"
        :class="{ 'mt-0': i === 0 }"
      >
        <div
          class="relative w-[16px] rounded-lg bg-gray-50"
        />
        <div
          class="w-[46px] max-w-[46px] rounded-lg bg-gray-50"
        />
        <div
          class="flex items-center text-gray-50"
        >
          •
        </div>
        <div
          class="w-[240px] max-w-[240px] rounded-lg bg-gray-50"
        />
      </div>
      <ul
        class="relative bg-white border border-gray-100 rounded border-1 overflow-hidden"
      >
        <li
          v-for="j in (i %2 === 0 ? 2 : 1)"
          :key="j"
          class="border-gray-100 [&:not(:last-child)]:border-b w-full block overflow-auto"
        >
          <RunsSkeletonRow />
        </li>
      </ul>
    </li>
  </ul>
  <ul
    v-else
    data-cy="runsSkeleton-default"
    class="relative bg-white border border-gray-100 rounded border-1 overflow-hidden mb-[24px]"
  >
    <li
      v-for="i of numberOfLinesDefault"
      :key="i"
      class="border-gray-100 [&:not(:last-child)]:border-b w-full block overflow-auto"
    >
      <RunsSkeletonRow />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import RunsSkeletonRow from './RunsSkeletonRow.vue'

defineProps<{
  isUsingGit?: boolean
}>()

const numberOfLinesDefault = 7
const numberOfLinesGit = 5
</script>
