import { useState } from 'react'
import DataTable from '../../components/admin/DataTable'

/**
 * DeviceManagement - Admin page for managing IoT devices
 * Features:
 * - View all registered devices
 * - Show device status (online/offline)
 * - Assign/unassign devices to users
 * - View device details and history
 * - Deactivate devices
 */
const DeviceManagement = () => {
  // Mock device data - Replace with API calls in production
  const [devices, setDevices] = useState([
    {
      id: 'DEV-001',
      name: 'Greenhouse A Temperature',
      type: 'Temperature Sensor',
      status: 'online',
      assignedUser: 'John Farmer',
      lastSeen: '2 minutes ago',
      battery: 92,
    },
    {
      id: 'DEV-002',
      name: 'Greenhouse A Humidity',
      type: 'Humidity Sensor',
      status: 'online',
      assignedUser: 'John Farmer',
      lastSeen: '1 minute ago',
      battery: 87,
    },
    {
      id: 'DEV-003',
      name: 'Greenhouse B Temperature',
      type: 'Temperature Sensor',
      status: 'online',
      assignedUser: 'Sarah Greenhouse',
      lastSeen: '5 minutes ago',
      battery: 65,
    },
    {
      id: 'DEV-004',
      name: 'Greenhouse C Light Sensor',
      type: 'Light Sensor',
      status: 'offline',
      assignedUser: 'Unassigned',
      lastSeen: '3 hours ago',
      battery: 5,
    },
    {
      id: 'DEV-005',
      name: 'Field A Soil Moisture',
      type: 'Soil Moisture Sensor',
      status: 'online',
      assignedUser: 'Mike Monitor',
      lastSeen: '10 minutes ago',
      battery: 78,
    },
    {
      id: 'DEV-006',
      name: 'Field B Soil Moisture',
      type: 'Soil Moisture Sensor',
      status: 'offline',
      assignedUser: 'Unassigned',
      lastSeen: '1 day ago',
      battery: 12,
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeactivate = (device) => {
    if (confirm(`Deactivate device ${device.name}?`)) {
      setDevices(devices.filter((d) => d.id !== device.id))
    }
  }

  const handleReassign = (device) => {
    console.log('Reassign device:', device.id)
    // This would open a modal for reassignment in production
  }

  const columns = [
    { key: 'id', label: 'Device ID', width: '120px', render: (value) => <code>{value}</code> },
    { key: 'name', label: 'Device Name', width: '220px' },
    { key: 'type', label: 'Type', width: '150px' },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value) => <span className={`status-badge status-${value}`}>{value}</span>,
    },
    { key: 'assignedUser', label: 'Assigned To', width: '150px' },
    { key: 'lastSeen', label: 'Last Seen', width: '120px' },
    {
      key: 'battery',
      label: 'Battery',
      width: '80px',
      render: (value) => (
        <span className={`battery-level ${value < 20 ? 'low' : value < 50 ? 'medium' : 'good'}`}>
          {value}%
        </span>
      ),
    },
  ]

  const actions = [
    { label: 'Reassign', variant: 'secondary', onClick: handleReassign },
    { label: 'Deactivate', variant: 'danger', onClick: handleDeactivate },
  ]

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
  }

  return (
    <div className="admin-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="header-content">
          <h2>Device Management</h2>
          <p className="header-subtitle">Monitor and manage IoT sensors and hardware devices</p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="stats-row">
        <div className="stat-badge stat-badge-total">
          <span className="badge-label">Total Devices</span>
          <span className="badge-value">{stats.total}</span>
        </div>
        <div className="stat-badge stat-badge-online">
          <span className="badge-label">Online</span>
          <span className="badge-value">{stats.online}</span>
        </div>
        <div className="stat-badge stat-badge-offline">
          <span className="badge-label">Offline</span>
          <span className="badge-value">{stats.offline}</span>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="page-controls">
        <div className="control-left">
          <input
            type="search"
            placeholder="Search by device name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search devices"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
        </div>
        <div className="control-stats">
          Showing {filteredDevices.length} of {devices.length} devices
        </div>
      </section>

      {/* Devices Table */}
      <section className="page-content">
        {filteredDevices.length === 0 ? (
          <div className="empty-state">
            <p>No devices found matching your criteria.</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={filteredDevices} actions={actions} />
        )}
      </section>

      {/* Device Status Legend */}
      <section className="page-footer">
        <div className="legend">
          <h4>Status Legend</h4>
          <ul>
            <li>
              <span className="legend-dot online"></span> Online - Device is active and connected
            </li>
            <li>
              <span className="legend-dot offline"></span> Offline - Device is not connected to network
            </li>
            <li>
              <span className="legend-dot low-battery"></span> Low Battery - Battery level below 20%
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default DeviceManagement
