<script lang="ts" setup>
import { ref, useSlots } from 'vue'
import PrismJs from 'vue-prism-component'
import 'prismjs'
import '@packages/frontend-shared/src/styles/prism.scss'
import IconPass from '../../icons/duo/pass.svg?component'
import IconWarn from '../../icons/duo/warn.svg?component'
import IconCaret from '../../icons/dropcaret.svg?component'

const props = defineProps<{
    status: 'changes' | 'valid'
    filePath: string
    language: 'js' | 'ts'
    content: string
    description?: string
    warningContents?: string
    warningDocsLink?: string
}>()

const slots = useSlots()

const open = ref(false)

</script>
<template>
  <div class="border border-gray-200 rounded mb-4 cursor-pointer">
    <div
      class="py-3 flex cursor-pointer"
      @click="open = !open"
    >
      <div class="px-5 border-r border-r-gray-200 flex items-center">
        <IconPass v-if="status === 'valid'" />
        <IconWarn v-if="status === 'changes'" />
      </div>
      <div class="px-3 flex-grow">
        <p class="text-indigo-700">
          {{ filePath }}
        </p>
        <p class="text-gray-500 text-sm">
          {{ description }}
        </p>
      </div>
      <div
        class="px-4 flex items-center"
      >
        <IconCaret />
      </div>
    </div>
    <div
      v-if="slots.warningContents"
      class="border-t border-gray-200 bg-warning-100 text-warning-700 text-sm py-2 px-3"
      :class="open ? 'block': 'hidden'"
    >
      <slot name="warningContents" />
    </div>
    <div
      class="border-t border-gray-200 p-3 pt-4 overflow-auto"
      :class="open ? 'block': 'hidden'"
    >
      <PrismJs :language="language">
        {{ content }}
      </PrismJs>
    </div>
  </div>
</template>
