const decodeUrl = url => {
  if (!url.startsWith('https://')) return url
  const { origin, pathname } = new URL(url)
  return `${origin}${decodeURIComponent(pathname)}`
}

const encodeUrl = url => {
  const { origin, pathname } = new URL(url)
  return `${origin}${pathname}`
}

module.exports = {
  encodeUrl,
  decodeUrl
}
