<template>
  <div class="flex flex-col my-50px items-center">
    <div class="flex flex-col items-center justify-evenly">
      <div><i-cy-box-open_x48 class="stroke-gray-50" /></div>
      <div class="flex flex-col mx-150px mt-25px mb-20px items-center">
        <div class="font-medium my-5px text-center text-gray-900 text-18px">
          {{ title }}
        </div>
        <div class="font-normal my-5px text-center leading-relaxed text-16px text-gray-600">
          {{ description }}
        </div>
      </div>
      <div><slot name="cta-button" /></div>
    </div>
    <div>
      {{ exampleTestName }}
    </div>
  </div>
</template>

<script lang="ts" setup>

defineProps<{
  title: String
  description?: String
  exampleTestName?: String
}>()

</script>
