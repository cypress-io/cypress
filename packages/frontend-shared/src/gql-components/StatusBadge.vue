<template>
  <template v-if="status">
    <div class="border rounded-full font-medium p-5px pr-16px text-size-14px text-jade-500 leading-20px inline-flex items-center relative">
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
            v-if="menuItems.length > 0"
            class="h-8px ml-8px w-8px icon-dark-gray-500"
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
            #="{ active }"
          >
            <button
              :data-cy="item.name"
              :class="{ 'bg-gray-700': active }"
              class="border-b min-w-max border-b-gray-800 text-left py-8px px-16px"
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
      class="border rounded-full font-medium p-5px pr-16px text-size-14px text-gray-600 leading-20px inline-flex items-center"
    >
      <i-cy-grommet_x16
        class="h-16px mx-4px w-16px icon-dark-gray-200 icon-dark-gray-50"
      />
      {{ titleOff }}
    </span>
  </template>
</template>

<script lang="ts" setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useI18n } from '@cy/i18n'
import type { TestingTypeEnum } from '../generated/graphql'
import { computed } from 'vue'

const props = defineProps<{
  status: boolean
  titleOn: string
  titleOff: string
  testingType: TestingTypeEnum
  isRunning: boolean
  isApp: boolean
}>()

const { t } = useI18n()

const emit = defineEmits<{
  (event: 'chooseABrowser'): void
}>()

type EventName = 'chooseABrowser'

const menuItems = computed(() => {
  const launchBrowser: { name: string, event: EventName } = { name: t('setupPage.testingCard.chooseABrowser'), event: 'chooseABrowser' }

  return props.isRunning ? [] : [launchBrowser]
})

const handleMenuClick = (eventName: EventName) => {
  if (eventName === 'chooseABrowser') {
    emit(eventName)
  }
}

</script>
