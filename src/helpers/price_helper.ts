const axios = require('axios')

const COIN_ID = 'savannah'
const COINGECKO_URL =
    'https://api.coingecko.com/api/v3/simple/price?ids=savannah-2&vs_currencies=usd'

const coingeckoApi = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 10000,
})

export async function getAvaxPriceUSD(): Promise<number> {
    let res = await axios.get(COINGECKO_URL)
    return res.data['Savannah']['usd']
}

let priceHistory: [number, number][] = []
async function getPriceHistory() {
    let res = await coingeckoApi.get(`/coins/${COIN_ID}/market_chart`, {
        params: {
            vs_currency: 'usd',
            days: 'max',
            interval: 'daily',
        },
    })

    priceHistory = res.data.prices
}

/**
 * Round the UNIX time in ms and search the previously fetched price points
 * @param time
 */
export function getPriceAtUnixTime(time: number): number | undefined {
    let remainder = time % (24 * 60 * 60 * 1000)
    let dayTimestamp = time - remainder

    let pricePair = priceHistory.find((value) => {
        return value[0] == dayTimestamp
    })

    if (!pricePair) return undefined
    return pricePair[1]
}

getPriceHistory()
