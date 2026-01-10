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

        const fetchProfileAndRedirect = async () => {
            try {
                const data = await getAccountProfile()
                if (data && data.email) {
                    login({
                        id: data.id || 0,
                        email: data.email,
                        role: data.role || 'USER',
                        ...data.profile,
                    })

                    // Navigate to dashboard for regular users, admin panel for admins
                    const target = data.role === 'ADMIN' ? '/admin' : '/dashboard'
                    navigate(target, { replace: true })
                } else {
                    console.error('No user data returned from profile API')
                    setStatus('Login failed: Unable to retrieve user information.')
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error)
                setStatus(`Login failed: ${error.message || 'Unauthorized'}`)
            }
        }

        fetchProfileAndRedirect()
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
