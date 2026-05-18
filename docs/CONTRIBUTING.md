# Contributing to AidLink

Thank you for your interest in contributing to AidLink! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git
- A GitHub account

### Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/aidlink-frontend.git
cd aidlink-frontend
```

3. Install dependencies:
```bash
npm install
```

4. Create a branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

5. Make your changes and commit:
```bash
git add .
git commit -m "feat: add your feature description"
```

6. Push to your fork:
```bash
git push origin feature/your-feature-name
```

7. Create a pull request

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

### Commit Messages

Follow the Conventional Commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add campaign creation form
fix: resolve wallet connection issue on mobile
docs: update API documentation
```

### Code Style

- Use TypeScript for type safety
- Follow the existing code style
- Use Prettier for formatting
- Run ESLint before committing
- Write meaningful variable and function names

### Testing

- Write unit tests for new features
- Write integration tests for API routes
- Write E2E tests for critical user flows
- Ensure all tests pass before submitting PR

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the CHANGELOG.md
4. Submit a pull request with:
   - Clear description of changes
   - Related issue numbers
   - Screenshots for UI changes
   - Testing instructions

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── features/     # Feature-specific components
│   ├── layout/       # Layout components
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── store/            # Zustand stores
├── types/            # TypeScript types
├── config/           # Configuration files
└── utils/            # Utility functions
```

## Component Guidelines

### Creating Components

1. Place components in appropriate directories
2. Use TypeScript for type safety
3. Add JSDoc comments for complex functions
4. Make components reusable and composable
5. Use props interfaces for type definitions

Example:
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant, size, children, onClick }: ButtonProps) {
  // Component implementation
}
```

### Styling

- Use TailwindCSS for styling
- Follow the design system
- Use shadcn/ui components when possible
- Keep styles responsive

## API Guidelines

### Creating API Routes

1. Place routes in `src/app/api/`
2. Use TypeScript for request/response types
3. Add error handling
4. Validate input data
5. Return appropriate HTTP status codes

Example:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Process request
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Blockchain Integration

### Soroban Contract Integration

1. Use the Soroban SDK from `src/lib/soroban/sdk.ts`
2. Handle transaction errors gracefully
3. Provide loading states for blockchain operations
4. Verify transactions before submission

Example:
```typescript
import { sorobanSDK } from '@/lib/soroban/sdk'

async function donateToCampaign(contractId: string, amount: number) {
  try {
    const result = await sorobanSDK.invokeContract(
      contractId,
      'donate',
      [amount]
    )
    return result
  } catch (error) {
    console.error('Donation failed:', error)
    throw error
  }
}
```

## Documentation

### Updating Documentation

- Keep README.md up to date
- Document new features in appropriate docs
- Add code comments for complex logic
- Update API documentation for API changes

## Issue Reporting

When reporting issues, include:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node version)

## Questions and Support

- Check existing documentation first
- Search for similar issues
- Ask questions in GitHub Discussions
- Be patient and respectful

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (if applicable)

Thank you for contributing to AidLink!
