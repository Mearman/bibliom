export default {
  // Package.json files - run syncpack to fix versions and formatting Use function form to prevent lint-staged from passing filenames as args Order: fix mismatches -> apply semver ranges -> format -> lint to verify
  '**/package.json': [
    // syncpack 15 folded fix-mismatches and set-semver-ranges into fix
    () => 'syncpack fix',
    () => 'syncpack lint'
  ],

  // TypeScript and JavaScript files in packages and apps. Turbo's cache scopes the run: only the package whose inputs changed re-lints, which is the same affected-projects behaviour the nx command provided.
  '{packages,apps}/**/*.{ts,tsx,js,jsx}': [
    () => 'sh -c "pnpm exec turbo run _lint -- --fix"'
  ],

  // Type check the packages whose inputs changed
  '*.{ts,tsx}': [
    () => 'sh -c "pnpm exec turbo run _typecheck"'
  ],

  // GitHub workflow files (actionlint only validates workflow files in .github/workflows/)
  '.github/workflows/*.yml': [
    'actionlint'
  ],

  '.github/workflows/*.yaml': [
    'actionlint'
  ]
};
