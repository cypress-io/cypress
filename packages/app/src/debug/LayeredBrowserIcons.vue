<template>
  <ul
    data-cy="layered-browser-icons"
    class="flex mr-[8px] pl-[8px]"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      class="rounded-full rounded flex h-5 ml-[-8px] w-5 items-center justify-center"
      :class="(results.length > 1 ? 'bg-gray-50' : '')"
    >
      <component
        :is="result.icon"
        :data-cy="result.name"
        size="16"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'

interface LayeredProps {
  browsers: string[]
}

const props = defineProps<LayeredProps>()

const results = computed(() => {
  if (props.browsers) {
    return props.browsers.map((browserType) => {
      return {
        icon: allBrowsersIcons[browserType?.toLowerCase()] || allBrowsersIcons.generic,
        name: `browser-icon-${browserType.toLowerCase().replaceAll(' ', '_')}`,
      }
    })
  }

  return []
})

</script>
