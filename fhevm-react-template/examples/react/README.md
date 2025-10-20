# React (Vite) Example - Universal FHEVM SDK

**React + Vite application demonstrating Universal FHEVM SDK integration**

This example shows how to use `@fhevm/sdk` in a modern React application built with Vite.

## Features

- ✅ **FhevmProvider** integration in entry point
- ✅ **React hooks** (`useEncrypt`, `useFhevmInstance`)
- ✅ **Fast development** with Vite HMR
- ✅ **TypeScript** support
- ✅ **MetaMask** integration
- ✅ **Responsive** design

## Quick Start

### 1. Install Dependencies

```bash
cd examples/react
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to see the app.

## SDK Integration

### 1. Wrap App with FhevmProvider

```typescript
// src/main.tsx
import { FhevmProvider } from '@fhevm/sdk/react'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FhevmProvider config={{ network: 'sepolia' }}>
      <App />
    </FhevmProvider>
  </React.StrictMode>,
)
```

### 2. Use SDK Hooks

```typescript
// src/App.tsx
import { useFhevmInstance, useEncrypt } from '@fhevm/sdk/react'

function App() {
  const { fhevm, isReady } = useFhevmInstance()
  const { encrypt } = useEncrypt()

  const handleSubmit = async (value: number) => {
    const encrypted = await encrypt(value, 'uint32')
    await contract.submitData(encrypted)
  }

  return <button onClick={() => handleSubmit(42)}>Submit</button>
}
```

## Code Structure

```
examples/react/
├── src/
│   ├── main.tsx          # Entry point with FhevmProvider
│   ├── App.tsx           # Main component with SDK usage
│   ├── App.css           # Component styling
│   └── index.css         # Global styling
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Build for Production

```bash
npm run build
npm run preview
```

## Why Vite?

- ⚡ Lightning-fast HMR
- 📦 Optimized builds
- 🔧 Simple configuration
- 🎯 Modern tooling

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [Universal FHEVM SDK](../../README.md)
- [React Documentation](https://react.dev/)

## License

MIT
