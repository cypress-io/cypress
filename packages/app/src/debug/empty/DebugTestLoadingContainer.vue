<template>
  <div
    class="border-t border-l border-r rounded-t-md bg-gray-50 border-0 border-gray-100 p-[16px]"
    :class="widthClass"
  >
    <slot name="header" />
  </div>
  <div
    v-for="(row, i) in rows"
    :key="i"
    class="bg-white border flex border-b-0 border-gray-100 p-[16px] items-center overflow-hidden last:border-b last:rounded-b-md"
    :class="widthClass"
  >
    <div>
      <i-cy-dot-solid_x4 :class="dotClass" />
    </div>
    <div
      class="ml-[10px]"
      :class="row[0]"
    >
      <div class="rounded-full bg-gray-50 h-[16px] w-full" />
    </div>
    <div class="ml-[10px]">
      <i-cy-chevron-right_x16 class="icon-dark-gray-200" />
    </div>
    <div
      class="ml-[10px]"
      :class="row[1]"
    >
      <div
        class="rounded-full bg-gray-50 h-[16px] w-full"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>

defineProps<{
  widthClass: string
  dotClass: string
  rows: Array<string[]>
}>()

</script>
