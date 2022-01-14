<template>
  <WizardLayout
    :next=" t('setupPage.install.confirmManualInstall')"
    :can-navigate-forward="true"
    :back-fn="() => emits('navigate', 'selectFramework')"
    :next-fn="confirmInstalled"
    class="max-w-640px"
  >
    <ManualInstall
      v-if="queryData.data.value.wizard.packagesToInstall?.length"
      :gql="queryData.data.value"
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import WizardLayout from './WizardLayout.vue'
import ManualInstall from './ManualInstall.vue'
import { gql } from '@urql/core'
import { InstallDependencies_ScaffoldFilesDocument } from '../generated/graphql'
import type { CurrentStep } from './Wizard.vue'
import { useI18n } from '@cy/i18n'
import { useMutation, useQuery } from '@urql/vue'

gql`
mutation InstallDependencies_scaffoldFiles {
  scaffoldTestingType {
    ...ScaffoldedFiles
  }
}
`

const emits = defineEmits<{
  (event: 'navigate', currentStep: CurrentStep): void
}>()

gql`
fragment ManualInstall on Query {
  wizard {
    packagesToInstall {
      id
      name
      description
      package
    }
  }
  currentProject {
    id
    title
  }
}
`

const query = `
    query {
      wizard {
        packagesToInstall {
          id
          name
          description
          package
        }
      }
    }
  `

const queryData = useQuery({ query })

const { t } = useI18n()
const mutation = useMutation(InstallDependencies_ScaffoldFilesDocument)

const confirmInstalled = () => {
  mutation.executeMutation({})
}

</script>
