import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve a single vue entry for the bundler (duplicate copies → currentRenderingInstance / renderSlot crashes).
const appDir = dirname(fileURLToPath(import.meta.url))
const vueEsmBundler = resolve(appDir, 'node_modules/vue/dist/vue.esm-bundler.js')

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    './modules/spa-dev-ipc-workaround',
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  ssr: false,

  // DevTools wires vite-plugin-vue-tracer; with duplicate-Vue edge cases it can worsen slot/render bugs.
  devtools: {
    enabled: false
  },

  app: {
    head: {
      title: process.env.APP_TITLE || 'Disciple Tools'
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'neutral']
    }
  },

  runtimeConfig: {
    appName: process.env.APP_TITLE || 'Disciple Tools',
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    mailgunApiKey: process.env.MAILGUN_API_KEY || '',
    mailgunDomain: process.env.MAILGUN_DOMAIN || '',
    mailgunHost: process.env.MAILGUN_HOST || '',
    smtpFrom: process.env.SMTP_FROM || '',
    smtpFromName: process.env.SMTP_FROM_NAME || '',
    s3Endpoint: process.env.S3_ENDPOINT || '',
    s3Region: process.env.S3_REGION || '',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
    s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL || '',
    public: {
      appName: process.env.APP_TITLE || 'Disciple Tools',
      nodeEnv: process.env.NODE_ENV || '',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || ''
    }
  },

  // See https://github.com/nuxt/ui/issues/2622 — keep Reka on the same transpile path as the app.
  build: {
    transpile: ['vue', 'reka-ui']
  },

  // Off: Vite Environment API can split client graphs and trigger duplicate-Vue / renderSlot (.ce) crashes.
  // Dev IPC: use ./modules/spa-dev-ipc-workaround (nuxt/nuxt#34957) instead of enabling this flag.
  experimental: {
    viteEnvironmentApi: false
  },

  compatibilityDate: '2025-01-15',

  // Dedupe + explicit alias; hoistStatic off (pairs with hoisted-vnode ref warnings in some kits).
  vite: {
    resolve: {
      alias: {
        vue: vueEsmBundler
      },
      dedupe: ['vue', 'vue-router', '@vue/runtime-core', '@vue/runtime-dom']
    },
    vue: {
      template: {
        compilerOptions: {
          hoistStatic: false
        }
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
