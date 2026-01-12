# Changesets

Hello! 👋

This folder contains "changeset" files - each one describes a change to the package.

## Quick Start

### Adding a changeset

When you make a change that should trigger a release:

```bash
npm run changeset
```

Follow the prompts:
1. **Select change type**: patch, minor, or major
2. **Write a summary**: Describe what changed

### What happens next?

1. Commit the changeset file
2. Push to `main` branch
3. GitHub Action creates a "Version Packages" PR
4. Merge that PR to publish

## Change Types

- **patch** (1.0.0 → 1.0.1): Bug fixes
- **minor** (1.0.0 → 1.1.0): New features
- **major** (1.0.0 → 2.0.0): Breaking changes

## Example

```bash
# Make your changes
git add .
git commit -m "fix: timezone validation"

# Add changeset
npm run changeset
# → Select: patch
# → Summary: "Fix timezone offset range to support UTC-12 to UTC+14"

# Commit and push
git add .changeset
git commit -m "chore: add changeset"
git push
```

## Learn More

- [Changesets Documentation](https://github.com/changesets/changesets)
- See `PUBLISHING.md` for full workflow details
