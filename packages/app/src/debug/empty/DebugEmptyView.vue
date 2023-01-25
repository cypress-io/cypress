<template>
  <div class="flex flex-col my-45px items-center">
    <div class="flex flex-col items-center justify-evenly">
      <div><i-cy-box-open_x48 class="icon-dark-gray-500 icon-light-indigo-100" /></div>
      <div class="flex flex-col mx-[20%] mt-25px mb-20px items-center">
        <div class="font-medium my-5px text-center text-gray-900 text-18px">
          {{ title }}
        </div>
        <div class="font-normal my-5px text-center leading-relaxed text-16px text-gray-600">
          {{ description }} <ExternalLink
            v-if="helpLinkText && helpLinkHref"
            :href="helpLinkHref"
          >
            {{ helpLinkText }}
          </ExternalLink>
        </div>
      </div>
      <slot name="cta" />
    </div>
    <div class="flex flex-col my-40px w-full items-center">
      <DebugTestLoadingContainer
        width-class="w-[75%]"
        dot-class="icon-light-gray-200"
        :rows="loadingRows"
      >
        <template #header>
          <div class="bg-white border rounded-md flex border-gray-100 w-max p-5px text-14px text-gray-700">
            <div><i-cy-status-failed_x12 /></div>
            <div class="bg-gray-700 h-1px mx-5px mt-7px w-5px" />
            <div
              v-if="exampleTestName"
              class="bg-gray-100 h-13px mx-1 pb-1px w-1px"
            />
            <div
              v-if="exampleTestName"
              class="mx-1 text-14px text-gray-700"
            >
              {{ exampleTestName }}
            </div>
          </div>
        </template>
      </DebugTestLoadingContainer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DebugTestLoadingContainer from './DebugTestLoadingContainer.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'

defineProps<{
  title: string
  description?: string
  exampleTestName?: string
  helpLinkText?: string
  helpLinkHref?: string
}>()

const loadingRows = [
  ['w-40px', 'w-[40%]'],
  ['w-40px', 'w-[50%]'],
  ['w-40px', 'w-[65%]'],
]

</script>
