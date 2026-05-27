import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineNuxtModule, useNitro } from '@nuxt/kit'

/** Dev-only workaround for SPA (ssr: false) when experimental.viteEnvironmentApi is off — see nuxt/nuxt#34957 */
export default defineNuxtModule({
  meta: { name: 'disciple-tools:spa-dev-ipc-workaround' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev || nuxt.options.ssr) {
      return
    }

    nuxt.hook('vite:extendConfig', (_config, context) => {
      if (!context.isClient) {
        return
      }

      const nitro = useNitro()
      const clientManifestPath = pathToFileURL(
        resolve(nuxt.options.buildDir, 'dist/server/client.manifest.mjs')
      ).href

      nitro.options.virtual ||= {}
      nitro.options._config ||= {}
      nitro.options._config.virtual ||= {}

      for (const virtual of [nitro.options.virtual, nitro.options._config.virtual]) {
        virtual['#build/dist/server/server.mjs'] = 'export default () => {}'
        virtual['#build/dist/server/client.manifest.mjs']
          = `export { default } from ${JSON.stringify(clientManifestPath)}`
      }
    })
  }
})
