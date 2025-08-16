import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import axios from 'axios'
import { User, AuthContextType, RegisterData, LoginData, ApiResponse } from '../types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Set up axios interceptors for token management
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken')
          delete axios.defaults.headers.common['Authorization']
          setUser(null)
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await axios.get<ApiResponse<User>>('/auth/me')
        if (response.data.success && response.data.data) {
          setUser(response.data.data)
        } else {
          localStorage.removeItem('authToken')
          delete axios.defaults.headers.common['Authorization']
        }
      } catch (error) {
        localStorage.removeItem('authToken')
        delete axios.defaults.headers.common['Authorization']
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const response = await axios.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
        email,
        password,
        rememberMe
      })

      if (response.data.success && response.data.data) {
        const { user: userData, token } = response.data.data
        
        // Store token
        localStorage.setItem('authToken', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(userData)
      } else {
        throw new Error(response.data.error?.message || 'Login failed')
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message)
      }
      throw new Error('Login failed. Please try again.')
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post<ApiResponse<{ user: User; token: string }>>('/auth/register', userData)

      if (response.data.success && response.data.data) {
        const { user: newUser, token } = response.data.data
        
        // Store token
        localStorage.setItem('authToken', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        setUser(newUser)
      } else {
        throw new Error(response.data.error?.message || 'Registration failed')
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        throw new Error(error.response.data.error.message)
      }
      throw new Error('Registration failed. Please try again.')
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    
    // Optional: Call logout endpoint to invalidate token on server
    axios.post('/auth/logout').catch(() => {
      // Ignore errors on logout endpoint
    })
  }

  const googleLogin = async () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google`
  }

  const value: AuthContextType = {
    user,
    login: async (email: string, password: string, rememberMe?: boolean) => {
      await login(email, password, rememberMe)
    },
    register,
    logout,
    loading,
    googleLogin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for handling Google OAuth callback
export const useGoogleOAuthCallback = () => {
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      const error = urlParams.get('error')

      if (error) {
        console.error('OAuth error:', error)
        // Handle OAuth error (show message to user)
        return
      }

      if (token) {
        try {
          // Store token and get user data
          localStorage.setItem('authToken', token)
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await axios.get<ApiResponse<User>>('/auth/me')
          if (response.data.success && response.data.data) {
            // User will be set by the AuthProvider's useEffect
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        } catch (error) {
          console.error('Failed to authenticate with OAuth token:', error)
          localStorage.removeItem('authToken')
          delete axios.defaults.headers.common['Authorization']
        }
      }
    }

    handleOAuthCallback()
  }, [])
}