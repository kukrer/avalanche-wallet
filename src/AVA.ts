import { KeyChain as AVMKeyChain, AVMAPI } from '@savannah-labs/savannahjs/dist/apis/avm'
import { InfoAPI } from '@savannah-labs/savannahjs/dist/apis/info'
import Avalanche from '@savannah-labs/savannahjs'
//@ts-ignore
import BinTools from '@savannah-labs/savannahjs/dist/utils/bintools'
import { EVMAPI } from '@savannah-labs/savannahjs/dist/apis/evm'

// Connect to TestNet by default
// Doesn't really matter how we initialize, it will get changed by the network module later
const ip: string = 'bootstrap.ava.network'
const port: number = 21000
const protocol: string = 'https'
const network_id: number = 2
const chain_id: string = 'X'
const bintools: BinTools = BinTools.getInstance()
const ava: Avalanche = new Avalanche(ip, port, protocol, network_id, chain_id)

const avm: AVMAPI = ava.XChain()
const cChain: EVMAPI = ava.CChain()
const pChain = ava.PChain()
const infoApi: InfoAPI = ava.Info()
const keyChain: AVMKeyChain = avm.keyChain()

function isValidAddress(addr: string) {
    try {
        const res = bintools.stringToAddress(addr)
        return true
    } catch (err) {
        return false
    }
}

export { ava, avm, pChain, cChain, infoApi, bintools, isValidAddress, keyChain }
