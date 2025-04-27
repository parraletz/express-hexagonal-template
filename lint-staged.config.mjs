const config = {
  '**/*.{html,json,css,scss,md,mdx}': ['prettier -w'],
  '**/*.{js,ts,jsx,tsx}': ['eslint --fix']
}

export default config
