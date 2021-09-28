<template>
  <div
    v-for="(pkg, index) in props.gql.packagesToInstall ?? []"
    :key="pkg.name"
    class="flex text-left"
    :class="index > 0 ? 'border-t border-t-gray-200' : undefined"
  >
    <div class="p-5">
      <h2 class="text-indigo-600 font-normal">
        {{ pkg.name }}
      </h2>
      <p
        class="text-gray-400 text-sm"
        v-html="pkg.description"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import type { PackagesListFragment } from '../generated/graphql'

gql`
fragment PackagesList on Wizard {
  packagesToInstall {
    id
    name
    description
  }
}
`

const props = defineProps<{
  gql: PackagesListFragment
}>()
</script>
