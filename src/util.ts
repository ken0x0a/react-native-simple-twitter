/* npm */
import HmacSHA1 from 'crypto-js/hmac-sha1'
import Base64 from 'crypto-js/enc-base64'

/**
 * random strings (initial length -> 32)
 */
export const randomStrings = (n = 32) => {
  const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  return Array(...Array(n))
    .map(() => str.charAt(Math.floor(Math.random() * str.length)))
    .join('')
}

/**
 * create header.Authorization string
 */
export const createHeaderString = (params: any) => `OAuth ${Object.keys(params)
  .sort()
  .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  .join(', ')}`

/**
 * create string object.join(&)
 */
export const encodeParamsToString = (params: any) => Object.keys(params)
  .sort()
  .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  .join('&')

/**
 * if content-type === text/html, parse response.text()
 */
export const parseFormEncoding = (formEncoded: any) => formEncoded.split('&').reduce((obj: any, form: any) => {
  const [key, value] = form.split('=')
  return Object.assign(obj, { [key]: value })
}, {})

/**
 * create params
 */
export const createTokenRequestHeaderParams = (
  consumerKey = '',
  { callback = '', token = '', params = {} },
) => Object.assign(
  {},
  callback ? { oauth_callback: callback } : {},
  {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomStrings(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: new Date().getTime() / 1000,
  },
  token ? { oauth_token: token } : {},
  { oauth_version: '1.0' },
  params,
)

/**
 * create OAuth1.0 signature from params
 */
export const createSignature = (
  params: string,
  method: string,
  url: string,
  consumerSecret: string,
  tokenSecret: string | null = null,
) => {
  const encodedParameters = encodeParamsToString(params)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
  const encodedRequestURL = encodeURIComponent(url)

  const signature = Base64.stringify(
    HmacSHA1(
      `${method}&${encodedRequestURL}&${encodeURIComponent(encodedParameters)}`,
      tokenSecret
        ? `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
        : `${encodeURIComponent(consumerSecret)}&`,
    ),
  )

  return Object.assign({}, params, { oauth_signature: signature })
}
