<template>
  <TrackedBanner
    :banner-id="BannerIds.ACI_082022_RECORD"
    :model-value="modelValue"
    data-cy="record-banner"
    status="info"
    :title="t('specPage.banners.record.title')"
    class="mb-16px"
    :icon="RecordIcon"
    dismissible
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <p class="mb-24px">
      {{ t('specPage.banners.record.content') }}
    </p>

    <TerminalPrompt
      :command="recordCommand"
      :project-folder-name="query.data?.value?.currentProject?.title"
      class="bg-white max-w-700px"
    />
  </TrackedBanner>
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import RecordIcon from '~icons/cy/action-record_x16.svg'
import { useI18n } from '@cy/i18n'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from './index'
import { RecordBannerDocument } from '../../generated/graphql'
import { computed } from 'vue'

gql`
query RecordBanner {
  currentProject {
    id
    title
    currentTestingType
    cloudProject {
      __typename
      ... on CloudProject {
        id
        recordKeys {
          id
          key
        }
      }
    }
  }
}
`

withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

const query = useQuery({ query: RecordBannerDocument })

const firstRecordKey = computed(() => {
  return query.data?.value?.currentProject?.cloudProject?.__typename === 'CloudProject' && query.data.value.currentProject.cloudProject.recordKeys?.[0]?.key
    ? query.data.value.currentProject.cloudProject.recordKeys[0].key
    : '<record-key>'
})
const recordCommand = computed(() => {
  const componentFlagOrSpace = query.data?.value?.currentProject?.currentTestingType === 'component' ? ' --component ' : ' '

  return `cypress run${componentFlagOrSpace}--record --key ${firstRecordKey.value}`
})

</script>
