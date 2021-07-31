<template>
  <ProjectSettingsSection>
     <template #title>Project ID</template>
     <template #description>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?</template>
     <div class="inline-grid grid-flow-col justify-start gap-10px">
      <Input disabled inputClass="font-mono text-xs" prefixIconClass="px-3 bg-red-600" type="text" size="sm">
        <!-- I need a reusable "card" here because putting content within Inputs isn't great -->
        <PrismJs v-if="yamlRegistered" class="p-0 hide-scrollbar" language="yaml">projectId: '{{ projectId }}'</PrismJs>
        <!-- projectId: '{{projectId}}' -->
        <template #prefix>
            <Icon icon="mdi:code-braces" class="text-cool-gray-400 braces bg-cool-gray-100" />
        </template>
      </Input>
      <Button variant="outline" @click="clipboard.copy">
        <template #prefix>
          <Icon class="text-cool-gray-600" icon="si-glyph:square-dashed-2" />
        </template>
        {{ clipboard.copied.value ? 'Copied!' : 'Copy' }}
      </Button>
     </div>
   </ProjectSettingsSection>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import "prismjs";
import "@packages/reporter/src/errors/prism.scss";
// import 'prismjs/components/prism-typescript'
import Input from '../../components/Input.vue'
import Button from '../../components/Button.vue'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import { useClipboard } from '@vueuse/core'
import PrismJs from "vue-prism-component";

export default defineComponent({
  components: {
    PrismJs,
    Input,
    Button,
    ProjectSettingsSection,
  },
  setup() {
    const projectId = ref('74e08848-f0f6-11eb-9a03-0242ac130003')
    const yamlRegistered = ref(false)
    // await import("prismjs/components/prism-yaml")
    onMounted(() => {
      import("prismjs/components/prism-yaml").then(() => {
        yamlRegistered.value = true;
      });
    })
    return {
      clipboard: useClipboard({ source: projectId }),
      projectId,
      yamlRegistered,
    }
  },
})
</script>

<style lang="scss" scoped>
  pre {
    @apply bg-transparent m-0 p-0;
  }
.hide-scrollbar {
  
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }
}
</style>
