/**
 * Tests for LoginForm component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock login action
jest.mock('@/components/actions/login-action', () => ({
  loginAction: jest.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ログインフォームを表示する', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/メールアドレス|email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード|password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン|login/i })).toBeInTheDocument();
  });

  it('必須フィールドの検証を行う', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/メールアドレスは必須|email is required/i)).toBeInTheDocument();
    });
  });

  it('無効なメールアドレスのエラーを表示する', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/有効なメールアドレス|valid email/i)).toBeInTheDocument();
    });
  });

  it('有効な入力でフォームを送信する', async () => {
    const { loginAction } = require('@/components/actions/login-action');
    loginAction.mockResolvedValue({ success: true });

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    const passwordInput = screen.getByLabelText(/パスワード|password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPassword123#');

    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'TestPassword123#',
      });
    });
  });

  it('ログインエラーを表示する', async () => {
    const { loginAction } = require('@/components/actions/login-action');
    loginAction.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    const passwordInput = screen.getByLabelText(/パスワード|password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'WrongPassword');

    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials|認証情報が無効/i)).toBeInTheDocument();
    });
  });

  it('送信中はボタンを無効化する', async () => {
    const { loginAction } = require('@/components/actions/login-action');
    loginAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    const passwordInput = screen.getByLabelText(/パスワード|password/i);
    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPassword123#');
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
  });

  it('パスワードリセットリンクを表示する', () => {
    render(<LoginForm />);

    const resetLink = screen.getByText(/パスワードを忘れた|forgot password/i);
    expect(resetLink).toBeInTheDocument();
    expect(resetLink).toHaveAttribute('href', '/password-recovery');
  });
});
