declare global {
  interface Window {
    ChannelIO?: (...args: any[]) => void
    ChannelIOInitialized?: boolean
  }
}

export function loadChannelTalk() {
  if (typeof window === 'undefined') return
  if (window.ChannelIOInitialized) return

  const ch: any = function (...args: any[]) { ch.c(args) }
  ch.q = [] as any[]
  ch.c = (args: any) => ch.q.push(args)
  window.ChannelIO = ch

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.async = true
  script.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'
  document.head.appendChild(script)
  window.ChannelIOInitialized = true
}

export function bootChannelTalk(options: {
  memberId?: string; name?: string; mobileNumber?: string;
  tags?: string[]; customAttributes?: Record<string, string>;
}) {
  if (typeof window === 'undefined' || !window.ChannelIO) return
  window.ChannelIO('boot', {
    pluginKey: '20fce46d-60d5-4640-8ecd-6014864adaf8',
    memberId: options.memberId,
    profile: { name: options.name || '', mobileNumber: options.mobileNumber || '' },
    ...(options.tags && { tags: options.tags }),
    ...(options.customAttributes && { customAttributes: options.customAttributes }),
  })
}

export function openChannelTalk() {
  if (typeof window === 'undefined' || !window.ChannelIO) return
  window.ChannelIO('openChat')
}

export function shutdownChannelTalk() {
  if (typeof window === 'undefined' || !window.ChannelIO) return
  window.ChannelIO('shutdown')
}
