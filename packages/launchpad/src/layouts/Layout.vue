<template>
  <div
    class="
      min-h-screen
      grid grid-cols-launchpad grid-rows-launchpad
      bg-white
      relative
    "
  >
    <div
      class="
        border-b
        bg-gray-900
        text-gray-200
        border-gray-700
        flex
        items-center
        justify-center
        text-lg
      "
    >
      <i-clarity-menu-line class="p-3 h-13 w-13" />
    </div>
    <div
      class="
        border-b
        text-gray-600
        border-gray-200
        flex
        items-center
        text-left
        px-5
        text-sm
      "
    >
      {{ projectTitle }}
    </div>
    <div
      class="bg-gray-900 text-gray-500 flex flex-col items-stretch"
      :style="`background-image: url('${bottomBackground}');`"
      style="background-position: bottom center;background-repeat: no-repeat;"
    >
      <SideBarItem
        v-for="i in sideMenuDefinition"
        :key="i?.id"
        :gql="i"
        class="pr-8px"
        :icon="icons[i?.iconPath]"
        :active="!!i?.selected"
        @click="handleSelect(i.type)"
      />
      <div class="flex-grow" />
      <img
        src="../images/cypress_s.png"
        class="m-4 mx-auto w-7"
      >
    </div>
    <div class="flex items-stretch flex-col">
      <slot :item="selected" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import SideBarItem from './SideBarItem.vue'
import bottomBackground from '../images/bottom_filler.svg'
import { gql } from '@urql/core'
import { useMutation, useQuery } from '@urql/vue'
import { LayoutDocument, NavigationMenuSetItemDocument, NavItem } from '../generated/graphql'
import IconDashboardLine from '~icons/clarity/dashboard-line'
import IconTerminalLine from '~icons/clarity/terminal-line'
import IconSettingsLine from '~icons/clarity/settings-line'
import IconRunsLine from '~icons/clarity/bullet-list-line'

gql`
query Layout {
  app {
    activeProject {
      id
      title
    }
  }
  navigationMenu {
    selected
    items {
      id
      ...SideBarItem
    }
  }
}
`

gql`
mutation NavigationMenuSetItem($type: NavItem!) {
  navigationMenuSetItem (type: $type) {
    selected
    items {
      ...SideBarItem
    }
  }
} 
`

const icons = {
  'clarity/dashboard-line': IconDashboardLine,
  'clarity/terminal-line': IconTerminalLine,
  'clarity/settings-line': IconSettingsLine,
  'clarity/bullet-list-line': IconRunsLine,
}

export default defineComponent({
  components: {
    SideBarItem,
  },

  setup () {
    const result = useQuery({
      query: LayoutDocument,
    })

    const setMenuItem = useMutation(NavigationMenuSetItemDocument)

    const projectTitle = computed(() => result.data.value?.app.activeProject?.title)

    const handleSelect = (type: NavItem) => {
      setMenuItem.executeMutation({ type })
    }

    const selected = computed(() => {
      const item = result.data?.value?.navigationMenu?.items.find((item) => item!.selected)

      return item?.id ?? null
    })

    const sideMenuDefinition = computed(() => {
      return result.data?.value?.navigationMenu?.items
    })

    return {
      icons,
      handleSelect,
      projectTitle,
      selected,
      sideMenuDefinition,
      bottomBackground,
    }
  },
})
</script>
