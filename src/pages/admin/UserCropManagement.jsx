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
        stage: 'germination',
        parameter: 'temperature',
        minValue: '',
        maxValue: '',
        unit: '°C'
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

    const fetchThresholds = async (cropId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/thresholds/${cropId}`)
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
            fetchThresholds(selectedCrop.id)
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
                    crop_id: selectedCrop.id,
                    stage: thresholdData.stage,
                    parameter: thresholdData.parameter,
                    min_value: parseFloat(thresholdData.minValue),
                    max_value: parseFloat(thresholdData.maxValue),
                    unit: thresholdData.unit
                })
            })
            if (res.ok) {
                setIsThresholdModalOpen(false)
                fetchThresholds(selectedCrop.id)
                setThresholdData({
                    stage: 'germination',
                    parameter: 'temperature',
                    minValue: '',
                    maxValue: '',
                    unit: '°C'
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
        { key: 'stage', label: 'Stage', width: '150px' },
        { key: 'parameter', label: 'Parameter', width: '150px' },
        { key: 'min_value', label: 'Min', width: '100px' },
        { key: 'max_value', label: 'Max', width: '100px' },
        { key: 'unit', label: 'Unit', width: '80px' },
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3>Crops</h3>
                                <button className="primary-btn" onClick={() => setIsCropModalOpen(true)}>+ Add Crop</button>
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

                    <div style={{ flex: 1 }}>
                        {selectedCrop ? (
                            <section className="page-content" style={{ padding: '24px', background: 'var(--c-surface)', border: '1px solid var(--c-border-strong)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3>Thresholds for {selectedCrop.name}</h3>
                                    <button className="primary-btn" onClick={() => setIsThresholdModalOpen(true)}>+ Add Threshold</button>
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
                    <div className="form-group">
                        <label>Stage <span className="required">*</span></label>
                        <select name="stage" value={thresholdData.stage} onChange={handleThresholdChange} className="form-input" style={{ width: '100%' }}>
                            <option value="germination">Germination</option>
                            <option value="vegetative">Vegetative</option>
                            <option value="flowering">Flowering</option>
                            <option value="fruiting">Fruiting</option>
                            <option value="harvesting">Harvesting</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label>Parameter <span className="required">*</span></label>
                        <select name="parameter" value={thresholdData.parameter} onChange={handleThresholdChange} className="form-input" style={{ width: '100%' }}>
                            <option value="temperature">Temperature</option>
                            <option value="humidity">Humidity</option>
                            <option value="co2">CO2</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <FormField
                            label="Min Value"
                            name="minValue"
                            type="number"
                            value={thresholdData.minValue}
                            onChange={handleThresholdChange}
                        />
                        <FormField
                            label="Max Value"
                            name="maxValue"
                            type="number"
                            value={thresholdData.maxValue}
                            onChange={handleThresholdChange}
                        />
                        <div className="form-group">
                            <label>Unit</label>
                            <select name="unit" value={thresholdData.unit} onChange={handleThresholdChange} className="form-input" style={{ width: '100%' }}>
                                <option value="°C">°C</option>
                                <option value="%">%</option>
                                <option value="ppm">ppm</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default UserCropManagement
