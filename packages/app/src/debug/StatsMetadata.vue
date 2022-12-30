<template>
  <ul
    data-cy="stats-metadata"
    class="contents items-center gap-x-2 text-gray-700 whitespace-nowrap children:flex children:items-center font-normal text-sm w-full stats-metadata-class"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      :data-cy="`metaData-Results-${result.name}`"
      class="py-1"
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
import { useI18n } from '@cy/i18n'
import type { SpecDataAggregate } from '@packages/data-context/src/gen/graphcache-config.gen'
import type { TestingTypeEnum, StatsMetadata_GroupsFragment } from '../generated/graphql'
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
import { gql } from '@urql/vue'
const { t } = useI18n()

gql`
  fragment StatsMetadata_Groups on CloudRunGroup {
    id
    groupName
    browser {
      id
      formattedName
      formattedNameWithVersion
    }
    os {
      id
      name
      nameWithVersion
    }
  }
`

type StatType = 'DURATION' | 'OS' | 'BROWSER' | 'TESTING' | 'G_OS' | 'GROUPS' | 'G_BROWSERS' | 'GROUP_NAME'

interface MetadataProps {
  order?: StatType[]
  specDuration?: string | number
  testing?: TestingTypeEnum
  groups?: StatsMetadata_GroupsFragment[]
  groupName?: string
}

const props = defineProps<MetadataProps>()

interface Metadata {
  value: number | string | null | SpecDataAggregate | TestingTypeEnum | undefined
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
    return props.order.map((status) => ORDER_MAP.value[status])
  }

  return []
})

const arrMapping = computed(() => {
  const acc: {browsers: string[], oses: string[], firstBrowser: string, firstOs: string} = { browsers: [], oses: [], firstBrowser: '', firstOs: '' }
  const uniqueBrowsers = new Set<string>()
  const uniqueOSes = new Set<string>()

  if (props.groups) {
    props.groups.forEach((group: StatsMetadata_GroupsFragment, index) => {
      const browserName = group.browser.formattedName!.toUpperCase()
      const osName = group.os.name!.toUpperCase()

      uniqueBrowsers.add(browserName)
      uniqueOSes.add(osName)
      if (index === 0) {
        acc.firstBrowser = group.browser.formattedNameWithVersion!
        acc.firstOs = group.os.nameWithVersion!
      }
    })
  }

  acc.browsers = Array.from(uniqueBrowsers)
  acc.oses = Array.from(uniqueOSes)

  return acc
})

const ORDER_MAP = computed<Record<StatType, Metadata>>(() => {
  return {
    'DURATION': {
      value: props.specDuration,
      icon: IconTimeStopwatch,
      name: 'spec-duration',
    },
    'OS': {
      value: arrMapping.value.firstOs,
      icon: OS_MAP[arrMapping.value.oses[0]],
      name: 'operating-system',
    },
    'BROWSER': {
      value: arrMapping.value.firstBrowser,
      icon: arrMapping.value.browsers,
      name: 'browser',
    },
    'TESTING': {
      value: props.testing!,
      icon: TESTING_MAP[props.testing!],
      name: 'testing-type',
    },
    'GROUPS': {
      value: props.groups!.length > 1 ? `${props.groups!.length} ${t('debugPage.groups.pluralTitle')}` :
       `${props.groups!.length} ${t('debugPage.groups.singleTitle')}`,
      icon: IconTechnologyServer,
      name: 'group-server',
    },
    'G_OS': {
      value: arrMapping.value.oses.length > 1 ? `${arrMapping.value.oses.length} ${t('debugPage.operatingSystems.pluralTitle')}` :
      `${arrMapping.value.oses.length} ${t('debugPage.operatingSystems.singleTitle')}`,
      icon: OS_MAP['GROUP'],
      name: 'operating-system-groups',
    },
    'G_BROWSERS': {
      value: arrMapping.value.browsers.length > 1 ? `${arrMapping.value.browsers.length} ${t('debugPage.browsers.pluralTitle')}` :
      `${arrMapping.value.browsers.length} ${t('debugPage.browsers.singleTitle')}`,
      icon: arrMapping.value.browsers,
      name: 'browser-groups',
    },
    'GROUP_NAME': {
      value: props.groupName!,
      icon: IconTechnologyServer,
      name: 'group_name',
    },
  }
})

</script>
<style scoped>
.stats-metadata-class li:not(:first-child)::before {
  content: '.';
  @apply -mt-8px text-lg text-gray-400 pr-8px
}
</style>
