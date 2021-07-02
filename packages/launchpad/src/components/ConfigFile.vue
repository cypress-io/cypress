<template>
    <WizardLayout :next="nextButtonName">
        File Config ts js
    </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue"
import { useStore } from "../store";
import WizardLayout from "./WizardLayout.vue"

export default defineComponent({
    components: {
        WizardLayout
    },
    setup() {
        const store = useStore();
        const manualInstall = ref(false);
        const nextButtonName = computed(() =>
            manualInstall.value ? "I've added this file" : "Create File"
        );
        onMounted(() => {
            store.setMeta({
                title: 'Configuration file',
                description: 'Cypress reads the settings from this file each time the test runner is initialized. We can create the file for you, or you can copy and paste the code below if you wish.',
            })
        })
        return { nextButtonName }
    }
})
</script>