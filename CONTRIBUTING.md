# Contributing to Temporal Parser

Thank you for considering contributing to the Temporal Parser project!

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

### Building
```bash
npm run build
```

### Testing
```bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Linting
```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Clean Build
```bash
npm run clean
npm run build
```

## Project Structure

```
temporal-parser/
├── src/
│   ├── index.ts              # Public API exports
│   ├── lexer.ts              # Lexer implementation
│   ├── lexer-types.ts        # Lexer type definitions
│   ├── parser.ts             # Parser implementation
│   ├── parser-types.ts       # Parser AST types
│   ├── errors.ts             # Error classes
│   ├── combineTimezoneOffsets.ts  # Timezone offset combiner
│   ├── helpers/              # Helper utilities
│   └── **/*.test.ts          # Test files
├── dist/                     # Build output (generated)
└── coverage/                 # Coverage reports (generated)
```

## Testing Guidelines

- Write tests for all new features
- Maintain or improve code coverage (currently >91%)
- Use descriptive test names
- Group related tests with `describe` blocks
- Test both success and error cases

## Code Style

- Follow the existing code style
- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Prefer explicit types over inference for public APIs

## Commit Messages

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Build/tooling changes

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Update documentation if needed
6. Submit a pull request

## Questions?

Feel free to open an issue for questions or discussions.
