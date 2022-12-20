<template>
  <div class="flex flex-col my-45px items-center">
    <div class="flex flex-col items-center justify-evenly">
      <div><i-cy-box-open_x48 class="icon-dark-gray-500 icon-light-indigo-100" /></div>
      <div class="flex flex-col mx-[20%] mt-25px mb-20px items-center">
        <div class="font-medium my-5px text-center text-gray-900 text-18px">
          {{ title }}
        </div>
        <div class="font-normal my-5px text-center leading-relaxed text-16px text-gray-600">
          {{ description }}
        </div>
      </div>
      <slot name="cta" />
    </div>
    <div class="flex flex-col my-40px w-full items-center">
      <div class="border-t border-l border-r rounded-t-md bg-gray-50 border-0 border-gray-100 py-20px px-15px w-[75%]">
        <div class="bg-white border rounded-md flex border-gray-100 w-max p-5px text-14px text-gray-700">
          <div><i-cy-status-failed_x12 /></div>
          <div class="mx-1">
            -
          </div>
          <div
            v-if="exampleTestName"
            class="mx-1 pb-1px text-gray-100"
          >
            |
          </div>
          <div
            v-if="exampleTestName"
            class="mx-1 text-14px text-gray-700"
          >
            {{ exampleTestName }}
          </div>
        </div>
      </div>
      <div
        v-for="(row, i) in loadingRows"
        :key="i"
        class="bg-white border flex border-b-0 border-gray-100 py-5 px-17px w-[75%] items-center overflow-hidden last:border-b last:rounded-b-md"
      >
        <div>
          <i-cy-dot-solid_x4 class="icon-light-gray-200" />
        </div>
        <div class="ml-10px">
          <div class="rounded-full bg-gray-50 h-16px w-40px" />
        </div>
        <div class="ml-10px">
          <i-cy-chevron-right_x16 class="icon-dark-gray-200" />
        </div>
        <div class="ml-10px">
          <div
            class="rounded-full bg-gray-50 h-16px"
            :class="row.widthClass"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

defineProps<{
  title: String
  description?: String
  exampleTestName?: String
}>()

const loadingRows = [
  { widthClass: 'w-341px' },
  { widthClass: 'w-407px' },
  { widthClass: 'w-505px' },
]

</script>
