import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ErrorBoundaryWithFallback } from '../error-boundary-with-fallback';
import { PlayerErrorBoundary } from '../player-error-boundary';

// Mock the error monitoring module
jest.mock('@/lib/monitoring/error-monitoring', () => ({
  errorMonitor: {
    captureError: jest.fn(),
  },
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to suppress error output in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ErrorBoundaryWithFallback', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundaryWithFallback>
        <ThrowError shouldThrow={false} />
      </ErrorBoundaryWithFallback>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('displays default error fallback when child throws', () => {
    render(
      <ErrorBoundaryWithFallback>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWithFallback>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays custom fallback when provided', () => {
    render(
      <ErrorBoundaryWithFallback
        fallback={<div>Custom error message</div>}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWithFallback>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundaryWithFallback onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWithFallback>
    );
    
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('resets error state when Try Again button is clicked', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix Error</button>
          <ErrorBoundaryWithFallback>
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundaryWithFallback>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Click fix error button first to prevent re-throwing
    await user.click(screen.getByText('Fix Error'));
    
    // Then click try again
    await user.click(screen.getByRole('button', { name: /try again/i }));
    
    // Error boundary should reset and show normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    });
    
    render(
      <ErrorBoundaryWithFallback>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWithFallback>
    );
    
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    });
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true
    });
    
    render(
      <ErrorBoundaryWithFallback>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWithFallback>
    );
    
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    });
  });
});

describe('PlayerErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <PlayerErrorBoundary>
        <ThrowError shouldThrow={false} />
      </PlayerErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('displays player-specific error message when child throws', () => {
    render(
      <PlayerErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PlayerErrorBoundary>
    );
    
    expect(screen.getByText('Player unavailable. Please refresh to restore playback.')).toBeInTheDocument();
  });

  it('calls console.error when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    
    render(
      <PlayerErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PlayerErrorBoundary>
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Player Error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
    
    consoleSpy.mockRestore();
  });
});