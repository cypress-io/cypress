<template>
  <div
    data-cy="debug-loading"
    class="p-[30px]"
  >
    <div>
      <div class="flex items-center">
        <div class="rounded-full bg-gray-50 h-[16px] w-[344px]" />
        <DebugLoadingDivider />
        <div class="rounded-full bg-gray-50 h-[8px] ml-[8px] w-[120px]" />
      </div>

      <div class="flex mt-[15px] items-center">
        <div class="rounded-full bg-gray-50 h-[16px] w-[72px]" />
        <div class="rounded-full bg-gray-50 h-[16px] ml-[8px] w-[160px]" />
        <div class="rounded-full bg-gray-50 h-[16px] ml-[8px] w-[72px]" />
        <template
          v-for="n in 4"
          :key="n"
        >
          <DebugLoadingDivider />
          <div class="rounded-full bg-gray-50 h-[8px] ml-[8px] w-[80px]" />
        </template>
      </div>
    </div>
    <div class="mt-[24px]">
      <DebugTestLoadingContainer
        width-class="w-full"
        dot-class="icon-light-gray-50"
        :rows="[['w-[200px]', 'w-[200px]'], ['w-[200px]', 'w-[200px]'], ['w-[200px]', 'w-[200px]']]"
      >
        <template #header>
          <div class="flex items center justify-between">
            <div>
              <div class="flex items-center">
                <i-cy-dot-solid_x4 class="icon-light-gray-100" />
                <div class="rounded-full bg-gray-100 h-[16px] ml-[8px] w-[200px]" />
              </div>
              <div class="flex mt-[20px] items-center">
                <div class="rounded-full bg-gray-100 h-[8px] w-[180px]" />
                <DebugLoadingDivider />

                <div class="rounded-full bg-gray-100 h-[8px] ml-[8px] w-[99px]" />
                <DebugLoadingDivider />
                <div class="rounded-full bg-gray-100 h-[8px] ml-[8px] w-[99px]" />
              </div>
            </div>
            <div class="mt-[12px]">
              <div class="rounded-full bg-gray-100 h-[20px] w-[120px]" />
            </div>
          </div>
        </template>
      </DebugTestLoadingContainer>
    </div>
    <div class="mt-[24px]">
      <DebugTestLoadingContainer
        width-class="w-full"
        dot-class="icon-light-gray-50"
        :rows="[['w-[200px]', 'w-[200px]'], ['w-[200px]', 'w-[200px]']]"
      >
        <template #header>
          <div class="flex items center justify-between">
            <div>
              <div class="flex items-center">
                <i-cy-dot-solid_x4 class="icon-light-gray-100" />
                <div class="rounded-full bg-gray-100 h-[16px] ml-[8px] w-[200px]" />
              </div>
              <div class="flex mt-[20px] items-center">
                <div class="rounded-full bg-gray-100 h-[8px] w-[180px]" />
                <DebugLoadingDivider />
                <div class="rounded-full bg-gray-100 h-[8px] ml-[8px] w-[99px]" />
                <DebugLoadingDivider />
                <div class="rounded-full bg-gray-100 h-[8px] ml-[8px] w-[99px]" />
              </div>
            </div>
            <div class="mt-[12px]">
              <div class="rounded-full bg-gray-100 h-[20px] w-[120px]" />
            </div>
          </div>
        </template>
      </DebugTestLoadingContainer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DebugLoadingDivider from './DebugLoadingDivider.vue'
import DebugTestLoadingContainer from './DebugTestLoadingContainer.vue'

</script>
