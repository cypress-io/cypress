<template>
  <div class="relative p-12px">
    <pre class="p-12px text-left text-purple-500 border rounded"><span>~$</span> {{ dependenciesCode }}</pre>
    <CopyButton
      :text="dependenciesCode"
      class="top-17px right-18px absolute"
    />
  </div>
  <div class="border-t border-t-gray-100 px-24px pt-4px">
    <dl>
      <div
        v-for="dep in props.gql.packagesToInstall"
        :key="dep.id"
        class="py-20px border-b border-b-gray-100 last-of-type:border-b-0"
      >
        <dt class="text-indigo-500 text-14px">
          {{ dep.package }}
        </dt>
        <dd
          class="text-gray-500 text-14px mt-10px leading-5"
          v-html="dep.description"
        />
      </div>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import CopyButton from '@cy/components/CopyButton.vue'
import { gql } from '@urql/core'
import type { ManualInstallFragment } from '../generated/graphql'

gql`
fragment ManualInstall on Wizard {
  packagesToInstall {
    id
    name
    description
    package
  }
}
`

const props = defineProps<{
  gql: ManualInstallFragment
}>()

defineEmits<{(event: 'back'): void
}>()

const dependenciesCode = computed(
  () => {
    return `yarn add -D ${
    (props.gql.packagesToInstall ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')}`
  },
)
</script>
