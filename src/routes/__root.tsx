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
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Matcha Lab' },
      {
        property: 'og:description',
        content: 'Nine matcha drinks, one at a time.',
      },
      { property: 'og:image', content: '/og.png' },
      { property: 'og:image:width', content: '1280' },
      { property: 'og:image:height', content: '640' },
      {
        property: 'og:image:alt',
        content: 'A matcha dessert displayed on the Matcha Lab interface.',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Matcha Lab' },
      {
        name: 'twitter:description',
        content: 'Nine matcha drinks, one at a time.',
      },
      { name: 'twitter:image', content: '/og.png' },
      {
        name: 'twitter:image:alt',
        content: 'A matcha dessert displayed on the Matcha Lab interface.',
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
      { rel: 'icon', href: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { rel: 'icon', href: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
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
      {/* Painted inline rather than left to the stylesheet, so the very first frame is the ground
          colour and never a white flash. */}
      <body style={{ backgroundColor: FIELD }}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
