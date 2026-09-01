'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.replace('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { pseudo: pseudo || email.split('@')[0] } },
      })
      if (error) setError(error.message)
      else router.replace('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.stamp}>✒️</div>
        <img src="/logo.png" alt="Stylodex" style={{ height: 70, marginBottom: 8 }} />
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
          {mode === 'login' ? 'Content de vous revoir.' : 'Créez votre carnet de collection.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input
              className="field"
              placeholder="Votre pseudo (ex. Léa)"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
            />
          )}
          <input
            className="field"
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p style={{ color: 'var(--raspberry)', fontSize: 13, margin: 0 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <button
          className="btn-ghost"
          style={{ marginTop: 16, width: '100%' }}
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
        >
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: 'var(--card-bg)',
    borderRadius: 'var(--radius)',
    padding: '36px 32px',
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(35,35,35,0.08)',
    border: '1px solid var(--paper-line)',
  },
  stamp: {
    fontSize: 28,
    marginBottom: 8,
  },
}
