/// <reference types="astro/client" />
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;
interface Env { API_URL?: string; DEFAULT_SITE_SLUG?: string }
declare namespace App { interface Locals extends Runtime {} }
