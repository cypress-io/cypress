<template>
  <div
    v-if="step"
    :data-cy="`migration-step ${step?.name}`"
    class="border rounded bg-light-50 border-gray-100 mb-4 w-full block"
  >
    <ListRowHeader
      :class="{
        'rounded-b-none default-ring': step.isCurrentStep,
        'bg-gray-50': !step.isCurrentStep
      }"
      class="m-[-1px] w-auto"
      :description="description"
      @click="emit('toggle')"
    >
      <template #icon>
        <i-cy-status-pass-duotone_x24
          v-if="step.isCompleted"
          class="h-[24px] w-[24px]"
        />
        <div
          v-else
          class="rounded-full h-[24px] text-center w-[24px]"
          :class="step.isCurrentStep ? 'bg-indigo-100 text-indigo-600': 'bg-gray-100 text-gray-600'"
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
    </ListRowHeader>
    <div
      v-if="step.isCurrentStep"
      class="border-b border-b-gray-100 p-[24px]"
    >
      <slot />
    </div>
    <div
      v-if="step.isCurrentStep"
      class="p-[24px]"
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
  step?: MigrationStepFragment
  title: string
  description: string
}>()

const emit = defineEmits(['toggle'])
</script>
