<template>
  <WizardLayout
    :next="allDependenciesInstalled ? 'Continue' : 'Waiting for you to install the dependencies...'"
    :can-navigate-forward="allDependenciesInstalled"
    :back-fn="props.backFn"
    :next-fn="confirmInstalled"
    class="max-w-[640px] relative"
    :main-button-variant="allDependenciesInstalled ? 'indigo-dark' : 'disabled'"
    :skip-fn="!allDependenciesInstalled ? confirmInstalled : undefined"
  >
    <template
      v-if="allDependenciesInstalled && showSuccessAlert"
      #accessory
    >
      <Alert
        v-model="showSuccessAlert"
        class="w-full"
        :icon="CircleCheck"
        title="You've successfully installed all required dependencies."
        status="success"
        dismissible
      />
    </template>
    <ManualInstall :gql="props.gql" />
  </WizardLayout>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import WizardLayout from './WizardLayout.vue'
import ManualInstall from './ManualInstall.vue'
import Alert from '@cy/components/Alert.vue'
import { gql } from '@urql/core'
import type { InstallDependenciesFragment } from '../generated/graphql'
import CircleCheck from '~icons/cy/circle-check_x16.svg'

import {
  InstallDependencies_ScaffoldFilesDocument,
  Wizard_InstalledPackagesDocument,
} from '../generated/graphql'
import { useMutation, useQuery } from '@urql/vue'
import { useIntervalFn } from '@vueuse/core'

gql`
mutation InstallDependencies_scaffoldFiles {
  scaffoldTestingType {
    ...ScaffoldedFiles
  }
}
`

gql`
fragment InstallDependencies on Query {
  ...ManualInstall
  wizard {
    packagesToInstall {
      id
      package
    }
  }
}
`

gql`
fragment Wizard_InstalledPackages_Data on Query {
  ...InstallDependencies
}
`

gql`
query Wizard_InstalledPackages {
  ...Wizard_InstalledPackages_Data
}`

const queryInstalled = useQuery({
  query: Wizard_InstalledPackagesDocument,
})

const props = defineProps<{
  gql: InstallDependenciesFragment
  backFn: () => void
}>()

const checkForInstalledDependencies = (wizard) => {
  return wizard?.packagesToInstall?.every((pkg) => pkg.satisfied) || false
}

const allDependenciesInstalled = ref(checkForInstalledDependencies(props.gql.wizard))
const showSuccessAlert = ref(true)

if (!allDependenciesInstalled.value) {
  const intervalQueryTrigger = useIntervalFn(async () => {
    const res = await queryInstalled.executeQuery({ requestPolicy: 'network-only' })

    if (checkForInstalledDependencies(res.data.value?.wizard)) {
      intervalQueryTrigger.pause()
      allDependenciesInstalled.value = true
    }
  }, 1000)
}

const mutation = useMutation(InstallDependencies_ScaffoldFilesDocument)

const confirmInstalled = () => {
  mutation.executeMutation({})
}

</script>
