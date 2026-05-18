# AidLink Architecture Documentation

## Overview

AidLink is a decentralized humanitarian aid platform built on the Stellar blockchain. This document describes the architecture, design decisions, and technical implementation details.

## System Architecture

### Frontend Architecture

The frontend follows a modern React architecture using Next.js 15 with the App Router:

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                     │
├─────────────────────────────────────────────────────────┤
│  Pages (src/app/)                                        │
│  ├── Landing Page (public)                              │
│  ├── Authentication (auth)                              │
│  ├── Dashboard (dashboard)                              │
│  ├── Campaigns (campaigns)                              │
│  ├── Beneficiary Portal (beneficiary)                    │
│  └── Admin Portal (admin)                                │
├─────────────────────────────────────────────────────────┤
│  Components (src/components/)                            │
│  ├── UI Components (shadcn/ui)                          │
│  ├── Feature Components (features/)                      │
│  └── Layout Components (layout/)                          │
├─────────────────────────────────────────────────────────┤
│  State Management (src/store/)                           │
│  ├── Wallet Store (Zustand)                              │
│  └── UI Store (Zustand)                                  │
├─────────────────────────────────────────────────────────┤
│  Data Layer (src/hooks/)                                 │
│  ├── Contract Hooks (use-contract.ts)                   │
│  └── Wallet Hooks (use-wallet.ts)                        │
├─────────────────────────────────────────────────────────┤
│  Blockchain Integration (src/lib/soroban/)               │
│  └── Soroban SDK (sdk.ts)                                │
└─────────────────────────────────────────────────────────┘
```

### Blockchain Integration

The platform integrates with Stellar blockchain through Soroban smart contracts:

- **Contract Interaction**: Direct contract calls via Soroban SDK
- **Transaction Signing**: Wallet-based transaction signing
- **Event Listening**: Real-time event monitoring
- **Network Support**: Testnet, Futurenet, and Mainnet

### Key Design Decisions

#### 1. App Router over Pages Router
- **Reason**: Better performance, streaming support, and modern features
- **Benefit**: Improved SEO, faster initial load, better DX

#### 2. Zustand for State Management
- **Reason**: Lightweight, simple API, no context provider needed
- **Benefit**: Reduced bundle size, easier testing

#### 3. React Query for Data Fetching
- **Reason**: Automatic caching, refetching, and background updates
- **Benefit**: Better UX with optimistic updates and loading states

#### 4. shadcn/ui for Component Library
- **Reason**: Customizable, accessible, built on Radix UI
- **Benefit**: Consistent design system, full control over components

## Data Flow

### Wallet Connection Flow

```
User clicks "Connect Wallet"
    ↓
useConnectWallet hook called
    ↓
Stellar Wallet Kit integration
    ↓
Wallet address retrieved
    ↓
Update Zustand store
    ↓
Persist to localStorage
    ↓
Update UI state
```

### Donation Flow

```
User enters donation amount
    ↓
Validate input
    ↓
Create transaction via Soroban SDK
    ↓
Sign transaction with wallet
    ↓
Submit to Stellar network
    ↓
Wait for confirmation
    ↓
Update campaign state
    ↓
Show success message
```

### Campaign Creation Flow

```
User fills campaign form
    ↓
Validate form data
    ↓
Upload images (if any)
    ↓
Create campaign via API
    ↓
Deploy smart contract (if needed)
    ↓
Store campaign metadata
    ↓
Redirect to campaign details
```

## Security Considerations

### Client-Side Security
- Input validation on all forms
- XSS protection via React's built-in escaping
- CSRF protection via Next.js API routes
- Secure localStorage handling

### Blockchain Security
- Transaction verification before submission
- Network validation (testnet vs mainnet)
- Contract address validation
- Wallet signature verification

### API Security
- Environment variable protection
- Rate limiting on API routes
- Request validation
- Error message sanitization

## Performance Optimization

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting via Next.js
- Lazy loading of images

### Caching Strategy
- React Query for API caching
- Next.js static generation where possible
- Image optimization via Next.js Image component

### Bundle Optimization
- Tree shaking via webpack
- Minification in production
- External library optimization

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch-friendly interactions
- Adaptive layouts

## Testing Strategy

### Unit Testing
- Component testing with Jest + React Testing Library
- Hook testing with custom render functions
- Utility function testing

### Integration Testing
- API route testing
- Contract interaction testing
- State management testing

### E2E Testing
- Playwright for cross-browser testing
- Critical user path testing
- Visual regression testing

## Deployment Architecture

### Development
- Local development with Next.js dev server
- Hot module replacement
- Fast refresh

### Staging
- Vercel preview deployments
- Automated testing on PRs
- Environment-specific configuration

### Production
- Vercel edge deployment
- CDN for static assets
- Automatic SSL
- DDoS protection

## Monitoring and Observability

### Error Tracking
- Client-side error logging
- API error monitoring
- Transaction failure tracking

### Analytics
- User behavior tracking
- Campaign performance metrics
- Donation analytics

### Performance Monitoring
- Core Web Vitals tracking
- API response times
- Bundle size monitoring

## Scalability Considerations

### Frontend Scaling
- Static page generation
- Edge caching
- CDN distribution

### Backend Scaling
- API route optimization
- Database connection pooling
- Rate limiting

### Blockchain Scaling
- Contract optimization
- Batch transactions
- Gas optimization

## Future Enhancements

### Planned Features
- Multi-language support (i18n)
- Advanced analytics dashboard
- Mobile app (React Native)
- Offline support (PWA)
- Real-time notifications
- Advanced filtering and search

### Technical Improvements
- WebAssembly for heavy computations
- Service workers for caching
- WebRTC for peer-to-peer features
- IPFS for decentralized storage
