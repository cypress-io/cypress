<template>
  <SpecPatternModal
    v-if="props.gql.currentProject"
    :show="showSpecPatternModal"
    :gql="props.gql.currentProject"
    @close="showSpecPatternModal = false"
  />
  <CreateSpecCards
    data-cy="create-spec-page-cards"
    :gql="props.gql"
    :generators="filteredGenerators"
    @select="selectSpecCard"
  />

  <div class="border-t mt-[32px] text-center pt-[32px]">
    <p
      data-cy="no-specs-message"
      class="leading-normal mb-[16px] text-gray-600 text-[16px]"
    >
      {{ t('createSpec.noSpecsMessage') }}
    </p>
    <Button
      data-cy="view-spec-pattern"
      variant="outline"
      prefix-icon-class="icon-light-gray-50 icon-dark-gray-400"
      :prefix-icon="SettingsIcon"
      class="mx-auto duration-300 hocus:ring-gray-50 hocus:border-gray-200"
      @click="showSpecPatternModal = true"
    >
      {{ t('createSpec.viewSpecPatternButton') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from '@cy/i18n'
import SettingsIcon from '~icons/cy/settings_x16'
import Button from '@cy/components/Button.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { gql } from '@urql/vue'
import type { CreateSpecContentFragment } from '../generated/graphql'
import SpecPatternModal from '../components/SpecPatternModal.vue'
import { getFilteredGeneratorList } from './generators'

const { t } = useI18n()

gql`
fragment CreateSpecContent on Query {
  ...CreateSpecCards
  currentProject {
    id
    codeGenGlobs {
      id
      component
    }
    ...SpecPatternModal
  }
}
`

const props = defineProps<{
  gql: CreateSpecContentFragment
}>()

const filteredGenerators = getFilteredGeneratorList(props.gql.currentProject)

const emit = defineEmits<{
  (e: 'showCreateSpecModal', id: string): void
}>()

const selectSpecCard = (id: string) => {
  emit('showCreateSpecModal', id)
}

const showSpecPatternModal = ref(false)
</script>
