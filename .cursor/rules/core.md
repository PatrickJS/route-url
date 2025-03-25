# Core Rules for Cursor AI Interactions

## Project Context
This is a TypeScript-based URL routing library that supports browser, server, and in-memory routing with observable patterns.

## Code Style and Standards
- Use TypeScript with strict mode enabled
- Follow ESM module system
- Maintain consistent formatting:
  - 2-space indentation
  - 100 character line length
  - Single quotes for strings
  - Trailing commas in objects and arrays
  - No semicolons at the end of statements
  - Arrow function parentheses only when needed

## File Organization
- Source files: `src/` directory
- Test files: Co-located with source files using `.test.ts` suffix
- File naming: PascalCase for source files, matching pattern `^[A-Z][a-zA-Z0-9]*\.ts$`

## Testing Requirements
- Use Vitest for testing
- Maintain minimum 80% test coverage
- Write unit tests for all new functionality
- Include integration tests for routing scenarios

## Code Quality Rules
- No console.log statements in production code
- No debugger statements
- No unused variables
- Prefer const over let
- No var declarations
- Strict null checks
- No implicit any types

## Import Organization
- Group imports by type:
  1. Node.js built-in modules
  2. External dependencies
  3. Internal modules
- Sort imports alphabetically within groups
- Use named imports when possible

## Documentation
- Include JSDoc comments for public APIs
- Document complex routing patterns
- Keep README.md up to date with new features
- Include examples for common use cases

## Error Handling
- Use TypeScript's type system to prevent runtime errors
- Implement proper error boundaries for routing failures
- Provide meaningful error messages for debugging

## Performance Considerations
- Minimize unnecessary re-renders in routing components
- Optimize route matching algorithms
- Consider memory usage in long-running applications

## Security Guidelines
- Validate all URL inputs
- Sanitize route parameters
- Prevent XSS attacks through route parameters
- Follow security best practices for URL manipulation

## Accessibility
- Ensure routing changes are announced to screen readers
- Maintain focus management during navigation
- Support keyboard navigation

## Version Control
- Write clear commit messages
- Keep commits focused and atomic
- Follow semantic versioning for releases

## Tool Usage
- Use `edit_file` for code modifications
- Use `codebase_search` for finding relevant code
- Use `read_file` for understanding existing code
- Use `run_terminal_cmd` for necessary shell operations
- Use `grep_search` for finding specific patterns
- Use `list_dir` for exploring project structure
- Use `delete_file` for removing files

## Response Format
- Use markdown for all responses
- Include code blocks with appropriate language tags
- Provide clear explanations for code changes
- Include relevant context in explanations 