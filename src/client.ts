/* lib */
import Request from './request'
import * as Util from './util'

/* const */
const baseURL = 'https://api.twitter.com'
const apiURL = 'https://api.twitter.com/1.1'
const requestTokenURL = '/oauth/request_token'
const authorizationURL = '/oauth/authorize'
const accessTokenURL = '/oauth/access_token'

class Client {
  ConsumerKey: any = null

  ConsumerSecret: any = null

  Token: any = null

  TokenSecret: any = null

  TokenRequestHeaderParams: any = {}

  /**
   * set consumer
   */
  setConsumerKey = (consumerKey: string, consumerSecret: string) => {
    this.ConsumerKey = consumerKey
    this.ConsumerSecret = consumerSecret
  }

  /**
   * set access token
   */
  setAccessToken = (token: any, tokenSecret: any) => {
    this.Token = token
    this.TokenSecret = tokenSecret
  }

  /**
   * get login redirect url
   */
  getLoginUrl = async (callback = '') => {
    this.TokenRequestHeaderParams = Util.createTokenRequestHeaderParams(
      this.ConsumerKey,
      { callback },
    )
    this.TokenRequestHeaderParams = Util.createSignature(
      this.TokenRequestHeaderParams,
      'POST',
      baseURL + requestTokenURL,
      this.ConsumerSecret,
    )

    const result = await Request(
      'POST',
      baseURL + requestTokenURL,
      this.TokenRequestHeaderParams,
    )
    this.setAccessToken(result.oauth_token, result.oauth_token_secret)

    return `${baseURL + authorizationURL}?oauth_token=${this.Token}`
  }

  /**
   * get access token
   */
  getAccessToken = async (verifier = '') => {
    this.TokenRequestHeaderParams = Util.createTokenRequestHeaderParams(
      this.ConsumerKey,
      { token: this.Token },
    )
    this.TokenRequestHeaderParams = Util.createSignature(
      this.TokenRequestHeaderParams,
      'POST',
      baseURL + accessTokenURL,
      this.ConsumerSecret,
      this.TokenSecret,
    )
    this.TokenRequestHeaderParams.oauth_verifier = verifier

    const result = await Request(
      'POST',
      baseURL + accessTokenURL,
      this.TokenRequestHeaderParams,
    )
    this.setAccessToken(result.oauth_token, result.oauth_token_secret)

    return {
      oauth_token: result.oauth_token,
      oauth_token_secret: result.oauth_token_secret,
    }
  }

  /**
   * call Twitter Api
   */
  api = async (method = 'GET', endpoint: string, params = {}) => {
    const apiMethod = method.toUpperCase()
    const apiEndpoint = endpoint.slice(0, 1) !== '/' ? `/${endpoint}` : endpoint

    this.TokenRequestHeaderParams = Util.createTokenRequestHeaderParams(
      this.ConsumerKey,
      { token: this.Token, params },
    )
    this.TokenRequestHeaderParams = Util.createSignature(
      this.TokenRequestHeaderParams,
      apiMethod,
      apiURL + apiEndpoint,
      this.ConsumerSecret,
      this.TokenSecret,
    )

    const result = await Request(
      apiMethod,
      apiURL
        + (params ? `${apiEndpoint}?${Util.encodeParamsToString(params)}` : apiEndpoint),
      this.TokenRequestHeaderParams,
    )

    return result
  }

  /**
   * api("POST",endpoint,params) alias
   */
  post = async (endpoint: string, params = {}) => {
    const result = await this.api('POST', endpoint, params)

    return result
  }

  /**
   * api("GET",endpoint,params) alias
   */
  get = async (endpoint: string, params = {}) => {
    const result = await this.api('GET', endpoint, params)

    return result
  }
}

export default new Client()
