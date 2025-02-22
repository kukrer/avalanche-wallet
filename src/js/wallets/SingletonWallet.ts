import { ava, avm, bintools, cChain, pChain } from '@/AVA'
import { ITransaction } from '@/components/wallet/transfer/types'
import { digestMessage } from '@/helpers/helper'
import { WalletNameType } from '@/js/wallets/types'

import { Buffer as BufferAvalanche, BN } from '@savannah-labs/savannahjs'
import {
    KeyPair as AVMKeyPair,
    KeyChain as AVMKeyChain,
    UTXOSet as AVMUTXOSet,
    UTXO,
    UnsignedTx,
} from '@savannah-labs/savannahjs/dist/apis/avm'
import {
    KeyPair as PlatformKeyPair,
    KeyChain as PlatformKeyChain,
    UTXOSet as PlatformUTXOSet,
    UTXOSet,
} from '@savannah-labs/savannahjs/dist/apis/platformvm'
import {
    KeyChain,
    KeyChain as EVMKeyChain,
    UTXOSet as EVMUTXOSet,
} from '@savannah-labs/savannahjs/dist/apis/evm'
import { PayloadBase } from '@savannah-labs/savannahjs/dist/utils'
import { buildUnsignedTransaction } from '../TxHelper'
import { AvaWalletCore, UnsafeWallet } from './types'
import { UTXO as PlatformUTXO } from '@savannah-labs/savannahjs/dist/apis/platformvm/utxos'
import { privateToAddress } from 'ethereumjs-util'
import {
    Tx as AVMTx,
    UnsignedTx as AVMUnsignedTx,
} from '@savannah-labs/savannahjs/dist/apis/avm/tx'
import {
    Tx as PlatformTx,
    UnsignedTx as PlatformUnsignedTx,
} from '@savannah-labs/savannahjs/dist/apis/platformvm/tx'
import {
    Tx as EvmTx,
    UnsignedTx as EVMUnsignedTx,
} from '@savannah-labs/savannahjs/dist/apis/evm/tx'
import Erc20Token from '@/js/Erc20Token'
import { WalletCore } from '@/js/wallets/WalletCore'
import { WalletHelper } from '@/helpers/wallet_helper'
import { avmGetAllUTXOs, platformGetAllUTXOs } from '@/helpers/utxo_helper'
import { UTXO as AVMUTXO } from '@savannah-labs/savannahjs/dist/apis/avm/utxos'
import { Transaction } from '@ethereumjs/tx'
import { ExportChainsC, ExportChainsP, ExportChainsX } from '@savannah-labs/savannah-wallet-sdk'

class SingletonWallet extends WalletCore implements AvaWalletCore, UnsafeWallet {
    keyChain: AVMKeyChain
    keyPair: AVMKeyPair

    platformKeyChain: PlatformKeyChain
    platformKeyPair: PlatformKeyPair

    chainId: string
    chainIdP: string

    key: string

    stakeAmount: BN

    type: WalletNameType

    ethKey: string
    ethKeyBech: string
    ethKeyChain: EVMKeyChain
    ethAddress: string
    ethAddressBech: string
    ethBalance: BN

    constructor(pk: string) {
        super()

        this.key = pk

        this.chainId = avm.getBlockchainAlias() || avm.getBlockchainID()
        this.chainIdP = pChain.getBlockchainAlias() || pChain.getBlockchainID()

        const hrp = ava.getHRP()

        this.keyChain = new AVMKeyChain(hrp, this.chainId)
        this.keyPair = this.keyChain.importKey(pk)

        this.platformKeyChain = new PlatformKeyChain(hrp, this.chainIdP)
        this.platformKeyPair = this.platformKeyChain.importKey(pk)

        this.stakeAmount = new BN(0)

        // Derive EVM key and address
        const pkBuf = bintools.cb58Decode(pk.split('-')[1])
        const pkHex = pkBuf.toString('hex')
        const pkBuffNative = Buffer.from(pkHex, 'hex')

        this.ethKey = pkHex
        this.ethAddress = privateToAddress(pkBuffNative).toString('hex')
        this.ethBalance = new BN(0)

        const cPrivKey = `PrivateKey-` + bintools.cb58Encode(BufferAvalanche.from(pkBuf))
        this.ethKeyBech = cPrivKey
        const cKeyChain = new KeyChain(ava.getHRP(), 'C')
        this.ethKeyChain = cKeyChain

        const cKeypair = cKeyChain.importKey(cPrivKey)
        this.ethAddressBech = cKeypair.getAddressString()

        this.type = 'singleton'
        this.isInit = true
    }

    getChangeAddressAvm(): string {
        return this.getCurrentAddressAvm()
    }

    getCurrentAddressAvm(): string {
        return this.keyPair.getAddressString()
    }

    getChangeAddressPlatform(): string {
        return this.getCurrentAddressPlatform()
    }

    getDerivedAddresses(): string[] {
        const addr = this.getCurrentAddressAvm()
        return [addr]
    }

    getDerivedAddressesP() {
        return [this.getCurrentAddressPlatform()]
    }

    getAllDerivedExternalAddresses(): string[] {
        return this.getDerivedAddresses()
    }

    getExtendedPlatformAddresses(): string[] {
        const addr = this.platformKeyPair.getAddressString()
        return [addr]
    }

    getHistoryAddresses(): string[] {
        const addr = this.getCurrentAddressAvm()
        return [addr]
    }

    getPlatformRewardAddress(): string {
        return this.getCurrentAddressPlatform()
    }

    getCurrentAddressPlatform(): string {
        return this.platformKeyPair.getAddressString()
    }

    getBaseAddress(): string {
        return this.getCurrentAddressAvm()
    }

