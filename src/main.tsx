
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App' // App is in root
import './index.css' // index.css is in src
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)

