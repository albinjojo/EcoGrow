import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAccountProfile } from '../../services/api'

const GoogleCallback = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const checkedRef = useRef(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (checkedRef.current) return
        checkedRef.current = true

        const verifySession = async () => {
            try {
                const data = await getAccountProfile()
                if (data && data.email) {
                    login({
                        id: data.id || 0,
                        email: data.email,
                        role: data.role || 'USER',
                        ...data.profile,
                    })

                    // Redirect based on role
                    const target = data.role === 'ADMIN' ? '/admin' : '/dashboard'
                    navigate(target, { replace: true })
                } else {
                    // No session found
                    console.error('Session verify returned no data')
                    setStatus('Session check failed: No user data returned. Please try logging in again.')
                }
            } catch (error) {
                console.error('Session verification failed', error)
                setStatus(`Login failed: ${error.message || 'Unknown error'}`)
            }
        }

        verifySession()
    }, [login, navigate])

    if (status) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <h3 style={{ color: 'red' }}>Authentication Error</h3>
                <p>{status}</p>
                <button
                    onClick={() => navigate('/auth/login')}
                    style={{ padding: '8px 16px', marginTop: 20 }}
                >
                    Back to Login
                </button>
            </div>
        )
    }

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--c-bg-app)',
            color: 'var(--c-text-secondary)',
            fontFamily: 'var(--font-primary)'
        }}>
            <p>Completing secure sign-in...</p>
        </div>
    )
}

export default GoogleCallback
