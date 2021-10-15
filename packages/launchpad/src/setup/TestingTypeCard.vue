<template>
  <div
    class="relative flex flex-col w-full border border-gray-100 rounded p-30px text text-body-gray-500 hocus-default"
    tabindex="0"
  >
    <div class="h-152px mb-24px">
      <img
        :src="image"
        :alt="''"
      >
    </div>
    <h2 class="mt-4 text-primary text-18px">
      {{ title }}
    </h2>
    <p
      class="mt-3 text-sm mb-60px"
      v-html="description"
    />
    <div class="absolute left-0 right-0 flex justify-between bottom-30px px-30px text-14px">
      <span
        v-if="configured"
        class="flex items-center border rounded-full pl-8px pr-16px py-8px text-jade-500"
      >
        <GrommetIcon class="fill-current stroke-current text-jade-500" />
        {{ t('setupPage.testingCard.configured') }}
      </span>
      <span
        v-else
        class="flex items-center border rounded-full pl-8px pr-16px py-8px"
      >
        <GrommetIcon />
        {{ t('setupPage.testingCard.notConfigured') }}
      </span>
      <button
        class="flex items-center justify-center border border-gray-100 rounded-full text-body-gray-400 w-32px h-32px group hocus-default focus:outline-transparent"
        :aria-label="t('welcomePage.review')"
        @click.stop="$emit('openCompare')"
      >
        <i-cy-question-mark_x16
          class="icon-dark-gray-400 group-hocus:icon-dark-indigo-300 w-18px h-18px"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import type { TestingTypeEnum } from '../generated/graphql'
import { TestingTypeIcons } from '../utils/icons'
import GrommetIcon from '@packages/frontend-shared/src/assets/icons/grommet.svg'

const { t } = useI18n()

const props = defineProps<{
  id: TestingTypeEnum
  title: string
  description: string
  image: string
  configured: boolean
}>()

const icon = TestingTypeIcons[props.id]

defineEmits<{
  (event: 'openCompare'): void
}>()
</script>
