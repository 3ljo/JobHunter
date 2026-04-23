import { create } from 'zustand';
import axios from 'axios';

// Cache for the checkout page's USDT wallet config (server static).
// Avoids refiring the network call every time the user opens checkout.

export interface UsdtConfig {
  wallet: string;
  network: string;
}

interface CheckoutConfigState {
  usdtConfig: UsdtConfig | null;
  loaded: boolean;
  isLoading: boolean;

  _lastFetchedAt: number | null;
  _inFlight: Promise<void> | null;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
  clear: () => void;
}

const TTL_MS = 60_000;

async function runFetch(set: (partial: Partial<CheckoutConfigState>) => void): Promise<void> {
  set({ isLoading: true });
  const [usdtRes] = await Promise.allSettled([
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/usdt-config`),
  ]);
  set({
    usdtConfig: usdtRes.status === 'fulfilled'
      ? { wallet: usdtRes.value.data.wallet_address, network: usdtRes.value.data.network }
      : null,
    loaded: true,
    isLoading: false,
    _lastFetchedAt: Date.now(),
  });
}

export const useCheckoutConfigStore = create<CheckoutConfigState>((set, get) => ({
  usdtConfig: null,
  loaded: false,
  isLoading: false,
  _lastFetchedAt: null,
  _inFlight: null,

  load: async () => {
    const { _lastFetchedAt, _inFlight } = get();
    if (_inFlight) return _inFlight;
    if (_lastFetchedAt && Date.now() - _lastFetchedAt < TTL_MS) return;

    const promise = runFetch(set).finally(() => set({ _inFlight: null }));
    set({ _inFlight: promise });
    return promise;
  },

  refresh: async () => {
    const { _inFlight } = get();
    if (_inFlight) return _inFlight;
    const promise = runFetch(set).finally(() => set({ _inFlight: null }));
    set({ _inFlight: promise });
    return promise;
  },

  invalidate: () => set({ _lastFetchedAt: null }),

  clear: () => set({
    usdtConfig: null,
    loaded: false,
    isLoading: false,
    _lastFetchedAt: null,
    _inFlight: null,
  }),
}));
