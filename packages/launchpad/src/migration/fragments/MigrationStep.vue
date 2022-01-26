<template>
  <div
    v-if="step"
    :data-cy="`migration-step ${step?.name}`"
    class="border rounded bg-light-50 border-gray-100 mb-4 w-full block
  overflow-hidden hocus-default"
  >
    <ListRowHeader
      :class="{
        'border-b border-b-gray-100 rounded-b-none': step.isCurrentStep,
        'bg-gray-50': !step.isCurrentStep
      }"
      class="cursor-pointer"
      :description="description"
      @click="emit('toggle')"
    >
      <template #icon>
        <i-cy-status-pass-duotone_x24
          v-if="step.isCompleted"
          class="h-24px w-24px"
        />
        <div
          v-else
          class="rounded-full bg-gray-100 h-24px text-center w-24px"
        >
          {{ step.index }}
        </div>
      </template>
      <template #header>
        <span
          class="font-semibold inline-block align-top"
          :class="step.isCurrentStep ? 'text-indigo-600': 'text-gray-600'"
        >
          {{ title }}
        </span>
      </template>
      <template #right>
        <i-cy-chevron-down
          :class="{ 'rotate-180': step.isCurrentStep }"
          class="max-w-16px transform icon-dark-gray-400"
        />
      </template>
    </ListRowHeader>
    <div
      v-if="step.isCurrentStep"
      class="border-b border-b-gray-100 p-24px"
    >
      <slot />
    </div>
    <div
      v-if="step.isCurrentStep"
      class="p-24px"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'
import type { MigrationStepFragment } from '../../generated/graphql'

gql`
fragment MigrationStep on MigrationStep {
  id
  name
  isCurrentStep
  isCompleted
  index
}`

defineProps<{
  step?: MigrationStepFragment,
  title: string,
  description: string,
}>()

const emit = defineEmits(['toggle'])
</script>
