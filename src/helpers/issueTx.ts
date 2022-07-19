import { Tx as AVMTx } from '@savannah-labs/savannahjs/dist/apis/avm/tx'
import { xChain } from '@savannah-labs/savannah-wallet-sdk'
import { bintools, cChain, pChain } from '@/AVA'
import { Tx as PlatformTx } from '@savannah-labs/savannahjs/dist/apis/platformvm/tx'
import { Tx as EVMTx } from '@savannah-labs/savannahjs/dist/apis/evm/tx'

export async function issueX(tx: AVMTx) {
    return xChain.issueTx('0x' + bintools.addChecksum(tx.toBuffer()).toString('hex'))
}

export async function issueP(tx: PlatformTx) {
    return pChain.issueTx('0x' + bintools.addChecksum(tx.toBuffer()).toString('hex'))
}

export async function issueC(tx: EVMTx) {
    return cChain.issueTx('0x' + bintools.addChecksum(tx.toBuffer()).toString('hex'))
}
