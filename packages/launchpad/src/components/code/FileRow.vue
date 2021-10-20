<template>
  <ListRow @toggle="handleToggle">
    <template #icon>
      <i-cy-file-changes-added_x24
        v-if="status === 'valid'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-warning_x24
        v-if="status === 'changes'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-skipped_x24
        v-if="status === 'skipped'"
        class="w-24px h-24px"
      />
      <i-cy-file-changes-error_x24
        v-if="status === 'error'"
        class="w-24px h-24px"
      />
    </template>
    <template #header>
      <span class="inline-block align-top">{{ filePath }}</span>
      <Badge
        v-if="statusLabel && statusClasses && !open"
        :label="statusLabel"
        :status="statusClasses"
      />
    </template>
    <template #description>
      <span>
        {{ description }}
      </span>
    </template>
    <template #right>
      <i-cy-dropcaret />
    </template>
    <template #slider>
      <div
        v-if="status === 'changes' && open"
        class="flex items-center p-3 border-t border-gray-200 bg-warning-100 text-warning-600"
      >
        <span class="font-semibold">{{ statusLabel }}: </span>
        <p class="flex-grow ml-1 text-left">
          Please merge the code below with your existing <span class="inline-block px-1 rounded bg-warning-200 text-warning-600">{{ filePath }}</span>
        </p>
        <Button @click="document.location.assign('https://docs.cypress.io/config')">
          Learn more
        </Button>
      </div>
      <ShikiHighlight
        v-if="open"
        :lang="language"
        :code="content"
        line-numbers
      />
    </template>
  </ListRow>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import ListRow from '@cy/components/ListRow.vue'
import Button from '@cy/components/Button.vue'
import Badge from '@cy/components/Badge.vue'
import ShikiHighlight, { CyLangType, langsSupported } from '@cy/components/ShikiHighlight.vue'

const props = defineProps<{
    status: 'changes' | 'valid' | 'skipped' | 'error'
    filePath: string
    content: string
    description?: string | null
}>()

const language = computed(() => {
  // get the extension of the current file path
  const extension = /\.(\w+)$/.exec(props.filePath)?.[1]

  if (extension && (langsSupported as readonly string[]).includes(extension)) {
    return extension as CyLangType
  }

  return undefined
})

const open = ref(!['valid', 'skipped'].includes(props.status))
const handleToggle = () => {
  open.value = !open.value
}

const statusLabel = computed(() => props.status === 'skipped' ? 'Skipped' : props.status === 'changes' ? 'Changes required' : undefined)
const statusClasses = computed(() => props.status === 'skipped' ? 'skipped' : props.status === 'changes' ? 'warning' : undefined)

</script>
