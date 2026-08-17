import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '#/styles.css?url'
import archivoFont from '#/assets/fonts/archivo-subset.woff2?url'
import notoSansJpFont from '#/assets/fonts/noto-sans-jp-subset.woff2?url'

/** The field colour, duplicated from --color-field. Meta tags cannot read a custom property. */
const FIELD = '#7B8F63'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        // viewport-fit=cover puts the app under the camera housing and home indicator; the shell
        // pays that back with env(safe-area-inset-*). user-scalable=no because this is a fixed
        // single-viewport composition — a pinch zoom can only break it.
        content:
          'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
      },
      { title: 'Matcha Lab' },
      {
        name: 'description',
        content: 'Nine matcha drinks, one at a time.',
      },

      // Home-screen install. Icon art is deferred; the wiring is not.
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Matcha Lab' },
      // black-translucent so the field runs under the status bar rather than stopping at it.
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: FIELD },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'apple-touch-icon', href: '/icons/icon-180.png' },
      // Preloaded rather than swapped: font-display is `block`, and 28 KB arriving early beats
      // a flash of the system CJK face at 450px.
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: notoSansJpFont,
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: archivoFont,
        crossOrigin: 'anonymous',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: FIELD }}>
      <head>
        <HeadContent />
      </head>
      {/* Painted flat before anything renders, so there is no white flash while the GPU device
          resolves. This is first paint, not a WebGPU fallback — there is no fallback path. */}
      <body style={{ backgroundColor: FIELD }}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
