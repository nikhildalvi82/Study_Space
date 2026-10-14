import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) return 'firebase'
					if (id.includes('/node_modules/recharts/') || /\/node_modules\/d3-[^/]+\//.test(id)) return 'charts'
					if (/\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id) || id.includes('/node_modules/@remix-run/router/')) return 'react-vendor'
				},
			},
		},
	},
})