# AidLink Frontend

A production-grade decentralized humanitarian aid platform frontend built on the Stellar blockchain.

## 🌟 Features

- **Transparent Donations**: Every transaction is tracked on the Stellar blockchain
- **Campaign Management**: Create, fund, and track humanitarian aid campaigns
- **Beneficiary Portal**: Claim aid with QR verification and track claim history
- **Admin Dashboard**: Verify beneficiaries, moderate campaigns, and monitor platform activity
- **Real-time Analytics**: Track donations, distributions, and impact metrics
- **Multi-wallet Support**: Compatible with Freighter, Rabet, XBull, and more
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Built-in theme switching
- **Accessibility**: WCAG 2.1 AA compliant

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Animations**: Framer Motion
- **Blockchain**: Stellar SDK + Soroban
- **Wallet Integration**: Stellar Wallet Kit
- **Testing**: Jest + Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/aidlink-frontend.git
cd aidlink-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_AID_TOKEN_CONTRACT=your_contract_id
NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT=your_contract_id
NEXT_PUBLIC_BENEFICIARY_REGISTRY_CONTRACT=your_contract_id
```

### Network Configuration

The application supports multiple Stellar networks:
- **Testnet**: Default for development
- **Futurenet**: For testing new features
- **Mainnet**: For production use

## 📁 Project Structure

```
aidlink-frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (dashboard)/  # Dashboard pages
│   │   ├── (public)/     # Public pages
│   │   ├── api/          # API routes
│   │   ├── campaigns/    # Campaign pages
│   │   ├── beneficiary/  # Beneficiary portal
│   │   └── admin/        # Admin portal
│   ├── components/       # React components
│   │   ├── features/     # Feature-specific components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   └── soroban/      # Soroban SDK integration
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   ├── config/           # Configuration files
│   └── utils/            # Utility functions
├── e2e/                  # Playwright E2E tests
├── public/               # Static assets
├── .github/              # GitHub Actions workflows
└── docs/                 # Documentation
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## 🐳 Docker

Build the Docker image:
```bash
docker build -t aidlink-frontend .
```

Run the container:
```bash
docker run -p 3000:3000 aidlink-frontend
```

## 🚢 Deployment

### Vercel

The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Docker

Deploy using Docker to any container registry:
```bash
docker build -t aidlink-frontend .
docker tag aidlink-frontend your-registry/aidlink-frontend
docker push your-registry/aidlink-frontend
```

## 📚 Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Component Documentation](./docs/COMPONENTS.md)
- [API Documentation](./docs/API.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) before submitting a pull request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Stellar Development Foundation
- shadcn/ui
- Vercel
- The open-source community

## 📞 Support

For support, email support@aidlink.org or open an issue on GitHub.
