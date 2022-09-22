<template>
  <p class="mb-24px">
    {{ t('specPage.banners.record.content') }}
  </p>
  <TerminalPrompt
    :command="recordCommand"
    :project-folder-name="query.data?.value?.currentProject?.title"
    class="bg-white max-w-900px"
  />
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import { computed } from 'vue'
import { RecordPromptDocument } from '../generated/graphql'

const { t } = useI18n()

gql`
query RecordPrompt {
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

const firstRecordKey = computed(() => {
  return (query.data?.value?.currentProject?.cloudProject?.__typename === 'CloudProject' && query.data?.value?.currentProject.cloudProject.recordKeys?.[0]?.key) ?? '<record-key>'
})

const recordCommand = computed(() => {
  const componentFlagOrSpace = query.data?.value?.currentProject?.currentTestingType === 'component' ? ' --component ' : ' '

  return `npx cypress run${componentFlagOrSpace}--record --key ${firstRecordKey.value}`
})

const query = useQuery({ query: RecordPromptDocument })

</script>
