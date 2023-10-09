import { defineConfig } from 'astro/config';
import deno from "@astrojs/deno";
import tailwind from "@astrojs/tailwind";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: deno(),
  integrations: [tailwind(), solidJs()]
});