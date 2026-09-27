// Global test setup for QuickDrop Vitest tests
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill crypto.subtle for JSDOM test environment
// JSDOM ships with WebCrypto support in modern versions, but
// we ensure it is always available by falling back to Node's crypto module.
if (!globalThis.crypto?.subtle) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { webcrypto } = await import('crypto' as any);
  // Patch globalThis for tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto = webcrypto;
}

// Polyfill BroadcastChannel if not present in JSDOM
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    private static channels = new Map<string, Set<MockBroadcastChannel>>();

    constructor(name: string) {
      this.name = name;
      if (!MockBroadcastChannel.channels.has(name)) {
        MockBroadcastChannel.channels.set(name, new Set());
      }
      MockBroadcastChannel.channels.get(name)!.add(this);
    }

    postMessage(data: unknown) {
      const channels = MockBroadcastChannel.channels.get(this.name);
      channels?.forEach((ch) => {
        if (ch !== this && ch.onmessage) {
          ch.onmessage(new MessageEvent('message', { data }));
        }
      });
    }

    close() {
      MockBroadcastChannel.channels.get(this.name)?.delete(this);
    }
  }
  // @ts-expect-error - polyfill for tests
  globalThis.BroadcastChannel = MockBroadcastChannel;
}

// Polyfill URL.createObjectURL / revokeObjectURL (not present in JSDOM)
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  globalThis.URL.revokeObjectURL = vi.fn();
}

// Silence noisy console.warn/error in tests (still captures them)
// Uncomment if test output is too noisy:
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
