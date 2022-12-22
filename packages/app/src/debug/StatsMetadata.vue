<template>
  <ul
    data-cy="stats-metadata"
    class="flex flex-row items-center gap-x-2 text-gray-700 whitespace-nowrap children:flex children:items-center font-normal text-sm w-full"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      :data-cy="`metaData-Results-${result.name}`"
    >
      <span
        v-if="(result.value && (result.name === 'browser' || result.name === 'browser-groups'))"
        class="flex inline-flex items-center"
      >
        <LayeredBrowserIcon
          :order="result.icon"
          :data-cy="`${result.name} ${result.value}`"
        />
        <span class="sr-only">{{ result.name }}</span>
        {{ result.value }}
      </span>
      <span
        v-else-if="result.value"
        class="flex inline-flex items-center"
      >
        <component
          :is="result.icon"
          class="mr-8px"
          stroke-color="gray-500"
          fill-color="gray-100"
          :data-cy="`${result.name} ${result.value}`"
        />
        <span class="sr-only">{{ result.name }}</span>
        {{ result.value }}
      </span>
    </li>
  </ul>
</template>

<script lang="ts" setup>

import { computed } from 'vue'
import type { SpecDataAggregate, CloudRunGroup } from '@packages/data-context/src/gen/graphcache-config.gen'
import type { TestingTypeEnum } from '../generated/graphql'
import { IconTimeStopwatch,
  IconOsLinux,
  IconOsApple,
  IconOsGeneric,
  IconOsWindows,
  IconTestingTypeComponent,
  IconTestingTypeE2E,
  IconTechnologyServer,
} from '@cypress-design/vue-icon'

import LayeredBrowserIcon from './LayeredBrowserIcons.vue'

type StatType = 'DURATION' | 'OS' | 'BROWSER' | 'TESTING' | 'G_OS' | 'GROUPS' | 'G_BROWSERS' | 'GROUP_NAME'

interface MetadataProps {
  order?: StatType[]
  specDuration?: string | number
  testing?: TestingTypeEnum
  groups?: CloudRunGroup[]
  groupName?: string
}

const props = defineProps<MetadataProps>()

interface Metadata {
  value: number | string | null | SpecDataAggregate | TestingTypeEnum
  icon: any
  name: string
}

type OSType = 'LINUX' | 'APPLE' | 'WINDOWS' | 'GROUP'

const OS_MAP: Record<OSType, any> = {
  'LINUX': IconOsLinux,
  'APPLE': IconOsApple,
  'WINDOWS': IconOsWindows,
  'GROUP': IconOsGeneric,
}

const TESTING_MAP: Record<TestingTypeEnum, any> = {
  'e2e': IconTestingTypeE2E,
  'component': IconTestingTypeComponent,
}

const results = computed(() => {
  if (props.order) {
    return props.order.map((status) => ORDER_MAP[status])
  }

  return []
})

const arrMapping = computed(() => {
  const acc: {browser: string[], os: string[], firstBrowser: string, firstOS: string} = { browser: [], os: [], firstBrowser: '', firstOS: '' }
  const uniqueBrowser: Set<string> = new Set()
  const uniqueOS: Set<string> = new Set()

  props.groups!.forEach((group: CloudRunGroup, index) => {
    const formattedName = group.browser.formattedName!.toUpperCase()
    const osName = group.os.name!.toUpperCase()

    if (!uniqueBrowser.has(formattedName)) {
      uniqueBrowser.add(formattedName)
      acc.browser.push(formattedName)
      if (index === 0) acc.firstBrowser = group.browser.formattedNameWithVersion!
    }

    if (!uniqueOS.has(osName)) {
      uniqueOS.add(osName)
      acc.os.push(osName)
      if (index === 0) acc.firstOS = group.os.nameWithVersion!
    }
  })

  return acc
})

const ORDER_MAP: Record<StatType, Metadata> = {
  'DURATION': {
    value: props.specDuration!,
    icon: IconTimeStopwatch,
    name: 'spec-duration',
  },
  'OS': {
    value: arrMapping.value.firstOS,
    icon: OS_MAP[arrMapping.value.os[0]],
    name: 'operating-system',
  },
  'BROWSER': {
    value: arrMapping.value.firstBrowser,
    icon: arrMapping.value.browser,
    name: 'browser',
  },
  'TESTING': {
    value: props.testing!,
    icon: TESTING_MAP[props.testing!],
    name: 'testing-type',
  },
  'GROUPS': {
    value: props.groups!.length > 1 ? `${props.groups!.length} groups` : `${props.groups!.length} group`,
    icon: IconTechnologyServer,
    name: 'group-server',
  },
  'G_OS': {
    value: arrMapping.value.os.length > 1 ? `${arrMapping.value.os.length} operating systems` : `${arrMapping.value.os.length} operating system`,
    icon: OS_MAP['GROUP'],
    name: 'operating-system-groups',
  },
  'G_BROWSERS': {
    value: arrMapping.value.browser.length > 1 ? `${arrMapping.value.browser.length} browsers` : `${arrMapping.value.browser.length} browser`,
    icon: arrMapping.value.browser,
    name: 'browser-groups',
  },
  'GROUP_NAME': {
    value: props.groupName!,
    icon: IconTechnologyServer,
    name: 'group_name',
  },
}

// default props if nothing is passed in: need to be figured out
// change all the group icons e.g. G_OS G_BROWSERS
// metaDataItems
// Fix this so that it does not require all the props to be passed all the time

</script>
<style scoped>
[data-cy=stats-metadata] li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
