<template>
  <template v-if="status">
    <div class="border rounded-full font-medium p-5px pr-16px text-size-14px leading-20px inline-flex items-center group relative text-jade-500">
      <Menu>
        <MenuButton
          data-cy="status-badge-menu"
          class="flex items-center justify-center focus:outline-transparent"
          @click.stop
        >
          <i-cy-grommet_x16
            class="h-16px mr-4px ml-4px w-16px icon-light-jade-400 icon-dark-jade-400"
          />
          {{ titleOn }}
          <i-cy-chevron-down-small_x8
            class="ml-8px h-8px w-8px icon-dark-gray-500"
          />
        </MenuButton>
        <MenuItems
          class="rounded flex flex-col outline-transparent bg-gray-900 text-white
      right-0 z-40 absolute overflow-scroll"
          :class="props.isRunning ? '-bottom-42px' : '-bottom-80px'"
        >
          <MenuItem
            v-for="item in menuItems"
            :key="item.name"
          >
            <button
              :data-cy="item.name"
              class="border-b border-b-gray-800 text-left py-8px px-16px bg-gray-700 min-w-max"
              @click.stop="handleMenuClick(item.event)"
            >
              {{ item.name }}
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  </template>
  <template v-else>
    <span
      class="border rounded-full font-medium p-5px pr-16px text-size-14px leading-20px inline-flex items-center text-gray-600"
    >
      <i-cy-grommet_x16
        class="mx-4px h-16px w-16px icon-dark-gray-200 icon-dark-gray-50"
      />
      {{ titleOff }}
    </span>
  </template>
</template>

<script lang="ts" setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useI18n } from '@cy/i18n'
import { gql, useMutation } from '@urql/vue'
import { TestingTypeSelectionAndReconfigureDocument, TestingTypeEnum } from '../generated/graphql'
import { computed } from 'vue'

const props = defineProps<{
  status: boolean,
  titleOn: string,
  titleOff: string,
  testingType: TestingTypeEnum
  isRunning: boolean
}>()

const { t } = useI18n()

const emit = defineEmits<{
  (event: 'launchBrowser'): void
}>()

gql`
mutation TestingTypeSelectionAndReconfigure($testingType: TestingTypeEnum!) {
  setTestingTypeAndReconfigureProject(testingType: $testingType) {
    currentTestingType
    currentProject {
      id
      currentTestingType
      isCTConfigured
      isE2EConfigured
      isLoadingConfigFile
      isLoadingNodeEvents
    }
  }
}
`

const mutation = useMutation(TestingTypeSelectionAndReconfigureDocument)

type EventName = 'launchBrowser' | 'reconfigure'

const menuItems = computed(() => {
  const reconfigure = { name: t('setupPage.testingCard.reconfigure'), event: 'reconfigure' }
  const launchBrowser = { name: t('setupPage.testingCard.launchBrowser'), event: 'launchBrowser' }

  return props.isRunning ? [reconfigure] : [launchBrowser, reconfigure]
})

const handleMenuClick = (eventName: EventName) => {
  if (eventName === 'launchBrowser') {
    emit(eventName)
  } else if (eventName === 'reconfigure') {
    mutation.executeMutation({ testingType: props.testingType })
  }
}

</script>
