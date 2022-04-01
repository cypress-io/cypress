<template>
  <WizardLayout
    :next="canNavigateForward ? t('setupPage.step.continue') : t('setupPage.install.waitForInstall')"
    :can-navigate-forward="canNavigateForward"
    :back-fn="props.backFn"
    :next-fn="confirmInstalled"
    class="max-w-640px relative"
    :main-button-variant="canNavigateForward ? 'primary' : 'pending'"
    :skip-fn="!canNavigateForward ? confirmInstalled : undefined"
  >
    <ManualInstall
      :gql="props.gql"
      :packages-installed="packagesInstalled"
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import WizardLayout from './WizardLayout.vue'
import ManualInstall from './ManualInstall.vue'
import { gql } from '@urql/core'
import type { InstallDependenciesFragment } from '../generated/graphql'
import {
  InstallDependencies_ScaffoldFilesDocument,
  Wizard_InstalledPackagesDocument,
} from '../generated/graphql'
import { useI18n } from '@cy/i18n'
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
query Wizard_InstalledPackages{
  ...Wizard_InstalledPackages_Data
}`

const queryInstalled = useQuery({
  query: Wizard_InstalledPackagesDocument,
})

const packagesInstalled = ref<string[]>([])

const toInstall = computed(() => {
  return props.gql.wizard.packagesToInstall?.map((p) => p.package)
})

// TODO: UNIFY-1350 convert this to a subscription
// const intervalQueryTrigger = useIntervalFn(async () => {
//   const res = await queryInstalled.executeQuery({ requestPolicy: 'network-only' })

//   packagesInstalled.value = res.data?.value?.wizard?.installedPackages?.map(
//     (pkg) => pkg,
//   ) || []

//   if (toInstall.value?.every((pkg) => packagesInstalled.value.includes(pkg))) {
//     intervalQueryTrigger.pause()
//     canNavigateForward.value = true
//   }
// }, 1000, {
//   immediate: true,
// })

const canNavigateForward = ref(false)

const props = defineProps<{
  gql: InstallDependenciesFragment
  backFn: () => void
}>()

const { t } = useI18n()
const mutation = useMutation(InstallDependencies_ScaffoldFilesDocument)

const confirmInstalled = () => {
  mutation.executeMutation({})
}

</script>
