import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const options = isLocal ? {} : { domain: '.luckynwa.top' }
  return Cookies.set(TokenKey, token, options)
}

export function removeToken() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const options = isLocal ? {} : { domain: '.luckynwa.top' }
  return Cookies.remove(TokenKey, options)
}
