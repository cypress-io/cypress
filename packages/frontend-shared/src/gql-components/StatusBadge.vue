<template>
  <template v-if="props.status">
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
          {{ props.titleOn }}
        </MenuButton>
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
      {{ props.titleOff }}
    </span>
  </template>
</template>

<script lang="ts" setup>

import { Menu, MenuButton } from '@headlessui/vue'
import type { TestingTypeEnum } from '../generated/graphql'

const props = defineProps<{
  status: boolean
  titleOn: string
  titleOff: string
  testingType: TestingTypeEnum
  isRunning: boolean
  isApp: boolean
}>()

</script>
