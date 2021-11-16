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
      <div v-if="tab === 'flat'">
        <InlineSpecListRow
          v-for="spec in specs"
          :key="spec.node.id"
          :spec="spec.node"
          :selected="isCurrentSpec(spec)"
        />
      </div>
      <InlineSpecListTree
        v-else
        :specs="specs.map(spec => spec.node)"
      />
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
import { computed, ref, nextTick, onBeforeUnmount } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListRow from './InlineSpecListRow.vue'
import InlineSpecListTree from './InlineSpecListTree.vue'
import type { SpecViewType } from './SpecsList.vue'
import { onKeyStroke, useMutationObserver } from '@vueuse/core'
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
    specFileExtension
    fileExtension
    fileName
  }
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

const tab = ref<SpecViewType>('flat')
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
let teleportMutuationObserver: MutationObserver | null = null

onKeyStroke('f', () => {
  showList.value = !showList.value
})

const teleportInterval = setInterval(() => {
  const teleportTarget = document.querySelector('#focus-tests-vue-teleport-target')
  const reactVueParent = document.querySelector('#unified-runner-vue-wrapper')

  if (!teleportTarget || !reactVueParent) {
    return
  }

  clearInterval(teleportInterval)
  renderTeleport.value = true
  setUpMutationObserver(teleportTarget, reactVueParent)
}, 200)

/**
This mutation observer allows us to know when the parent of the `teleport`'s target has been
re-rendered or otherwise changed, and if the target is empty, we can trigger re-render
of the `teleport` so that the button is replaced immediately. The reporter re-renders if you edit a test,
which causes the vue button that was rendered there to disappear.
**/
function setUpMutationObserver (teleportTarget: Element, elementToObserve: Element) {
  teleportMutuationObserver = new MutationObserver(() => {
    // run querySelector fresh every time as the node will have been destroyed and recreated
    if (document.querySelector('#focus-tests-vue-teleport-target') && !document.querySelector('#focus-tests-vue-teleport-target')?.children?.length) {
      renderTeleport.value = false
      nextTick(() => {
        renderTeleport.value = true
      })
    }
  })

  teleportMutuationObserver.observe(elementToObserve, { childList: true, subtree: true })
}

onBeforeUnmount(() => {
  teleportMutuationObserver?.disconnect()
})

</script>
