<template>
  <div
    class="relative flex flex-col w-full border border-gray-200 rounded p-30px text text-body-gray-500 hocus-default"
    tabindex="0"
  >
    <div class="border h-152px">
      <!-- temp wrapper for icon -->
      <component
        :is="icon"
        class="mx-auto mt-4"
      />
    </div>
    <h2 class="mt-4 text-primary text-18px">
      {{ title }}
    </h2>
    <p
      class="mt-3 text-sm mb-60px"
      v-html="description"
    />
    <div class="absolute left-0 right-0 flex justify-between bottom-30px px-30px">
      <span
        v-if="configured"
        class="flex items-center px-3 py-1 border text-jade-500 rounded-full"
      >
        <GrommetIcon
          class="fill-current stroke-current text-jade-500"
        />
        {{ t('setupPage.testingCard.configured') }}
      </span>
      <span
        v-else
        class="flex items-center px-3 py-1 border rounded-full"
      >
        <GrommetIcon />
        {{ t('setupPage.testingCard.notConfigured') }}
      </span>
      <span class="border rounded-full text-body-gray-400 w-32px h-32px flex items-center justify-center">
        <i-akar-icons-triangle-right class="h-24px w-24px" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import type { TestingTypeEnum } from '../generated/graphql'
import GrommetIcon from '@packages/frontend-shared/src/assets/icons/grommet.svg'
import { TestingTypeIcons } from '../utils/icons'

const { t } = useI18n()

const props = defineProps<{
  id: TestingTypeEnum
  title: string
  description: string
  configured: boolean
}>()

const icon = TestingTypeIcons[props.id]
</script>
