<template>
  <div
    v-if="searchTerm || emptySearch"
    data-testid="no-results"
    class="text-center"
  >
    <NoResultsIllustration
      class="mx-auto"
      alt
    />
    <p class="leading-normal text-gray-500 text-[18px]">
      {{ message || t('noResults.defaultMessage') }}
      <span
        v-if="searchTerm"
        class="text-purple-500 truncate"
      >{{ searchTerm }}</span>
    </p>
    <DSButton
      data-cy="no-results-clear"
      class="mx-auto mt-[20px] gap-[8px]"
      size="40"
      variant="outline-light"
      @click="emit('clear')"
    >
      <IconActionDelete stroke-color="gray-400" />
      {{ t('noResults.clearSearch') }}
    </DSButton>
  </div>
</template>

<script setup lang="ts">
import DSButton from '@cypress-design/vue-button'
import { IconActionDelete } from '@cypress-design/vue-icon'
import { useI18n } from '@cy/i18n'
import NoResultsIllustration from '../assets/illustrations/no-results.svg'

defineProps<{
  searchTerm?: string
  message?: string
  emptySearch?: boolean
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const { t } = useI18n()

</script>
