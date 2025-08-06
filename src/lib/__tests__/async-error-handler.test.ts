import {
  withErrorHandler,
  withSyncErrorHandler,
  createEventErrorHandler,
  useAsyncErrorHandler,
} from '../async-error-handler';
import { renderHook } from '@testing-library/react';

// Mock the error monitoring module
jest.mock('@/lib/monitoring/error-monitoring', () => ({
  errorMonitor: {
    captureError: jest.fn(),
  },
}));

const { errorMonitor } = require('@/lib/monitoring/error-monitoring');

// Mock console.warn to verify toast behavior
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('withErrorHandler', () => {
  it('returns result when function succeeds', async () => {
    const successFn = jest.fn().mockResolvedValue('success');
    
    const result = await withErrorHandler(successFn);
    
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(errorMonitor.captureError).not.toHaveBeenCalled();
  });

  it('captures error and re-throws when function fails', async () => {
    const error = new Error('Test error');
    const failFn = jest.fn().mockRejectedValue(error);
    
    await expect(withErrorHandler(failFn)).rejects.toThrow('Test error');
    
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('returns fallback value when provided and function fails', async () => {
    const error = new Error('Test error');
    const failFn = jest.fn().mockRejectedValue(error);
    
    const result = await withErrorHandler(failFn, { fallback: 'fallback' });
    
    expect(result).toBe('fallback');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('shows toast when showToast option is true', async () => {
    const error = new Error('Test error');
    const failFn = jest.fn().mockRejectedValue(error);
    
    await withErrorHandler(failFn, { fallback: null, showToast: true });
    
    expect(console.warn).toHaveBeenCalledWith('An error occurred. Please try again.');
  });

  it('includes context when provided', async () => {
    const error = new Error('Test error');
    const failFn = jest.fn().mockRejectedValue(error);
    const context = { userId: '123', action: 'test' };
    
    await withErrorHandler(failFn, { fallback: null, context });
    
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, context);
  });
});

describe('withSyncErrorHandler', () => {
  it('returns result when function succeeds', () => {
    const successFn = jest.fn().mockReturnValue('success');
    
    const result = withSyncErrorHandler(successFn);
    
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(errorMonitor.captureError).not.toHaveBeenCalled();
  });

  it('captures error and re-throws when function fails', () => {
    const error = new Error('Test error');
    const failFn = jest.fn().mockImplementation(() => {
      throw error;
    });
    
    expect(() => withSyncErrorHandler(failFn)).toThrow('Test error');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('returns fallback value when provided and function fails', () => {
    const error = new Error('Test error');
    const failFn = jest.fn().mockImplementation(() => {
      throw error;
    });
    
    const result = withSyncErrorHandler(failFn, { fallback: 'fallback' });
    
    expect(result).toBe('fallback');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });
});

describe('createEventErrorHandler', () => {
  it('executes function normally when no error occurs', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    const handler = createEventErrorHandler(mockFn);
    
    await handler('arg1', 'arg2');
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(errorMonitor.captureError).not.toHaveBeenCalled();
  });

  it('captures error and continues when function fails', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const handler = createEventErrorHandler(mockFn);
    
    // Should not throw
    await handler('arg1', 'arg2');
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('handles synchronous functions that throw', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockImplementation(() => {
      throw error;
    });
    const handler = createEventErrorHandler(mockFn);
    
    // Should not throw
    await handler('arg1', 'arg2');
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('shows toast when showToast option is true', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const handler = createEventErrorHandler(mockFn, { showToast: true });
    
    await handler();
    
    expect(console.warn).toHaveBeenCalledWith('An error occurred. Please try again.');
  });

  it('includes context when provided', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const context = { component: 'test-component' };
    const handler = createEventErrorHandler(mockFn, { context });
    
    await handler();
    
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, context);
  });
});

describe('useAsyncErrorHandler', () => {
  it('captures error and re-throws', () => {
    const { result } = renderHook(() => useAsyncErrorHandler());
    const errorHandler = result.current;
    
    const error = new Error('Test error');
    const context = { feature: 'test' };
    
    expect(() => errorHandler(error, context)).toThrow('Test error');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, context);
  });

  it('captures error without context', () => {
    const { result } = renderHook(() => useAsyncErrorHandler());
    const errorHandler = result.current;
    
    const error = new Error('Test error');
    
    expect(() => errorHandler(error)).toThrow('Test error');
    expect(errorMonitor.captureError).toHaveBeenCalledWith(error, undefined);
  });
});