import { useState, useEffect } from 'react'
import DataTable from '../../components/admin/DataTable'
import Modal from '../../components/admin/Modal'
import FormField from '../../components/admin/FormField'
import { fetchAllUsers, deleteUser, toggleUserStatus } from '../../services/api'

/**
 * UserManagement - Admin page for managing user accounts
 * Features:
 * - View all users in a sortable table (fetched from database)
 * - Create new users/admins
 * - Change user roles
 * - Enable/disable accounts
 * - Search and filter users
 */
const UserManagement = () => {
  // Real user data from API
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER' })
  const [errors, setErrors] = useState({})

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetchAllUsers()
      // Map API response to component data structure
      const mappedUsers = response.users.map((user) => ({
        id: user.id,
        name: user.email.split('@')[0], // Use part of email as name if name not available
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        joinDate: new Date(user.createdAt).toISOString().split('T')[0] || 'N/A',
        devices: 0, // Can be extended when device API is available
      }))
      setUsers(mappedUsers)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users from API on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = () => {
    setFormData({ name: '', email: '', role: 'USER' })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    return newErrors
  }

  const handleCreateUser = () => {
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const newUser = {
      id: users.length + 1,
      ...formData,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      devices: 0,
    }

    setUsers([...users, newUser])
    setIsModalOpen(false)
    setFormData({ name: '', email: '', role: 'USER' })
  }

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete user ${user.email}? This action cannot be undone.`)) {
      try {
        await deleteUser(user.id)
        await loadUsers() // Refresh list
      } catch (err) {
        alert(`Failed to delete user: ${err.message}`)
      }
    }
  }

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      await toggleUserStatus(user.id, newStatus)
      await loadUsers() // Refresh list
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  const columns = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email', width: '200px' },
    { key: 'role', label: 'Role', width: '100px', render: (value) => <span className="role-badge">{value}</span> },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value) => <span className={`status-badge status-${value}`}>{value}</span>,
    },
    { key: 'devices', label: 'Devices', width: '80px' },
    { key: 'joinDate', label: 'Joined', width: '120px' },
  ]

  const actions = [
    { label: 'Toggle', variant: 'secondary', onClick: handleToggleStatus },
    { label: 'Delete', variant: 'danger', onClick: handleDeleteUser },
  ]

  const modalFooter = (
    <div className="modal-actions">
      <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>
        Cancel
      </button>
      <button className="primary-btn" onClick={handleCreateUser}>
        Create User
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border-strong)',
        borderLeft: '4px solid var(--c-accent-primary)',
      }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--c-text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
            Admin › Users
          </p>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--c-text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
            User Management
          </h2>
        </div>
        <button
          onClick={handleAddUser}
          disabled={loading}
          style={{
            padding: '8px 18px', background: 'var(--c-accent-primary)',
            border: '1px solid #2d5a27', color: 'white',
            fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            cursor: 'pointer', transition: 'opacity 0.15s',
            opacity: loading ? 0.6 : 1,
          }}
        >
          + Add User
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px' }}>
          Error loading users: {error}
        </div>
      )}

      {/* ── Search + Count Bar ────────────────────────────────────────── */}
      {!loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 16px',
          background: 'var(--c-surface-muted)',
          border: '1px solid var(--c-border-strong)',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--c-text-tertiary)' }}>🔍</span>
          <input
            type="search"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search users"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '13px', color: 'var(--c-text-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          />
          <span style={{
            fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: 'var(--c-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px',
            background: 'var(--c-bg-app)', border: '1px solid var(--c-border-subtle)',
            padding: '2px 8px', whiteSpace: 'nowrap',
          }}>
            {filteredUsers.length} / {users.length} users
          </span>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--c-text-tertiary)', fontSize: '13px' }}>
          Loading users…
        </div>
      )}

      {/* ── Users Table ───────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)', overflow: 'hidden' }}>
          <DataTable columns={columns} rows={filteredUsers} actions={actions} />
        </div>
      )}



      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Create New User"
        onClose={() => setIsModalOpen(false)}
        footer={modalFooter}
      >
        <div className="form-container">
          <FormField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            error={errors.name}
            placeholder="John Farmer"
            required
          />
          <FormField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            error={errors.email}
            placeholder="john@farm.com"
            required
          />
          <div className="form-group">
            <label htmlFor="role">
              Role <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              className="form-input"
            >
              <option value="USER">Farmer (USER)</option>
              <option value="ADMIN">Administrator (ADMIN)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserManagement
