import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useAuth } from '../AuthContext'

// Mock axios
vi.mock('axios', () => ({
  default: {
    defaults: { headers: { common: {} }, withCredentials: true, baseURL: '' },
    interceptors: {
      response: {
        use: vi.fn().mockReturnValue(1),
        eject: vi.fn()
      }
    },
    get: vi.fn().mockResolvedValue({ data: { success: false } }),
    post: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('AuthContext', () => {
  it('throws error when useAuth is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useAuth()
      return <div>Test</div>
    }

    expect(() => {
      render(<TestComponentWithoutProvider />)
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})