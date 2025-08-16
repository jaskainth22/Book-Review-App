import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LoginForm } from '../LoginForm'

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnGoogleLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onGoogleLogin: mockOnGoogleLogin
  }

  it('renders login form with all required fields', () => {
    render(<LoginForm {...defaultProps} />)

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('displays error message when provided', () => {
    const error = 'Invalid credentials'
    render(<LoginForm {...defaultProps} error={error} />)

    expect(screen.getByText(error)).toBeInTheDocument()
  })

  it('calls onGoogleLogin when Google button is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginForm {...defaultProps} />)

    const googleButton = screen.getByRole('button', { name: /sign in with google/i })
    await user.click(googleButton)

    expect(mockOnGoogleLogin).toHaveBeenCalled()
  })

  it('disables form when loading', () => {
    render(<LoginForm {...defaultProps} loading={true} />)

    const submitButton = screen.getByRole('button', { name: /signing in/i })
    const googleButton = screen.getByRole('button', { name: /sign in with google/i })

    expect(submitButton).toBeDisabled()
    expect(googleButton).toBeDisabled()
  })

  it('contains forgot password link', () => {
    render(<LoginForm {...defaultProps} />)

    const forgotPasswordLink = screen.getByText('Forgot your password?')
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('contains sign up link', () => {
    render(<LoginForm {...defaultProps} />)

    const signUpLink = screen.getByText('Sign up')
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register')
  })
})