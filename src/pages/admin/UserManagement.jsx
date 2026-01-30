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
    <div className="admin-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="header-content">
          <h2>User Management</h2>
          <p className="header-subtitle">Manage farmer accounts and administrative users</p>
        </div>
        <button className="primary-btn" onClick={handleAddUser} disabled={loading}>
          + Add New User
        </button>
      </section>

      {/* Error Message */}
      {error && (
        <section className="alert alert-error">
          <p>Error loading users: {error}</p>
        </section>
      )}

      {/* Loading State */}
      {loading ? (
        <section className="page-content">
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Loading users...</p>
          </div>
        </section>
      ) : (
        <>
          {/* Search and Filter */}
          <section className="page-controls">
            <input
              type="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search users"
            />
            <div className="control-stats">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </section>

          {/* Users Table */}
          <section className="page-content">
            <DataTable columns={columns} rows={filteredUsers} actions={actions} />
          </section>
        </>
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
