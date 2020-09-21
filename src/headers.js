// Ref https://github.com/WICG/webpackage/blob/master/go/signedexchange/stateful_headers.go

const statefulRequestHeaders = [
  'authorization',
  'cookie',
  'cookie2',
  'proxy-authorization',
  'sec-websocket-key'
]

const uncachedHeaders = [
  'connection',
  'keep-alive',
  'proxy-connection',
  'trailer',
  'transfer-encoding',
  'upgrade',

  'authentication-control',
  'authentication-info',
  'clear-site-data',
  'optional-www-authenticate',
  'proxy-authenticate',
  'proxy-authentication-info',
  'public-key-pins',
  'sec-websocket-accept',
  'set-cookie',
  'set-cookie2',
  'setprofile',
  'strict-transport-security',
  'www-authenticate'
]

const ignoreHeaders = [
  ...statefulRequestHeaders,
  ...uncachedHeaders
]

const shouldIgnoreHeader = name => {
  return ignoreHeaders.includes(name.toLowerCase())
}

module.exports = { shouldIgnoreHeader }