    async getStake(): Promise<BN> {
        this.stakeAmount = await WalletHelper.getStake(this)
        return this.stakeAmount
    }

    getPlatformUTXOSet(): PlatformUTXOSet {
        return this.platformUtxoset
    }

    getEvmAddress(): string {
        return this.ethAddress
    }

    getEvmAddressBech(): string {
        return this.ethAddressBech
    }

    async getEthBalance() {
        const bal = await WalletHelper.getEthBalance(this)
        this.ethBalance = bal
        return bal
    }

    async updateUTXOsX(): Promise<AVMUTXOSet> {
        const result = await avmGetAllUTXOs([this.getCurrentAddressAvm()])
        this.utxoset = result
        return result
    }

    async updateUTXOsP(): Promise<PlatformUTXOSet> {
        const result = await platformGetAllUTXOs([this.getCurrentAddressPlatform()])
        this.platformUtxoset = result
        return result
    }

    async getUTXOs(): Promise<void> {
        this.isFetchUtxos = true

        await this.updateUTXOsX()
        await this.updateUTXOsP()

        await this.getStake()
        await this.getEthBalance()

        this.isFetchUtxos = false

        return
    }

    async buildUnsignedTransaction(
        orders: (ITransaction | UTXO)[],
        addr: string,
        memo?: BufferAvalanche
    ) {
        const changeAddress = this.getChangeAddressAvm()
        const derivedAddresses = this.getDerivedAddresses()
        const utxoset = this.getUTXOSet() as AVMUTXOSet

        return buildUnsignedTransaction(
            orders,
            addr,
            derivedAddresses,
            utxoset,
            changeAddress,
            memo
        )
    }

    async issueBatchTx(
        orders: (ITransaction | AVMUTXO)[],
        addr: string,
        memo: BufferAvalanche | undefined
    ): Promise<string> {
        return await WalletHelper.issueBatchTx(this, orders, addr, memo)
    }

    getFirstAvailableAddressPlatform(): string {
        return this.getCurrentAddressPlatform()
    }

    onnetworkchange(): void {
        const hrp = ava.getHRP()

        this.keyChain = new AVMKeyChain(hrp, this.chainId)
        this.utxoset = new AVMUTXOSet()
        this.keyPair = this.keyChain.importKey(this.key)

        this.platformKeyChain = new PlatformKeyChain(hrp, this.chainIdP)
        this.platformUtxoset = new PlatformUTXOSet()
        this.platformKeyPair = this.platformKeyChain.importKey(this.key)

        // Update EVM values
        this.ethKeyChain = new EVMKeyChain(ava.getHRP(), 'C')
        const cKeypair = this.ethKeyChain.importKey(this.ethKeyBech)
        this.ethAddressBech = cKeypair.getAddressString()
        this.ethBalance = new BN(0)

        this.getUTXOs()
    }

    async signX(unsignedTx: AVMUnsignedTx): Promise<AVMTx> {
        const keychain = this.keyChain

        const tx = unsignedTx.sign(keychain)
        return tx
    }

    async signP(unsignedTx: PlatformUnsignedTx): Promise<PlatformTx> {
        const keychain = this.platformKeyChain
        const tx = unsignedTx.sign(keychain)
        return tx
    }

    async signC(unsignedTx: EVMUnsignedTx): Promise<EvmTx> {
        const keyChain = this.ethKeyChain
        return unsignedTx.sign(keyChain)
    }

    async signEvm(tx: Transaction) {
        const keyBuff = Buffer.from(this.ethKey, 'hex')
        return tx.sign(keyBuff)
    }

    async signMessage(msgStr: string): Promise<string> {
        const digest = digestMessage(msgStr)

        const digestHex = digest.toString('hex')
        const digestBuff = BufferAvalanche.from(digestHex, 'hex')
        const signed = this.keyPair.sign(digestBuff)

        return bintools.cb58Encode(signed)
    }

    async delegate(
        nodeID: string,
        amt: BN,
        start: Date,
        end: Date,
        rewardAddress?: string,
        utxos?: PlatformUTXO[]
    ): Promise<string> {
        return await WalletHelper.delegate(this, nodeID, amt, start, end, rewardAddress, utxos)
    }

    async validate(
        nodeID: string,
        amt: BN,
        start: Date,
        end: Date,
        delegationFee: number = 0,
        rewardAddress?: string,
        utxos?: PlatformUTXO[]
    ): Promise<string> {
        return await WalletHelper.validate(
            this,
            nodeID,
            amt,
            start,
            end,
            delegationFee,
            rewardAddress,
            utxos
        )
    }

    async createNftFamily(name: string, symbol: string, groupNum: number) {
        return await WalletHelper.createNftFamily(this, name, symbol, groupNum)
    }

    async mintNft(mintUtxo: AVMUTXO, payload: PayloadBase, quantity: number) {
        return await WalletHelper.mintNft(this, mintUtxo, payload, quantity)
    }

    async sendEth(to: string, amount: BN, gasPrice: BN, gasLimit: number) {
        return await WalletHelper.sendEth(this, to, amount, gasPrice, gasLimit)
    }

    async estimateGas(to: string, amount: BN, token: Erc20Token): Promise<number> {
        return await WalletHelper.estimateGas(this, to, amount, token)
    }

    async sendERC20(
        to: string,
        amount: BN,
        gasPrice: BN,
        gasLimit: number,
        token: Erc20Token
    ): Promise<string> {
        return await WalletHelper.sendErc20(this, to, amount, gasPrice, gasLimit, token)
    }

    getAllAddressesX() {
        return [this.getCurrentAddressAvm()]
    }

    getAllAddressesP() {
        return [this.getCurrentAddressPlatform()]
    }
}

export { SingletonWallet }
