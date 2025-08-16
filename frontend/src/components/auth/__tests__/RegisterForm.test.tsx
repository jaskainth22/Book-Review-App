import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RegisterForm } from '../RegisterForm'

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnGoogleLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onGoogleLogin: mockOnGoogleLogin
  }

  it('renders registration form with all required fields', () => {
    render(<RegisterForm {...defaultProps} />)

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
  })

  it('displays error message when provided', () => {
    const error = 'Email already exists'
    render(<RegisterForm {...defaultProps} error={error} />)

    expect(screen.getByText(error)).toBeInTheDocument()
  })

  it('calls onGoogleLogin when Google button is clicked', async () => {
    const user = userEvent.setup()
    render(<RegisterForm {...defaultProps} />)

    const googleButton = screen.getByRole('button', { name: /sign up with google/i })
    await user.click(googleButton)

    expect(mockOnGoogleLogin).toHaveBeenCalled()
  })

  it('disables form when loading', () => {
    render(<RegisterForm {...defaultProps} loading={true} />)

    const submitButton = screen.getByRole('button', { name: /creating account/i })
    const googleButton = screen.getByRole('button', { name: /sign up with google/i })

    expect(submitButton).toBeDisabled()
    expect(googleButton).toBeDisabled()
  })

  it('contains sign in link', () => {
    render(<RegisterForm {...defaultProps} />)

    const signInLink = screen.getByText('Sign in')
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login')
  })
})