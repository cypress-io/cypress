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
        v-if="(result.value && result.name === 'browser-groups')"
        class="flex inline-flex items-center"
      >
        <LayeredBrowserIcon
          :order="result.icon"
        />
        <span class="sr-only">{{ result.name }}</span>
        {{ result.value }}
      </span>
      <span
        v-else-if="(result.value && result.name !== 'browser-groups')"
        class="flex inline-flex items-center"
      >
        <component
          :is="result.icon"
          class="mr-8px"
          stroke-color="gray-500"
          fill-color="gray-100"
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
import { IconTimeStopwatch,
  IconBrowserChrome,
  IconBrowserChromeCanary,
  IconBrowserSafari,
  IconBrowserMozillaFirefox,
  IconBrowserEdge,
  IconBrowserWebkit,
  IconBrowserElectronLight,
  IconOsLinux,
  IconOsApple,
  IconOsGeneric,
  IconOsWindows,
  IconTestingTypeComponent,
  IconTestingTypeE2E,
  IconTechnologyServer,
} from '@cypress-design/vue-icon'

import LayeredBrowserIcon from './LayeredBrowserIcons.vue'

type StatType = 'DURATION' | 'OS' | 'BROWSER' | 'TESTING' | 'G_OS' | 'GROUPS' | 'G_BROWSERS' | 'STAGING'

interface MetadataProps {
  order?: StatType[]
  specDuration?: string | SpecDataAggregate
  testing?: 'e2e' | 'component'
  groups?: CloudRunGroup[]
  staging?: string
}

const props = defineProps<MetadataProps>()

const results = computed(() => {
  if (props.order) {
    return props.order.map((status) => ORDER_MAP[status])
  }

  return []
})

type BrowserType = 'CHROME' | 'SAFARI' | 'FIREFOX' | 'CHROME-CANARY' | 'EDGE' | 'WEBKIT' | 'ELECTRON'
type OSType = 'LINUX' | 'APPLE' | 'WINDOWS' | 'GROUP'
type TestingType = 'e2e' | 'component'

interface Metadata {
  value: number | string | null | SpecDataAggregate
  icon: any
  name: string
}

const BROWSER_MAP: Record<BrowserType, any> = {
  'CHROME': { icon: IconBrowserChrome },
  'CHROME-CANARY': { icon: IconBrowserChromeCanary },
  'SAFARI': { icon: IconBrowserSafari },
  'FIREFOX': { icon: IconBrowserMozillaFirefox },
  'EDGE': { icon: IconBrowserEdge },
  'WEBKIT': { icon: IconBrowserWebkit },
  'ELECTRON': { icon: IconBrowserElectronLight },
}

const OS_MAP: Record<OSType, any> = {
  'LINUX': IconOsLinux,
  'APPLE': IconOsApple,
  'WINDOWS': IconOsWindows,
  'GROUP': IconOsGeneric,
}

const TESTING_MAP: Record<TestingType, any> = {
  'e2e': { icon: IconTestingTypeE2E, text: 'E2E' },
  'component': { icon: IconTestingTypeComponent, text: 'component' },
}

const browserMapping = computed(() => {
  const acc: string[] = []

  props.groups?.forEach((group) => {
    acc.push(group.browser.formattedName!.toUpperCase())
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
    value: props.groups![0].os.nameWithVersion!,
    icon: OS_MAP[props.groups![0].os.name!.toUpperCase()],
    name: 'operating-system',
  },
  'BROWSER': {
    value: props.groups![0].browser.formattedNameWithVersion!,
    icon: BROWSER_MAP[props.groups![0].browser.formattedName!.toUpperCase()]['icon'],
    name: 'browser',
  },
  'TESTING': {
    value: TESTING_MAP[props.testing!]['text'],
    icon: TESTING_MAP[props.testing!]['icon'],
    name: 'testing-type',
  },
  'GROUPS': {
    value: `${props.groups!.length } groups`,
    icon: IconTechnologyServer,
    name: 'group-server',
  },
  'G_OS': {
    value: `${props.groups!.length } operating systems`,
    icon: OS_MAP['GROUP'],
    name: 'operating-system-groups',
  },
  'G_BROWSERS': {
    value: `${props.groups!.length } browsers`,
    icon: browserMapping.value,
    name: 'browser-groups',
  },
  'STAGING': {
    value: props.staging!,
    icon: IconTechnologyServer,
    name: 'staging',
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
