import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loginSchema } from '@/lib/auth/validation';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Simple component mocks that work
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, isLoading, ...props }: any) => (
    <button disabled={disabled || isLoading} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ label, error, ...props }: any) => (
    <div>
      <label htmlFor={props.id}>{label}</label>
      <input {...props} />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

jest.mock('@/components/ui/form-error', () => ({
  FormError: ({ message }: { message?: string }) => 
    message ? <div role="alert" data-testid="form-error">{message}</div> : null,
  FormSuccess: ({ message }: { message?: string }) => 
    message ? <div role="status" data-testid="form-success">{message}</div> : null,
}));

import { LoginForm } from '../login-form';
import { signIn } from 'next-auth/react';

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('from');
    mockSearchParams.delete('message');
  });

  it('should render basic form elements', () => {
    render(<LoginForm />);

    expect(screen.getByText('Email address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display success message from URL params', () => {
    mockSearchParams.set('message', 'Registration successful! Please log in.');

    render(<LoginForm />);

    expect(screen.getByTestId('form-success')).toHaveTextContent(
      'Registration successful! Please log in.'
    );
  });
});

describe('Login Form Validation Logic', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    };
    
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
    };
    
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('should reject empty password', () => {
    const invalidData = {
      email: 'test@example.com',
      password: '',
    };
    
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
    }
  });

  it('should accept optional rememberMe field', () => {
    const validData1 = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };
    
    const validData2 = {
      email: 'test@example.com',
      password: 'password123',
    };
    
    expect(loginSchema.safeParse(validData1).success).toBe(true);
    expect(loginSchema.safeParse(validData2).success).toBe(true);
  });
});