clear
<template>
  <div
    data-cy="debug-spec-col"
    class="flex flex-col mb-24px grid px-24px gap-24px self-stretch"
  >
    <DebugSpec
      v-for="spec in specs"
      :key="spec.spec.id"
      :spec="spec.spec"
      :test-results="spec.tests"
      :testing-type="spec.testingType"
      :groups="spec.groups"
    />
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import { computed } from '@vue/reactivity'
import DebugSpec from './DebugSpec.vue'
import type { CloudDebugSpec } from './utils/DebugMapping'

gql`
fragment DebugSpecListSpec on CloudSpecRun {
  id
  path
  basename
  extension
  shortPath
  groupIds
  testsPassed {
    min
    max
  }
  testsFailed {
    min
    max
  }
  testsPending {
    min
    max
  }
}
`

gql`
fragment DebugSpecListTests on CloudTestResult {
  id
  specId
  title(depth: 2)
  titleParts
  duration
  isFlaky
  testUrl
  thumbprint
  instance {
    id
    status
    groupId
    totalPassed
    totalFailed
    totalPending
    totalSkipped
    totalRunning
    hasStdout
    stdoutUrl
    hasScreenshots
    screenshotsUrl
    hasVideo
    videoUrl
  }
}
`

gql`
fragment DebugSpecListGroups on CloudRunGroup {
  id
  testingType
  groupName
  os {
    id
    name
  }
  browser {
    id
    formattedName
  }
}
`

const props = defineProps<{
  specs: CloudDebugSpec[]
}>()

const specs = computed(() => {
  return props.specs.map((specItem) => {
    const fileName = specItem.spec.basename
    const fileExtension = specItem.spec.extension
    const fileNameWithoutExtension = fileName.replace(fileExtension, '')

    return {
      spec: {
        id: specItem.spec.id,
        path: specItem.spec.path.replace(fileNameWithoutExtension + fileExtension, ''),
        fileName: fileNameWithoutExtension,
        fileExtension,
        fullPath: specItem.spec.path,
      },
      tests: specItem.tests,
      groups: specItem.groups,
      testingType: specItem.testingType,
    }
  })
})

</script>
