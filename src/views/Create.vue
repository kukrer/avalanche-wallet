<template>
    <div class="access_view">
        <create-wallet></create-wallet>
    </div>
</template>
<script lang="ts">
import 'reflect-metadata'
import { Vue, Component, Prop } from 'vue-property-decorator'

import CreateWallet from '@/components/CreateWalletWorkflow/CreateWallet.vue'

@Component({
    components: {
        CreateWallet,
    },
    metaInfo: () => {
        const description =
            "Here at Savannah, we've made storing digital assets easy. Create an Savannah wallet today is see what the buzz is all about!"
        return {
            meta: [
                {
                    vmid: 'description',
                    name: 'description',
                    content: description,
                },
                {
                    vmid: 'og:description',
                    name: 'description',
                    content: description,
                },
                {
                    vmid: 'og:title',
                    name: 'og:title',
                    content: 'Create | Savannah Wallet',
                },
            ],
            title: 'Create',
        }
    },
})
export default class Create extends Vue {}
</script>
<style scoped lang="scss">
@use '../main';

.access_view {
    /*display: grid;*/
    /*grid-template-columns: 1fr 1fr;*/
    display: flex;
    justify-content: center;
    align-items: center;
}

.card {
    text-align: center;
}

a {
    color: #1d82bb !important;
}
</style>
