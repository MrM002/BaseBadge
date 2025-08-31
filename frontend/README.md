# BaseBadge Frontend 🎨

> **React.js Frontend Application with TypeScript & Tailwind CSS**

## 📋 **Overview**

The BaseBadge frontend is a modern, responsive React.js application that provides users with an intuitive interface for managing their decentralized identity and reputation. Built with TypeScript, Tailwind CSS, and modern React patterns, it offers a seamless user experience across all devices.

## 🏗️ **Architecture**

```
Frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # React contexts
│   ├── services/       # API and external services
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── styles/         # Global styles and Tailwind config
│   └── assets/         # Images, icons, and static files
├── public/             # Public assets
├── tests/              # Test files
└── docs/               # Component documentation
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **Installation**

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

5. **Preview production build**
```bash
npm run preview
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BASE_NETWORK_ID=8453

# Blockchain Configuration
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_ETHERSCAN_URL=https://basescan.org

# External Services
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-key
NEXT_PUBLIC_ZERION_API_KEY=your-zerion-key

# Feature Flags
NEXT_PUBLIC_ENABLE_FARCASTER=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### **Tailwind Configuration**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## 📚 **Component Documentation**

### **Core Components**

#### **Layout Components**
- `Layout` - Main application layout
- `Header` - Navigation header
- `Sidebar` - Side navigation
- `Footer` - Application footer

#### **UI Components**
- `Button` - Reusable button component
- `Card` - Content container component
- `Modal` - Modal dialog component
- `Input` - Form input component
- `Badge` - Status and label component

#### **Feature Components**
- `WalletConnect` - Wallet connection component
- `ReputationScore` - Reputation display component
- `BadgeDisplay` - Badge showcase component
- `ProfileCard` - User profile component

### **Component Usage Examples**

#### **Button Component**
```tsx
import { Button } from '@/components/ui/Button';

// Primary button
<Button variant="primary" size="lg" onClick={handleClick}>
  Connect Wallet
</Button>

// Secondary button
<Button variant="secondary" size="md" disabled>
  Loading...
</Button>

// Icon button
<Button variant="ghost" size="sm" icon={<Icon />}>
  Settings
</Button>
```

#### **Card Component**
```tsx
import { Card } from '@/components/ui/Card';

<Card>
  <Card.Header>
    <Card.Title>Reputation Score</Card.Title>
    <Card.Description>Your current reputation on Base network</Card.Description>
  </Card.Header>
  <Card.Content>
    <ReputationScore score={85.5} />
  </Card.Content>
  <Card.Footer>
    <Button>View Details</Button>
  </Card.Footer>
</Card>
```

## 🎣 **Custom Hooks**

### **useWallet Hook**
```tsx
import { useWallet } from '@/hooks/useWallet';

const { 
  address, 
  isConnected, 
  connect, 
  disconnect, 
  balance 
} = useWallet();

// Usage
if (isConnected) {
  console.log(`Connected: ${address}`);
  console.log(`Balance: ${balance} ETH`);
}
```

### **useReputation Hook**
```tsx
import { useReputation } from '@/hooks/useReputation';

const { 
  score, 
  loading, 
  error, 
  refresh 
} = useReputation(address);

// Usage
useEffect(() => {
  if (address) {
    refresh();
  }
}, [address]);
```

### **useLocalStorage Hook**
```tsx
import { useLocalStorage } from '@/hooks/useLocalStorage';

const [userPreferences, setUserPreferences] = useLocalStorage(
  'user-preferences',
  defaultPreferences
);

// Usage
const updateTheme = (theme) => {
  setUserPreferences(prev => ({ ...prev, theme }));
};
```

## 🌐 **API Integration**

### **API Service Structure**
```typescript
// services/api.ts
class ApiService {
  private baseURL: string;
  private headers: HeadersInit;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  // Reputation API
  async getReputation(address: string): Promise<ReputationData> {
    const response = await fetch(`${this.baseURL}/api/reputation/${address}`);
    return response.json();
  }

  // User API
  async updateProfile(data: ProfileData): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/users/profile`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export const apiService = new ApiService();
```

### **API Error Handling**
```tsx
// hooks/useApi.ts
const useApi = <T>(apiCall: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};
```

## 🎨 **Styling & Design System**

### **Design Tokens**
```css
/* styles/design-tokens.css */
:root {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-8: 2rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### **Component Variants**
```tsx
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
    ghost: 'text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

## 🧪 **Testing**

### **Testing Structure**
```bash
tests/
├── components/         # Component tests
├── hooks/             # Hook tests
├── utils/             # Utility tests
├── integration/       # Integration tests
└── fixtures/          # Test data
```

### **Component Testing**
```tsx
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies variant classes correctly', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    
    expect(button).toHaveClass('bg-primary-500');
  });
});
```

### **Hook Testing**
```tsx
// tests/hooks/useWallet.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';

describe('useWallet Hook', () => {
  test('initializes with disconnected state', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBe(null);
  });

  test('connects wallet successfully', async () => {
    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await result.current.connect();
    });
    
    expect(result.current.isConnected).toBe(true);
  });
});
```

## 📱 **Responsive Design**

### **Breakpoint System**
```css
/* Tailwind breakpoints */
sm: '640px'   /* Small devices */
md: '768px'   /* Medium devices */
lg: '1024px'  /* Large devices */
xl: '1280px'  /* Extra large devices */
2xl: '1536px' /* 2X large devices */
```

### **Mobile-First Approach**
```tsx
// Responsive component example
const ProfileCard = () => {
  return (
    <div className="
      w-full                    /* Mobile: full width */
      md:w-96                  /* Medium+: fixed width */
      lg:w-[28rem]             /* Large+: larger width */
      p-4                      /* Mobile: smaller padding */
      md:p-6                   /* Medium+: larger padding */
      space-y-3                /* Mobile: smaller spacing */
      md:space-y-4             /* Medium+: larger spacing */
    ">
      {/* Content */}
    </div>
  );
};
```

## 🚀 **Performance Optimization**

### **Code Splitting**
```tsx
// Lazy loading components
import dynamic from 'next/dynamic';

const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const AdvancedSettings = dynamic(() => import('@/components/AdvancedSettings'), {
  loading: () => <SettingsSkeleton />,
});
```

### **Image Optimization**
```tsx
import Image from 'next/image';

// Optimized image component
<Image
  src="/images/avatar.jpg"
  alt="User Avatar"
  width={64}
  height={64}
  className="rounded-full"
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### **Bundle Analysis**
```bash
# Analyze bundle size
npm run build:analyze

# Generate bundle report
npm run build:report
```

## 🔧 **Development Tools**

### **ESLint Configuration**
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### **Prettier Configuration**
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### **Git Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 📚 **Additional Resources**

### **Documentation**
- [Component Library](docs/components.md)
- [Design System](docs/design-system.md)
- [API Integration](docs/api-integration.md)
- [Testing Guide](docs/testing.md)

### **External Dependencies**
- [React.js](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Next.js](https://nextjs.org/)

## 🤝 **Contributing**

Please read our [Contributing Guide](../docs/contributing.md) before submitting changes.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**For more information, visit our [main documentation](../docs/README.md).** 