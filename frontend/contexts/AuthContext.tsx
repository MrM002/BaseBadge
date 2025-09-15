'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { getToken, saveToken, clearToken } from '../lib/token'

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  address: `0x${string}` | null;
  login: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Resolve API base: prefer explicit public URL, fallback to Next.js `/api` (rewrites)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const { address: walletAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [token, setToken] = useState<string | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore from storage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('bb_token');
        const a = window.localStorage.getItem('bb_address') as `0x${string}` | null;
        if (t) setToken(t);
        if (a) setAddress(a);
      }
    } catch {
      /* no-op */
    }
  }, []);

  // Sync address with connected wallet
  useEffect(() => {
    if (walletAddress) {
      setAddress(walletAddress);
      try {
        window.localStorage.setItem('bb_address', walletAddress);
      } catch {
        /* no-op */
      }
    } else {
      setAddress(null);
    }
  }, [walletAddress]);

  const login = async () => {
    if (!isConnected || !walletAddress) throw new Error('Wallet not connected');
    setIsLoading(true);
    try {
      // 1) Get nonce
      const nonceRes = await fetch(
        `${API_BASE}/auth/nonce?address=${walletAddress}`,
        { cache: 'no-store' }
      );
      if (!nonceRes.ok) throw new Error('Failed to get nonce');
      const { nonce } = (await nonceRes.json()) as { nonce: string };
      if (!nonce) throw new Error('Invalid nonce response');

      // 2) Sign nonce
      const signature = await signMessageAsync({ message: nonce });

      // 3) Verify + get JWT
      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ address: walletAddress, signature }),
      });
      if (!verifyRes.ok) throw new Error('Failed to verify');
      const { token: jwt } = (await verifyRes.json()) as { token: string };
      if (!jwt) throw new Error('Invalid token response');

      setToken(jwt);
      try {
        saveToken(jwt);
        window.localStorage.setItem('bb_address', walletAddress);
      } catch {
        /* no-op */
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If wallet changes, drop token that belongs to previous wallet
  useEffect(() => {
    const stored =
      (typeof window !== 'undefined' &&
        window.localStorage.getItem('bb_address')) as `0x${string}` | null;

    if (
      token &&
      stored &&
      walletAddress &&
      stored.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      try {
        clearToken();
        window.localStorage.setItem('bb_address', walletAddress);
      } catch {
        /* no-op */
      }
      setToken(null);
    }
  }, [walletAddress, token]);

  const logout = () => {
    try {
      clearToken();
      window.localStorage.removeItem('bb_address');
    } catch {
      /* no-op */
    }
    setToken(null);
    setAddress(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: !!token,
      isLoading,
      address,
      login,
      logout,
    }),
    [token, isLoading, address]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return (
    useContext(AuthContext) ?? {
      token: null,
      isAuthenticated: false,
      isLoading: false,
      address: null,
      login: async () => {},
      logout: () => {},
    }
  );
}
