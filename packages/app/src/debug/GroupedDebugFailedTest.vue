<template>
  <div
    v-for="(group, j) in props.groups"
    :key="j"
    class="w-952px flex flex-col flex-start justify-center pl-16px border-gray-100 border-1 rounded mr-16px hover:bg-gray-50"
    data-cy="grouped-row"
  >
    <div
      class="flex flex-start h-12 items-center gap-x-2.5 non-italic text-base text-gray-700 font-normal border-b-gray-100"
      data-cy="test-failed-metadata"
    >
      <StatsMetaData
        :order="['STAGING', 'OS', 'BROWSER']"
        spec-duration="0"
        testing="component"
        :groups="[group]"
        staging="Production"
      />
      <div
        data-cy="debug-artifacts"
        class="flex flex-grow justify-end space-x-4.5 opacity-0 grouped-row-artifacts pr-18px"
      >
        <div
          v-for="(result, i) in debugArtifacts"
          :key="i"
          :data-cy="`artifact--${result.icon}`"
        >
          <DebugArtifacts
            :icon="result.icon"
            :popper-text="result.text"
            :url="result.url"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'
import StatsMetaData from './StatsMetadata.vue'
import DebugArtifacts from './DebugArtifacts.vue'

const props = defineProps<{
  groups: CloudRunGroup[]
  debugArtifacts: {icon: string, text: string, url: string}[]
}>()

</script>
<style scoped>
[data-cy=grouped-row]:hover .grouped-row-artifacts, [data-cy=grouped-row]:focus-within .grouped-row-artifacts {
  opacity: 1 !important;
}

</style>
