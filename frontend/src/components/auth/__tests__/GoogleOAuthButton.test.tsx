import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleOAuthButton } from '../GoogleOAuthButton'

describe('GoogleOAuthButton', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default text', () => {
    render(<GoogleOAuthButton onClick={mockOnClick} />)

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    const customText = 'Sign in with Google'
    render(<GoogleOAuthButton onClick={mockOnClick} text={customText} />)

    expect(screen.getByRole('button', { name: customText })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    render(<GoogleOAuthButton onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<GoogleOAuthButton onClick={mockOnClick} disabled={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows loading text when disabled', () => {
    render(<GoogleOAuthButton onClick={mockOnClick} disabled={true} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    render(<GoogleOAuthButton onClick={mockOnClick} disabled={true} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const customClass = 'custom-class'
    render(<GoogleOAuthButton onClick={mockOnClick} className={customClass} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass(customClass)
  })

  it('contains Google logo SVG', () => {
    render(<GoogleOAuthButton onClick={mockOnClick} />)

    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-5', 'h-5', 'mr-3')
  })

  it('has proper accessibility attributes', () => {
    render(<GoogleOAuthButton onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('has hover and focus styles', () => {
    render(<GoogleOAuthButton onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-gray-50')
    expect(button).toHaveClass('focus:outline-none')
    expect(button).toHaveClass('focus:ring-2')
    expect(button).toHaveClass('focus:ring-offset-2')
    expect(button).toHaveClass('focus:ring-blue-500')
  })
})