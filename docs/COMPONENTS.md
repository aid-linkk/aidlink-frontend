# Component Documentation

This document provides an overview of the components used in the AidLink application.

## UI Components (shadcn/ui)

### Button
A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `asChild`: boolean
- `disabled`: boolean

**Usage:**
```typescript
<Button variant="primary" size="lg">
  Click me
</Button>
```

### Card
A container component with header, content, and footer sections.

**Components:**
- `Card`: Main container
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Description text
- `CardContent`: Main content area
- `CardFooter`: Footer section

**Usage:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input
A text input component with various types.

**Props:**
- `type`: 'text' | 'number' | 'email' | 'password' | etc.
- `placeholder`: string
- `disabled`: boolean
- `value`: string
- `onChange`: function

**Usage:**
```typescript
<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Badge
A small label component for status indicators.

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'outline'

**Usage:**
```typescript
<Badge variant="secondary">Status</Badge>
```

### Table
A table component with header, body, and footer.

**Components:**
- `Table`: Main container
- `TableHeader`: Header section
- `TableBody`: Body section
- `TableFooter`: Footer section
- `TableRow`: Row component
- `TableHead`: Header cell
- `TableCell`: Data cell

**Usage:**
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs
A tabbed interface component.

**Components:**
- `Tabs`: Main container
- `TabsList`: Tab list
- `TabsTrigger`: Individual tab trigger
- `TabsContent`: Tab content panel

**Usage:**
```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Dialog
A modal dialog component.

**Components:**
- `Dialog`: Main container
- `DialogTrigger`: Trigger button
- `DialogContent`: Dialog content
- `DialogHeader`: Header section
- `DialogTitle`: Title text
- `DialogDescription`: Description text
- `DialogFooter`: Footer section

**Usage:**
```typescript
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

### Skeleton
A loading placeholder component.

**Usage:**
```typescript
<Skeleton className="h-4 w-[250px]" />
```

### Empty State
A component for displaying empty states.

**Props:**
- `icon`: LucideIcon
- `title`: string
- `description`: string
- `action`: { label: string, onClick: function }

**Usage:**
```typescript
<EmptyState
  icon={Heart}
  title="No campaigns found"
  description="Create your first campaign to get started"
  action={{ label: "Create Campaign", onClick: () => {} }}
/>
```

### Error Boundary
A component for catching and displaying errors.

**Usage:**
```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Feature Components

### Navigation
Main navigation component with wallet connection status.

**Location:** `src/components/layout/navigation.tsx`

**Features:**
- Responsive design
- Wallet connection status
- Mobile menu
- Network switching

### Landing Page
Public landing page with hero, features, and CTAs.

**Location:** `src/components/features/landing/landing-page.tsx`

**Features:**
- Hero section
- Feature cards
- Statistics display
- Call-to-action buttons
- Animations with Framer Motion

## Layout Components

### Navigation
Main navigation bar component.

**Features:**
- Logo and branding
- Navigation links
- Wallet connection button
- Mobile responsive menu

## Custom Hooks

### useWallet
Hook for wallet connection and management.

**Location:** `src/hooks/use-wallet.ts`

**Returns:**
- `useConnectWallet`: Mutation for connecting wallet
- `useDisconnectWallet`: Mutation for disconnecting wallet
- `useSwitchNetwork`: Mutation for switching networks

### useContract
Hook for contract interactions.

**Location:** `src/hooks/use-contract.ts`

**Returns:**
- `useBalance`: Query for wallet balance
- `useContractInvoke`: Mutation for contract invocation
- `useTransactionSubmit`: Mutation for transaction submission
- `useTransactionStatus`: Query for transaction status

## State Management

### Wallet Store
Zustand store for wallet state.

**Location:** `src/store/wallet-store.ts`

**State:**
- `isConnected`: boolean
- `address`: string | null
- `publicKey`: string | null
- `network`: 'mainnet' | 'testnet' | 'futurenet' | 'standalone'
- `balance`: string

**Actions:**
- `setWallet`: Update wallet state
- `disconnect`: Disconnect wallet
- `switchNetwork`: Switch network

### UI Store
Zustand store for UI state.

**Location:** `src/store/ui-store.ts`

**State:**
- `sidebarOpen`: boolean
- `theme`: 'light' | 'dark' | 'system'

**Actions:**
- `setSidebarOpen`: Toggle sidebar
- `toggleSidebar`: Toggle sidebar
- `setTheme`: Set theme

## Utility Functions

### cn
Utility function for merging Tailwind CSS classes.

**Location:** `src/lib/utils.ts`

**Usage:**
```typescript
cn('base-class', 'additional-class', condition && 'conditional-class')
```

### formatAddress
Format wallet address for display.

**Location:** `src/lib/utils.ts`

**Usage:**
```typescript
formatAddress('GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7')
// Returns: 'GB5X...Q2K7'
```

### formatAmount
Format numbers for display.

**Location:** `src/lib/utils.ts`

**Usage:**
```typescript
formatAmount(1234.5678, 2)
// Returns: '1,234.57'
```

### formatDate
Format dates for display.

**Location:** `src/lib/utils.ts`

**Usage:**
```typescript
formatDate(new Date())
// Returns: 'May 18, 2026'
```

## Blockchain Integration

### Soroban SDK
Stellar blockchain integration layer.

**Location:** `src/lib/soroban/sdk.ts`

**Methods:**
- `getAccount`: Fetch account details
- `getBalance`: Fetch account balance
- `invokeContract`: Invoke smart contract method
- `submitTransaction`: Submit transaction to network
- `getTransactionStatus`: Get transaction status

**Usage:**
```typescript
import { sorobanSDK } from '@/lib/soroban/sdk'

const balance = await sorobanSDK.getBalance(accountId)
const result = await sorobanSDK.invokeContract(contractId, 'donate', [amount])
```

## Adding New Components

### Guidelines

1. Place components in appropriate directories
2. Use TypeScript for type safety
3. Add JSDoc comments for complex logic
4. Make components reusable
5. Follow existing naming conventions

### Example

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  description?: string
  className?: string
}

export function MyComponent({ title, description, className }: MyComponentProps) {
  return (
    <div className={cn('p-4', className)}>
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  )
}
```

## Component Testing

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Integration Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '@/components/layout/navigation'

describe('Navigation', () => {
  it('navigates to dashboard when wallet connected', () => {
    render(<Navigation />)
    // Test navigation logic
  })
})
```
