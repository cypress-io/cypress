<template>
  <ProjectSettingsSection>
    <template #title>Record Key</template>
    <template #description>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?
      <a>Learn more</a>.
    </template>
    <div class="inline-flex justify-start gap-10px">
      <Input
        v-model="recordKey"
        class="w-200px"
        inputClass="font-mono text-xs"
        disabled
        size="sm"
        :type="showRecordKey ? 'text' : 'password'"
      >
        <template #prefix>
          <Icon icon="foundation:key" class="text-cool-gray-400" />
        </template>
        <template #suffix="{ containerClass }">
          <button
            :class="containerClass"
            @click="showRecordKey = !showRecordKey"
            class="text-cool-gray-400 hover:text-cool-gray-500"
          >
            <Icon v-show="!showRecordKey" icon="mdi:eye-outline" />
            <Icon v-show="showRecordKey" icon="mdi:eye-off-outline" />
          </button>
        </template>
      </Input>
      <Button variant="outline" @click="clipboard.copy">
        <template #prefix>
          <Icon class="text-cool-gray-600" icon="si-glyph:square-dashed-2" />
        </template>
        {{ clipboard.copied.value ? 'Copied!' : 'Copy' }}
      </Button>
      <Button variant="outline" @click="openManageKeys">
        <template #prefix>
          <Icon class="w-16px h-16px text-cool-gray-400" icon="foundation:key" />
        </template>
        Manage Keys
      </Button>
    </div>
  </ProjectSettingsSection>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import Icon from '../../components/Icon.vue'
import Button from '../../components/Button.vue'
import Input from '../../components/Input/Input.vue'

export default defineComponent({
  components: { Icon, Button, Input, ProjectSettingsSection },
  setup() {
    const recordKey = ref('oeiwj123roi')
    return {
      clipboard: useClipboard({ source: recordKey }),
      openManageKeys: () => { },
      recordKey,
      showRecordKey: ref(false)
    }
  },
})
</script>
