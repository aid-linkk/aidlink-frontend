# Testing Guide

This guide covers testing strategies and best practices for the AidLink frontend application.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Test Coverage](#test-coverage)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

## Testing Strategy

We use a multi-layered testing approach:

1. **Unit Tests**: Test individual components and functions in isolation
2. **Integration Tests**: Test component interactions and data flow
3. **E2E Tests**: Test complete user flows and scenarios

### Testing Pyramid

```
        E2E Tests (10%)
       /              \
    Integration Tests (30%)
   /                    \
Unit Tests (60%)
```

## Unit Testing

Unit tests are written using Jest and React Testing Library.

### Setup

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Example Component Test

```typescript
// __tests__/components/NotificationCenter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationCenter } from '@/components/features/notification-center'
import { useNotificationStore } from '@/store/notification-store'

jest.mock('@/store/notification-store')

describe('NotificationCenter', () => {
  it('renders notification button', () => {
    render(<NotificationCenter />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('displays unread count badge', () => {
    (useNotificationStore as jest.Mock).mockReturnValue({
      unreadCount: 5,
      notifications: [],
    })
    render(<NotificationCenter />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(<NotificationCenter />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })
})
```

### Hook Testing

```typescript
// __tests__/hooks/useRealTimeTransactions.test.ts
import { renderHook, act } from '@testing-library/react'
import { useRealTimeTransactions } from '@/hooks/use-real-time-transactions'

describe('useRealTimeTransactions', () => {
  it('returns initial transactions', () => {
    const initialTransactions = [
      { id: '1', type: 'donation', amount: 100, to: 'Campaign A', status: 'completed', timestamp: new Date() }
    ]
    const { result } = renderHook(() => useRealTimeTransactions(initialTransactions))
    expect(result.current).toHaveLength(1)
  })
})
```

## Integration Testing

Integration tests test component interactions with stores and APIs.

### Example Store Integration Test

```typescript
// __tests__/stores/notification-store.test.ts
import { useNotificationStore } from '@/store/notification-store'

describe('NotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    })
  })

  it('adds notification', () => {
    const store = useNotificationStore.getState()
    store.addNotification({
      type: 'donation',
      title: 'Test',
      message: 'Test message',
    })
    expect(store.notifications).toHaveLength(1)
    expect(store.unreadCount).toBe(1)
  })

  it('marks notification as read', () => {
    const store = useNotificationStore.getState()
    store.addNotification({
      type: 'donation',
      title: 'Test',
      message: 'Test message',
    })
    store.markAsRead(store.notifications[0].id)
    expect(store.notifications[0].read).toBe(true)
    expect(store.unreadCount).toBe(0)
  })
})
```

## E2E Testing

E2E tests are written using Playwright.

### Setup

```bash
npx playwright install
```

### Example E2E Test

```typescript
// e2e/campaigns.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Campaigns Page', () => {
  test('displays campaign cards', async ({ page }) => {
    await page.goto('/campaigns')
    await expect(page.locator('text=Aid Campaigns')).toBeVisible()
    await expect(page.locator('.card')).toHaveCount(6)
  })

  test('filters campaigns by category', async ({ page }) => {
    await page.goto('/campaigns')
    await page.click('text=Emergency')
    await expect(page.locator('.card')).toHaveCount(2)
  })

  test('searches campaigns', async ({ page }) => {
    await page.goto('/campaigns')
    await page.fill('input[placeholder="Search campaigns..."]', 'flood')
    await expect(page.locator('.card')).toHaveCount(1)
  })
})
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test campaigns.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

## Test Coverage

We aim for high test coverage:

- **Components**: 80%+
- **Hooks**: 90%+
- **Stores**: 95%+
- **Utilities**: 95%+

### Generating Coverage Report

```bash
npm run test -- --coverage
```

Coverage reports are generated in the `coverage/` directory.

### Coverage Thresholds

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
}
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### E2E Tests Only

```bash
npm run test:e2e
```

### Watch Mode

```bash
npm test -- --watch
```

### Specific Test File

```bash
npm test -- NotificationCenter.test.tsx
```

## Writing Tests

### Test Naming

Use descriptive test names:

```typescript
// Good
it('displays notification badge when unread count > 0')

// Bad
it('works')
```

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
it('marks notification as read', () => {
  // Arrange
  const store = useNotificationStore.getState()
  store.addNotification({ type: 'donation', title: 'Test', message: 'Test' })
  
  // Act
  store.markAsRead(store.notifications[0].id)
  
  // Assert
  expect(store.notifications[0].read).toBe(true)
})
```

### Testing Async Operations

```typescript
it('loads campaign data', async () => {
  render(<CampaignPage id="1" />)
  await waitFor(() => {
    expect(screen.getByText('Emergency Relief')).toBeInTheDocument()
  })
})
```

### Testing User Interactions

```typescript
import { userEvent } from '@testing-library/user-event'

it('submits donation form', async () => {
  render(<DonationForm />)
  const user = userEvent.setup()
  
  await user.type(screen.getByLabelText('Amount'), '100')
  await user.click(screen.getByRole('button', { name: 'Donate' }))
  
  expect(screen.getByText('Donation successful')).toBeInTheDocument()
})
```

## Best Practices

### DO

- Write tests before implementing features (TDD)
- Keep tests simple and focused
- Use descriptive test names
- Test user behavior, not implementation details
- Mock external dependencies
- Keep tests fast
- Use test utilities and helpers

### DON'T

- Test implementation details
- Write overly complex tests
- Skip tests without good reason
- Test third-party libraries
- Make tests dependent on each other
- Use random data in tests
- Ignore test coverage warnings

### Testing Accessibility

```typescript
it('is accessible', () => {
  const { container } = render(<NotificationCenter />)
  expect(container).toBeAccessible()
})
```

### Testing Responsive Design

```typescript
it('displays correctly on mobile', () => {
  window.resizeTo(375, 667)
  render(<CampaignCard />)
  expect(screen.getByRole('button', { name: 'Donate' })).toBeVisible()
})
```

## Continuous Integration

Tests run automatically on:

- Every push to main/master
- Every pull request
- Every merge to main/master

### CI Configuration

The CI workflow (`.github/workflows/ci.yml`) runs:

1. Lint checks
2. Type checking
3. Unit tests with coverage
4. Build verification
5. E2E tests

## Troubleshooting

### Tests Timing Out

```typescript
// Increase timeout
it('loads slow data', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  }, { timeout: 10000 })
})
```

### Mock Issues

```typescript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks()
})
```

### Flaky Tests

- Use `waitFor` instead of `setTimeout`
- Avoid hardcoded delays
- Mock external dependencies properly
- Ensure tests are isolated

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
