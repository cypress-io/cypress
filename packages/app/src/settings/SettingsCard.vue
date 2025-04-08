<template>
  <Collapsible
    ref="root"
    class="border rounded bg-light-50 border-gray-100 w-full block
  overflow-hidden hocus-default"
    :max-height="maxHeight"
    :initially-open="initiallyOpen"
    lazy
    :data-cy="title"
  >
    <template #target="{ open }">
      <ListRowHeader
        class="cursor-pointer bg-gray-50"
        :class="{ 'border-b border-b-gray-100 rounded-b-none': open }"
        big-header
      >
        <template #icon>
          <component
            :is="icon"
            class="h-[24px] w-[24px] icon-dark-indigo-500 icon-light-indigo-200"
          />
        </template>
        <template #header>
          {{ title }}
        </template>
        <template #description>
          {{ description }}
        </template>
        <template #right>
          <i-cy-chevron-down
            :class="{ 'rotate-180': open }"
            class="max-w-[16px] transform transition duration-250 icon-dark-gray-300"
          />
        </template>
      </ListRowHeader>
    </template>
    <div
      data-cy="setting-expanded-container"
      class="divide-y space-y-[32px] divide-gray-100 p-[24px] children:pt-[24px] first:first:pt-0"
    >
      <slot />
    </div>
  </Collapsible>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { ref, ComponentPublicInstance, computed, watchEffect, nextTick } from 'vue'
import Collapsible from '@cy/components/Collapsible.vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  title: string
  name?: string
  description: string
  icon: FunctionalComponent<SVGAttributes, {}>
  maxHeight: string
}>()

const route = useRoute()

const initiallyOpen = computed(() => {
  if (!props.name || !route.query.section) {
    return false
  }

  return route.query.section === props.name
})

const root = ref<ComponentPublicInstance>()

/**
 * This feature is used for opening and scrolling to a specific
 * setting, often as a result of doing something else
 * somewhere in the App.
 *
 * One example use case is enabling Desktop Notifications.
 * When a user selects "Enable desktop notifications" on the
 * Specs page, the desired behavior is:
 *
 * 1. Redirect to the /settings page
 * 2. Open the relevant settings card (Device Settings, in this case)
 * 3. Scroll to the #notifications anchor
 *
 * Example usage:
 *
 *
 * router.push({
 *   path: '/settings',         // page to redirect to
 *   query: {
 *     section: 'device',       // section to open by default
 *     anchor: 'notifications'  // anchor to scroll to
 *   }
 * })
 *
 * @see https://github.com/cypress-io/cypress/issues/27090
 */
function maybeScrollToAnchor () {
  if (!initiallyOpen.value) {
    return
  }

  if (!route.query.anchor) {
    // Do nothing - no anchor query parameter.
    return
  }

  if (!root.value?.$el) {
    // Component will always have an underlying HTML element,
    // but better to be defensive, and appease TypeScript.
    return
  }

  // Get the root HTML element, then query for the desired anchor element.
  // Finally, if we found it, scroll into view!
  const $el = root.value.$el as HTMLDivElement
  const $anchor = $el.querySelector(`#${route.query.anchor}`)

  $anchor?.scrollIntoView({ behavior: 'smooth' })
}

watchEffect(() => {
  if (initiallyOpen.value) {
    // Wait for the next tick to ensure the target section
    // has had time to transition from closed to open.
    // This only occurs when clicking "Enable desktop notifications"
    // when the user is already on the /settings route.
    nextTick(maybeScrollToAnchor)
  }
})
</script>
