import { useUser, SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import './AuthWrapper.css'

const AuthWrapper = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser()
  const [showSignUp, setShowSignUp] = useState(false)

  // Loading state
  if (!isLoaded) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  // User is signed in, show the app
  if (isSignedIn) {
    return children
  }

  // User is not signed in, show auth forms
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <h1>AI ChatBot</h1>
          <p>Connectez-vous pour commencer à discuter avec l'IA</p>
        </div>

        <div className="auth-forms">
          {showSignUp ? (
            <div className="auth-form">
              <SignUp 
                appearance={{
                  elements: {
                    formButtonPrimary: 'auth-button-primary',
                    card: 'auth-card'
                  }
                }}
              />
              <p className="auth-switch">
                Déjà un compte ?{' '}
                <button 
                  onClick={() => setShowSignUp(false)}
                  className="auth-link"
                >
                  Se connecter
                </button>
              </p>
            </div>
          ) : (
            <div className="auth-form">
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 'auth-button-primary',
                    card: 'auth-card'
                  }
                }}
              />
              <p className="auth-switch">
                Pas encore de compte ?{' '}
                <button 
                  onClick={() => setShowSignUp(true)}
                  className="auth-link"
                >
                  S'inscrire
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthWrapper
