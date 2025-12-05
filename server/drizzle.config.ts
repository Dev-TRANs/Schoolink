import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schema.ts',
	out: "./src/db/migrations",
	verbose: true,
	strict: true,
	dialect: 'sqlite',
});
