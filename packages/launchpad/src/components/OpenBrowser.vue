<template>
    <img src="../images/success.svg" class="mx-auto my-10"/>
    <div class="text-center">
        <Button>Open Chrome</Button>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue"
import { useStoreApp } from "../store/app"
import Button from "./Button.vue"

export default defineComponent({
    setup() {
        const storeApp = useStoreApp();
        onMounted(() => {
            storeApp.setMeta({
                title: "Setup Finished",
                description: "<em>cypress.config.js</em> file was successfully added to your project.Let’s open your browser and start testing some components!"
            });
        });
    },
    components: { Button }
})
</script>