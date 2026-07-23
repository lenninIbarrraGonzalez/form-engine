# Code Review Rules

## TypeScript
- Use const/let, never var
- Prefer interfaces over types where appropriate
- Avoid `any` types; use `unknown` and narrow
- Strict mode enabled; no implicit any

## React
- Use functional components with hooks
- Prefer named exports
- Wrap side effects in useEffect

## Testing
- Strict TDD: write tests before implementation
- Pure functions preferred for testability
- No trivial assertions (tautologies, type-only)

## General
- Conventional commits (feat, fix, chore, refactor)
- No AI attribution in commits
- English identifiers and comments
