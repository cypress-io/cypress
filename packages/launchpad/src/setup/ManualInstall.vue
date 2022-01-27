<template>
  <TerminalPrompt
    class="m-24px"
    :command="installDependenciesCode"
    :project-folder-name="projectFolder"
  />
  <div class="border-t border-t-gray-100 px-24px">
    <ul>
      <li
        v-for="dep in props.gql.wizard.packagesToInstall"
        :key="dep.id"
        class="border-b border-b-gray-100 py-16px last-of-type:border-b-0"
      >
        <ExternalLink
          :href="`https://www.npmjs.com/package/${dep.package}`"
          class="text-indigo-500 text-14px hocus-link-default"
        >
          {{ dep.package }}
        </ExternalLink>
        <p
          class="text-gray-500 text-14px leading-5"
          v-html="dep.description"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useQuery } from '@urql/vue'
import { gql } from '@urql/core'
import { useIntervalFn } from '@vueuse/shared'
import TerminalPrompt from '@cy/components/TerminalPrompt.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { ManualInstallFragment, Wizard_InstalledPackagesDocument } from '../generated/graphql'

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

gql`
query Wizard_InstalledPackages{
  wizard {
    installedPackages
  }
}`

const queryInstalled = useQuery({
  query: Wizard_InstalledPackagesDocument,
  requestPolicy: 'network-only',
})

const packagesInstalled = ref<string[]>([])

const emit = defineEmits<{
  (event: 'all-packages-installed'): void
}>()

useIntervalFn(async () => {
  const res = await queryInstalled.executeQuery({})

  packagesInstalled.value = res.data?.value?.wizard?.installedPackages?.map(
    (pkg) => pkg,
  ) || []

  if (!toInstall.value?.filter((p) => !packagesInstalled.value.includes(p.package)).length) {
    queryInstalled.pause()
    emit('all-packages-installed')
  }
}, 500)

const projectFolder = computed(() => props.gql.currentProject?.title ?? '')

const props = defineProps<{
  gql: ManualInstallFragment
}>()

const toInstall = computed(() => {
  return props.gql.wizard.packagesToInstall
})

const installDependenciesCode = computed(
  () => {
    return `yarn add -D ${
    (toInstall.value ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')}`
  },
)
</script>
