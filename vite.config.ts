import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
const repositoryName = env.GITHUB_REPOSITORY?.split('/')[1] ?? ''

export default defineConfig({
  base: env.GITHUB_ACTIONS ? `/${repositoryName}/` : '/',
  plugins: [react()],
})
