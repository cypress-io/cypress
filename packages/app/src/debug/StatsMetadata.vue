<template>
  <ul
    data-cy="stats-metadata"
    class="flex flex-row items-center gap-x-3 text-gray-700 whitespace-nowrap children:flex children:items-center font-normal text-sm w-full"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      :data-cy="`metaData-Results-${result.name}`"
    >
      <span
        v-if="result.value"
        class="flex inline-flex items-center"
      >
        <component
          :is="result.icon"
          class="mr-9px"
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
  IconTechnologyCypress,
  IconTestingTypeComponent,
  IconTestingTypeE2E,
  IconTechnologyCodeEditor,
  IconTechnologyBrowserDark,
  IconSocialYoutubeSolid,
  IconSocialFacebookSolid,
  IconTechnologyServer,
} from '@cypress-design/vue-icon'

type StatType = 'DURATION' | 'OS' | 'BROWSER' | 'TESTING' | 'G_OS' | 'GROUPS' | 'G_BROWSERS'

interface MetadataProps {
  order?: StatType[]
  specDuration?: string | SpecDataAggregate
  testing?: 'e2e' | 'component'
  groups?: CloudRunGroup[]
}

const props = defineProps<MetadataProps>()

const results = computed(() => {
  if (props.order) {
    return props.order.map((status) => ORDER_MAP[status])
  }

  return []
})

type BrowserType = 'CHROME' | 'SAFARI' | 'FIREFOX' | 'GROUP'
type OSType = 'LINUX' | 'UNIX' | 'GROUP'
type TestingType = 'e2e' | 'component'

interface Metadata {
  value: number | string | null | SpecDataAggregate
  icon: any
  name: string
}

const BROWSER_MAP: Record<BrowserType, any> = {
  'CHROME': { icon: IconTechnologyCypress, text: 'Chrome 106' },
  'SAFARI': { icon: IconTechnologyCodeEditor, text: 'Safari' },
  'FIREFOX': { icon: IconTechnologyBrowserDark, text: 'Mozilla Firefoz 109' },
  'GROUP': { text: ' browsers' },
}

const OS_MAP: Record<OSType, any> = {
  'LINUX': { icon: IconSocialYoutubeSolid, text: 'Linux Debian' },
  'UNIX': { icon: IconSocialFacebookSolid, text: 'Unix' },
  'GROUP': { icon: IconTechnologyCypress, text: ' operating systems' },
}

const TESTING_MAP: Record<TestingType, any> = {
  'e2e': { icon: IconTestingTypeE2E, text: 'E2E' },
  'component': { icon: IconTestingTypeComponent, text: 'component' },
}

const ORDER_MAP: Record<StatType, Metadata> = {
  'DURATION': {
    value: props.specDuration!,
    icon: IconTimeStopwatch,
    name: 'spec-duration',
  },
  'OS': {
    value: OS_MAP[props.groups![0].os.name!.toUpperCase()]['text'],
    icon: OS_MAP[props.groups![0].os.name!.toUpperCase()]['icon'],
    name: 'operating-system',
  },
  'BROWSER': {
    value: BROWSER_MAP[props.groups![0].browser.formattedName!.toUpperCase()]['text'],
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
    value: props.groups!.length + OS_MAP['GROUP']['text'],
    icon: OS_MAP['GROUP']['icon'],
    name: 'operating-system-groups',
  },
  'G_BROWSERS': {
    value: props.groups!.length + BROWSER_MAP['GROUP']['text'],
    icon: OS_MAP['LINUX']['icon'],
    name: 'browser-groups',
  },
}

// default props if nothing is passed in: need to be figured out
// change all the group icons e.g. G_OS G_BROWSERS

</script>
<style scoped>
[data-cy=stats-metadata] li::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
