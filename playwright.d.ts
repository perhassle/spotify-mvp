import { expect } from '@playwright/test';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveCountGreaterThan(expected: number): R;
      toHaveCountGreaterThanOrEqual(expected: number): R;
    }
  }
}

export {};