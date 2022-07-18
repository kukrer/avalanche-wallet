import { UTXO } from '@savannah-labs/savannahjs/dist/apis/avm'

export interface NftGroupDict {
    [key: string]: [UTXO]
}
