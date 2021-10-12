<script lang="ts" setup>
/// <reference types="vite-svg-loader" />

import { computed, ref, useSlots } from 'vue'
import PrismJs from 'vue-prism-component'
import 'prismjs'
import '@packages/frontend-shared/src/styles/prism.scss'
import IconPass from '../../icons/duo/pass.svg?component'
import IconWarn from '../../icons/duo/warn.svg?component'
import IconFail from '../../icons/duo/fail.svg?component'
import IconSkip from '../../icons/duo/skip.svg?component'
import CardForList from '../list/CardForList.vue'
import Button from '@cy/components/Button.vue'
import Badge from '@cy/components/Badge.vue'

const props = defineProps<{
    status: 'changes' | 'valid' | 'skipped' | 'fail'
    filePath: string
    language: 'js' | 'ts'
    content: string
    description?: string
    warning?: {
      description: string,
      docsLink: string
    }
}>()

const open = ref(false)

const statusLabel = computed(() => props.status === 'skipped' ? 'Skipped' : props.status === 'changes' ? 'Changes required' : undefined)
const statusClasses = computed(() => props.status === 'skipped' ? 'skipped' : props.status === 'changes' ? 'warning' : undefined)

</script>
<template>
  <CardForList @click="open = !open">
    <template #icon>
      <IconPass v-if="status === 'valid'" />
      <IconWarn v-if="status === 'changes'" />
      <IconFail v-if="status === 'fail'" />
      <IconSkip v-if="status === 'skipped'" />
    </template>
    <template #header>
      {{ filePath }}
      <Badge
        v-if="statusLabel && statusClasses && !open"
        :label="statusLabel"
        :status="statusClasses"
      />
    </template>
    <template #description>
      {{ description }}
    </template>
    <template
      #warning
    >
      <div
        v-if="warning && open"
        class="border-t border-gray-200 p-3 flex items-center"
        :class="statusClasses"
      >
        <span class="font-semibold">{{ statusLabel }}: </span>
        <p class="flex-grow ml-1">
          {{ warning?.description }}
        </p>
        <Button>Learn more</Button>
      </div>
    </template>
    <template #slider>
      <div
        class="border-t border-gray-200 p-3 pt-4 overflow-auto"
        :class="open ? 'block': 'hidden'"
      >
        <PrismJs :language="language">
          {{ content }}
        </PrismJs>
      </div>
    </template>
  </CardForList>
</template>
