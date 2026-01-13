import { useState } from 'react'
import { updateAccountProfile } from '../services/api'

const CompleteProfileModal = ({ isOpen, onClose, onComplete }) => {
    const [form, setForm] = useState({
        full_name: '',
        phone_number: '',
        country: '',
        state_region: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await updateAccountProfile(form)
            if (onComplete) onComplete()
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to save profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem' }}>Complete Your Profile</h2>
                <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Please take a moment to complete your profile details to get the best experience.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                        name="full_name"
                        placeholder="Full Name"
                        value={form.full_name}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                    <input
                        name="phone_number"
                        placeholder="Phone Number"
                        value={form.phone_number}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                    <input
                        name="country"
                        placeholder="Country"
                        value={form.country}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                    <input
                        name="state_region"
                        placeholder="State / Region"
                        value={form.state_region}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />

                    {error && <p style={{ color: '#d14343', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...buttonStyle,
                                backgroundColor: '#10b981',
                                color: 'white',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Saving...' : 'Save Details'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                ...buttonStyle,
                                backgroundColor: '#f3f4f6',
                                color: '#374151'
                            }}
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const inputStyle = {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box'
}

const buttonStyle = {
    flex: 1,
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
}

export default CompleteProfileModal
