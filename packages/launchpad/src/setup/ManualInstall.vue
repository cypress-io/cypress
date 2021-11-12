<template>
  <div class="relative px-24px py-22px">
    <div class="absolute h-38px w-160px bg-gradient-to-r from-transparent to-white via-white right-25px top-25px rounded pointer-events-none" />
    <div class="code-area text-left p-8px text-purple-500 border border-gray-100 rounded flex items-center overflow-x-scroll">
      <i-cy-dollar_x16 class="icon-dark-gray-500 mr-12px" /> <pre><span class="text-14px font-light">{{ dependenciesCode }}</span></pre>
    </div>
    <CopyButton
      :text="dependenciesCode"
      class="top-26px right-28px absolute"
    />
  </div>
  <div class="border-t border-t-gray-100 px-24px">
    <ul>
      <li
        v-for="dep in wizardStore.toInstall"
        :key="dep.package"
        class="py-16px border-b border-b-gray-100 last-of-type:border-b-0"
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
import { computed } from 'vue'
import CopyButton from '@cy/components/CopyButton.vue'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import { useWizardStore } from '../store/wizardStore'

const wizardStore = useWizardStore()

const dependenciesCode = computed(
  () => {
    return `yarn add -D ${
    (wizardStore.toInstall ?? [])
    .map((pack) => `${pack.package}`)
    .join(' ')}`
  },
)
</script>
