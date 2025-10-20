# Next.js Example - Universal FHEVM SDK

**Next.js application demonstrating Universal FHEVM SDK integration**

This example shows how to use `@fhevm/sdk` in a Next.js application to build privacy-preserving dApps.

## Features

- ✅ **FhevmProvider** integration in `_app.tsx`
- ✅ **React hooks** (`useEncrypt`, `useFhevmInstance`)
- ✅ **MetaMask connection**
- ✅ **Encrypted data submission** to smart contract
- ✅ **Real-time status updates**
- ✅ **Responsive design**

## Quick Start

### 1. Install Dependencies

```bash
cd examples/nextjs
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x8Ac1d3E49A73F8328e43719dCF6fBfeF4405937B
NEXT_PUBLIC_NETWORK=sepolia
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## SDK Integration

### 1. Wrap App with FhevmProvider

```typescript
// pages/_app.tsx
import { FhevmProvider } from '@fhevm/sdk/react'

export default function App({ Component, pageProps }) {
  return (
    <FhevmProvider config={{ network: 'sepolia' }}>
      <Component {...pageProps} />
    </FhevmProvider>
  )
}
```

### 2. Use SDK Hooks in Components

```typescript
// pages/index.tsx
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'

export default function Home() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt, isEncrypting } = useEncrypt()

  const handleSubmit = async (value: number) => {
    // Encrypt with SDK
    const encrypted = await encrypt(value, 'uint32')

    // Submit to contract
    await contract.submitData(encrypted)
  }

  return (
    <div>
      <button onClick={() => handleSubmit(42)}>
        Submit Encrypted Data
      </button>
    </div>
  )
}
```

## Code Structure

```
examples/nextjs/
├── src/
│   ├── pages/
│   │   ├── _app.tsx       # FhevmProvider setup
│   │   └── index.tsx      # Main page with SDK usage
│   └── styles/
│       └── globals.css    # Styling
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Build for Production

```bash
npm run build
npm start
```

## Deploy

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t fhevm-nextjs .
docker run -p 3000:3000 fhevm-nextjs
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Universal FHEVM SDK](../../README.md)
- [Zama Documentation](https://docs.zama.ai)

## License

MIT
