import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// SSR: restoran ditentukan dari domain yang dibuka, dan halaman Order membawa data per meja.
export default defineConfig({ output: 'server', adapter: cloudflare() });
