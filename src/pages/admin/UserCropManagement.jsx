import { useState, useEffect } from 'react'
import DataTable from '../../components/admin/DataTable'
import Modal from '../../components/admin/Modal'
import FormField from '../../components/admin/FormField'
import { fetchAllUsers } from '../../services/api'

const UserCropManagement = () => {
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState('')
    const [loadingUsers, setLoadingUsers] = useState(true)

    const [userCrops, setUserCrops] = useState([])
    const [selectedCrop, setSelectedCrop] = useState(null)
    const [cropThresholds, setCropThresholds] = useState([])

    const [isCropModalOpen, setIsCropModalOpen] = useState(false)
    const [newCropName, setNewCropName] = useState('')

    const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false)
    const [thresholdData, setThresholdData] = useState({
        temp_min: '',
        temp_max: '',
        humidity_min: '',
        humidity_max: '',
        co2_min: '',
        co2_max: ''
    })

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoadingUsers(true)
                const response = await fetchAllUsers()
                if (response && response.users) {
                    setUsers(response.users.filter(u => u.role === 'USER'))
                }
            } catch (err) {
                console.error('Error fetching users:', err)
            } finally {
                setLoadingUsers(false)
            }
        }
        loadUsers()
    }, [])

    const fetchCrops = async (userId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/crops/${userId}`)
            if (res.ok) {
                const data = await res.json()
                setUserCrops(data)
                setSelectedCrop(null)
                setCropThresholds([])
            }
        } catch (err) {
            console.error('Failed to fetch crops')
        }
    }

    useEffect(() => {
        if (!selectedUser) {
            setUserCrops([])
            setSelectedCrop(null)
            setCropThresholds([])
            return
        }
        fetchCrops(selectedUser)
    }, [selectedUser])

    const fetchThresholds = async (cropName) => {
        try {
            const res = await fetch(`http://localhost:5000/api/thresholds/${cropName}`)
            if (res.ok) {
                const data = await res.json()
                setCropThresholds(data)
            }
        } catch (err) {
            console.error('Failed to fetch thresholds')
        }
    }

    useEffect(() => {
        if (selectedCrop) {
            fetchThresholds(selectedCrop.name)
        } else {
            setCropThresholds([])
        }
    }, [selectedCrop])

    const handleSaveCrop = async () => {
        if (!newCropName.trim()) return;
        try {
            const res = await fetch('http://localhost:5000/api/crops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: selectedUser, name: newCropName.trim() })
            })
            if (res.ok) {
                setNewCropName('')
                setIsCropModalOpen(false)
                fetchCrops(selectedUser)
            }
        } catch (err) {
            console.error('Failed to save crop')
        }
    }

    const handleThresholdChange = (e) => {
        const { name, value } = e.target
        setThresholdData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSaveThreshold = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/thresholds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crop_name: selectedCrop.name,
                    temp_min: parseFloat(thresholdData.temp_min),
                    temp_max: parseFloat(thresholdData.temp_max),
                    humidity_min: parseFloat(thresholdData.humidity_min),
                    humidity_max: parseFloat(thresholdData.humidity_max),
                    co2_min: parseFloat(thresholdData.co2_min),
                    co2_max: parseFloat(thresholdData.co2_max)
                })
            })
            if (res.ok) {
                setIsThresholdModalOpen(false)
                fetchThresholds(selectedCrop.name)
                setThresholdData({
                    temp_min: '',
                    temp_max: '',
                    humidity_min: '',
                    humidity_max: '',
                    co2_min: '',
                    co2_max: ''
                })
            }
        } catch (err) {
            console.error('Failed to save threshold')
        }
    }

    const cropColumns = [
        { key: 'id', label: 'ID', width: '50px' },
        { key: 'name', label: 'Crop Name', width: '200px' }
    ]

    const thresholdColumns = [
        { key: 'temp_min', label: 'Temp Min', width: '90px' },
        { key: 'temp_max', label: 'Temp Max', width: '90px' },
        { key: 'humidity_min', label: 'Hum Min', width: '90px' },
        { key: 'humidity_max', label: 'Hum Max', width: '90px' },
        { key: 'co2_min', label: 'CO2 Min', width: '90px' },
        { key: 'co2_max', label: 'CO2 Max', width: '90px' },
    ]

    return (
        <div className="admin-page">
            <section className="page-header">
                <div className="header-content">
                    <h2>User Crops & Thresholds</h2>
                    <p className="header-subtitle">Manage specific crops and their environmental thresholds per user</p>
                </div>
            </section>

            <section className="page-controls" style={{ padding: '24px', background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
                <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label htmlFor="userSelect" style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--c-text-secondary)', marginBottom: '8px', display: 'block' }}>
                        Select Farmer Account
                    </label>
                    {loadingUsers ? (
                        <p style={{ fontSize: '14px', color: 'var(--c-text-tertiary)' }}>Loading users...</p>
                    ) : (
                        <select
                            id="userSelect"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="form-input"
                        >
                            <option value="">-- Choose a user --</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.email} (ID: {user.id})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </section>

            {selectedUser && (
                <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                        <section className="page-content" style={{ padding: '24px', background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
                                <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Crops</h3>
                                <button className="primary-btn" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsCropModalOpen(true)}>+ Add Crop</button>
                            </div>
                            {userCrops.length > 0 ? (
                                <DataTable
                                    columns={cropColumns}
                                    rows={userCrops}
                                    actions={[{ label: 'Select', onClick: setSelectedCrop }]}
                                />
                            ) : (
                                <p style={{ color: 'var(--c-text-tertiary)' }}>No crops found for this user.</p>
                            )}
                        </section>
                    </div>

                    <div style={{ flex: 1.8 }}>
                        {selectedCrop ? (
                            <section className="page-content" style={{ padding: '24px', background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)', borderRadius: 'var(--radius-sm)', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, paddingRight: '12px' }}>Thresholds for {selectedCrop.name}</h3>
                                    <button className="primary-btn" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsThresholdModalOpen(true)}>+ Add Threshold</button>
                                </div>
                                {cropThresholds.length > 0 ? (
                                    <DataTable columns={thresholdColumns} rows={cropThresholds} />
                                ) : (
                                    <p style={{ color: 'var(--c-text-tertiary)' }}>No thresholds set for this crop.</p>
                                )}
                            </section>
                        ) : (
                            <section className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', background: 'var(--c-surface)', border: '1px dashed var(--c-border-strong)', borderRadius: 'var(--radius-sm)', height: '100%' }}>
                                <p style={{ color: 'var(--c-text-tertiary)' }}>Select a crop to view and manage its thresholds.</p>
                            </section>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isCropModalOpen}
                title="Add New Crop"
                onClose={() => setIsCropModalOpen(false)}
                footer={
                    <div className="modal-actions">
                        <button className="secondary-btn" onClick={() => setIsCropModalOpen(false)}>Cancel</button>
                        <button className="primary-btn" onClick={handleSaveCrop}>Save Crop</button>
                    </div>
                }
            >
                <div className="form-group">
                    <FormField
                        label="Crop Name"
                        name="newCropName"
                        type="text"
                        value={newCropName}
                        onChange={(e) => setNewCropName(e.target.value)}
                        placeholder="e.g. Tomato, Cucumber"
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isThresholdModalOpen}
                title={`Add Threshold for ${selectedCrop?.name}`}
                onClose={() => setIsThresholdModalOpen(false)}
                footer={
                    <div className="modal-actions">
                        <button className="secondary-btn" onClick={() => setIsThresholdModalOpen(false)}>Cancel</button>
                        <button className="primary-btn" onClick={handleSaveThreshold}>Save Threshold</button>
                    </div>
                }
            >
                <div className="form-container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <FormField
                            label="Temp Min (°C)"
                            name="temp_min"
                            type="number"
                            value={thresholdData.temp_min}
                            onChange={handleThresholdChange}
                        />
                        <FormField
                            label="Temp Max (°C)"
                            name="temp_max"
                            type="number"
                            value={thresholdData.temp_max}
                            onChange={handleThresholdChange}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <FormField
                            label="Humidity Min (%)"
                            name="humidity_min"
                            type="number"
                            value={thresholdData.humidity_min}
                            onChange={handleThresholdChange}
                        />
                        <FormField
                            label="Humidity Max (%)"
                            name="humidity_max"
                            type="number"
                            value={thresholdData.humidity_max}
                            onChange={handleThresholdChange}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <FormField
                            label="CO2 Min (ppm)"
                            name="co2_min"
                            type="number"
                            value={thresholdData.co2_min}
                            onChange={handleThresholdChange}
                        />
                        <FormField
                            label="CO2 Max (ppm)"
                            name="co2_max"
                            type="number"
                            value={thresholdData.co2_max}
                            onChange={handleThresholdChange}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default UserCropManagement
