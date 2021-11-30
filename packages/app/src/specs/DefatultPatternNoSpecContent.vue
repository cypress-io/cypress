<template>
  <CreateSpecCards
    data-testid="create-spec-page-cards"
    :gql="props.gql"
    @select="choose"
  />

  <div class="text-center border-t-1 pt-32px mt-32px">
    <p
      data-testid="no-specs-message"
      class="leading-normal text-gray-600 text-16px mb-16px"
    >
      {{ t('createSpec.noSpecsMessage') }}
    </p>
    <Button
      data-testid="view-spec-pattern"
      variant="outline"
      prefix-icon-class="icon-light-gray-50 icon-dark-gray-400"
      :prefix-icon="SettingsIcon"
      class="mx-auto duration-300 hocus:ring-gray-50 hocus:border-gray-200"
      @click.prevent="emit('showCypressConfigInIDE')"
    >
      {{ t('createSpec.viewSpecPatternButton') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { gql } from '@urql/vue'
import type { CreateSpecContentFragment } from '../generated/graphql'
import { useRunnerUiStore } from '../store/runner-ui-store'
const { t } = useI18n()

gql`
fragment CreateSpecContent on Query {
  ...CreateSpecCards
}
`

const props = defineProps<{
  gql: CreateSpecContentFragment
}>()

const emit = defineEmits<{
  (e: 'choose', id: string): void
  (e: 'showCypressConfigInIDE'): void
}>()

const runnerUiStore = useRunnerUiStore()

const choose = (id: string) => {
  emit('choose', id)
}
</script>
