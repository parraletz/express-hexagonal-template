const config = {
  '**/*.{html,json,css,scss,md,mdx}': ['prettier -w'],
  '**/*.{js,ts,jsx,tsx}': ['eslint --fix', 'pnpm test']
}

export default config
