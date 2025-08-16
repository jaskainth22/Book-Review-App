import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireEmailVerification?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireEmailVerification = false,
  redirectTo = '/login'
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"
        ></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check email verification if required
  if (requireEmailVerification && !user.isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Email Verification Required</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please verify your email address to access this feature. Check your inbox for a verification link.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                I've verified my email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component version for class components or more complex use cases
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireEmailVerification?: boolean
    redirectTo?: string
  }
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute
      requireEmailVerification={options?.requireEmailVerification}
      redirectTo={options?.redirectTo}
    >
      <Component {...props} />
    </ProtectedRoute>
  )

  WrappedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`
  
  return WrappedComponent
}