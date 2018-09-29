import React from 'react'
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Modal,
  WebView,
} from 'react-native'

import twitter from '../client'
import { Header } from '@src/components/organisms/Header';
import { CloseButton } from '@src/components/buttons/CloseButton';

export interface TwitterLoginToken {
  oauth_token: string
  oauth_token_secret: string
}
export interface TwitterLoginButtonState {
  isVisible: boolean
  authUrl: string
}
export interface TwitterLoginButtonProps {
  type: string // TouchableOpacity or TouchableHighlight or TouchableWithoutFeedback
  callbackUrl?: string // Twitter application callback url
  headerColor?: string // Webview's modal and SafeAreaView backgroundColor
  onPress(e: any): void // Called when login button on Press
  onGetAccessToken(args: TwitterLoginToken): void // Called when get access token
  onClose(e: any): void // Called when press close button
  onSuccess(user: any): void // Called when logged in and get user account
  onError(e: any): void // Called when on error
  renderHeader?: any // If you use original Header Component,use this props
  children: (props: {onPress: (e: any) => Promise<void>}) => React.ReactNode
}
export class TwitterLoginButton extends React.Component<
  TwitterLoginButtonProps,
  TwitterLoginButtonState
  > {
  static defaultProps = {
    type: 'TouchableOpacity',
    headerColor: '#f7f7f7',
    onPress: () => {},
    onGetAccessToken: () => {},
    onClose: () => {},
    onSuccess: () => {},
    onError: () => {},
    // renderHeader: (props: any) => <Header {...props} />,
  }

  constructor(props: TwitterLoginButtonProps) {
    super(props)

    this.state = {
      isVisible: false,
      authUrl: '',
    }
  }

  token: TwitterLoginToken | null = null

  user = null

  onNavigationStateChange = async (webViewState: any) => {
    const match = webViewState.url.match(/\?oauth_token=.+&oauth_verifier=(.+)/)

    if (match && match.length > 0) {
      this.setState({
        isVisible: false,
      })

      /* get access token */
      try {
        const response = await twitter.getAccessToken(match[1])

        if ((response as any).errors) {
          throw new Error(JSON.stringify((response as any).errors))
        }

        this.token = response
      }
      catch (err) {
        console.warn(`[getAccessToken failed] ${err}`)
        this.props.onError(err)

        return false
      }

      await this.props.onGetAccessToken(this.token)

      /* get account */
      try {
        const response = await twitter.get('account/verify_credentials.json', {
          include_entities: false,
          skip_status: true,
          // include_email: true,
        })

        if (response.errors) {
          throw new Error(JSON.stringify(response.errors))
        }

        this.user = response
      }
      catch (err) {
        console.warn(`[get("account/verify_credentials.json") failed] ${err}`)
        this.props.onError(err)

        return false
      }

      await this.props.onSuccess(this.user)

      return true
    }

    return false
  }

  onButtonPress = async (e: any) => {
    await this.props.onPress(e)

    this.setState({
      isVisible: true,
      authUrl: await twitter.getLoginUrl(this.props.callbackUrl),
    })
  }

  onClose = async (e: any) => {
    this.setState(
      {
        isVisible: false,
      },
      () => this.props.onClose(e),
    )
  }

  renderHeader = (props: any) => {
    if (this.props.renderHeader) {
      return React.cloneElement(this.props.renderHeader(props), props)
    }

    return <Header LeftComponent={<CloseButton onPress={props.onClose} />} />
  }

  render() {
    const { headerColor , children} = this.props
    const { isVisible, authUrl } = this.state
    let Component

    switch (this.props.type) {
      case 'TouchableOpacity':
        Component = TouchableOpacity
        break
      case 'TouchableHighlight':
        Component = TouchableHighlight
        break
      case 'TouchableWithoutFeedback':
        Component = TouchableWithoutFeedback
        break
      default:
        console.warn(
          'TwitterLoginButton type must be TouchableOpacity or TouchableHighlight or TouchableWithoutFeedback',
        )
        return null
    }

    return (
      <Component {...this.props}
      //  onPress={this.onButtonPress}
       >
        {children({onPress: this.onButtonPress})}
        <Modal
          visible={isVisible}
          animationType="slide"
          onRequestClose={() => {}}
        >
            {this.renderHeader({
              headerColor: headerColor,
              onClose: this.onClose,
            })}
            <WebView
              source={{ uri: authUrl }}
              onNavigationStateChange={this.onNavigationStateChange}
            />
        </Modal>
      </Component>
    )
  }
}
