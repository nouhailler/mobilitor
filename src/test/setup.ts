import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { webcrypto } from 'node:crypto';
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
