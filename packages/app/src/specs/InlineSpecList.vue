<template>
  <div
    v-if="showList"
    id="inline-spec-list-aria-id"
    class="w-280px"
  >
    <InlineSpecListHeader
      v-model:tab="tab"
      v-model:search="search"
    />
    <div class="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden pt-16px">
      <template v-if="tab === 'file-list'">
        <InlineSpecListRow
          v-for="spec in specs"
          :key="spec.node.id"
          :spec="spec.node"
          :selected="isCurrentSpec(spec)"
        />
      </template>
      <template v-else>
        <div class="text-white">
          FileTree not implemented
        </div>
      </template>
    </div>
  </div>
  <teleport
    v-if="renderTeleport"
    to="#focus-tests-vue-teleport-target"
  >
    <button
      :aria-expanded="showList"
      class="flex items-center hocus:text-gray-200 hocus:bg-transparent"
      aria-controls="inline-spec-list-aria-id"
      :aria-label="t('inlineSpecsList.ariaLabel')"
      @click="showList = !showList"
    >
      <i-cy-menu-expand-right_x16
        class="transform"
        :class="{'rotate-180': showList}"
      />
      <span class="block">{{ t('inlineSpecsList.specs') }}</span>
    </button>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListRow from './InlineSpecListRow.vue'
import { onKeyStroke } from '@vueuse/core'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SpecNode_InlineSpecList on SpecEdge {
  node {
    id
    name
    specType
    absolute
    relative
    baseName
  }
  ...SpecListRow
}
`

gql`
fragment Specs_InlineSpecList on CurrentProject {
  id
  projectRoot
  specs: specs(first: 1000) {
    edges {
      ...SpecNode_InlineSpecList
    }
  }
}
`

const props = defineProps<{
  gql: Specs_InlineSpecListFragment
}>()

const specStore = useSpecStore()

const isCurrentSpec = (spec: SpecNode_InlineSpecListFragment) => {
  return spec.node.relative === specStore.activeSpec?.relative
}

const tab = ref('file-list')
const search = ref('')

const specs = computed(() => {
  if (!search.value) {
    return props.gql.specs?.edges || []
  }

  return (
    props.gql.specs?.edges.filter((edge) => {
      return (
        edge.node.fileName.toLowerCase() +
        edge.node.specFileExtension.toLowerCase()
      ).includes(search.value.toLocaleLowerCase())
    }) || []
  )
})

const renderTeleport = ref(false)
const showList = ref(true)

const teleportInterval = setInterval(() => {
  if (document.querySelector('#focus-tests-vue-teleport-target')) {
    renderTeleport.value = true
    clearInterval(teleportInterval)
  }
}, 200)

onKeyStroke('f', () => {
  showList.value = !showList.value
})

</script>
