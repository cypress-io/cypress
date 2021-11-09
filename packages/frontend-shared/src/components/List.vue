<template>
  Items,
  <button>OK</button>
  <div
    ref="target"
    tabindex="0"
  >
    <a
      v-for="item in items"
      :key="item.id"
    >
      {{ item.value }}
    </a>
  </div>
</template>

<script lang="ts" setup>
import { useListNavigation } from '../composables/useListNavigation'
import faker from 'faker'
import { computed, reactive, Ref, ref, watch, onMounted } from 'vue'

const items = Array.from(new Array(100).keys()).map(() => {
  return {
    value: faker.name.firstName(),
    label: 'Contact Details',
    id: faker.datatype.uuid(),
    children: [
      { id: faker.datatype.uuid(), value: faker.name.jobDescriptor(), label: 'Job Descriptor' },
      { id: faker.datatype.uuid(), value: faker.name.jobTitle(), label: 'Job Title' },
      { id: faker.datatype.uuid(), value: faker.company.companyName(), label: 'Company Name' },
    ],
  }
})

const target: Ref<HTMLElement | undefined> = ref()

useListNavigation(target)

</script>
