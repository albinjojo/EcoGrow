import { useState } from 'react'
import FormField from '../../components/admin/FormField'

/**
 * SystemSettings - Admin page for system configuration
 * Features:
 * - Default alert thresholds configuration
 * - Notification preferences
 * - Basic system configuration options
 * - Settings persistence (in production)
 */
const SystemSettings = () => {
  // Mock settings data - Replace with API calls in production
  const [settings, setSettings] = useState({
    // Alert Thresholds
    tempHighThreshold: 35,
    tempLowThreshold: 10,
    humidityHighThreshold: 85,
    humidityLowThreshold: 40,
    soilMoistureThreshold: 30,

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationDelay: 5,

    // System Settings
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 30,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaveMessage('Settings saved successfully!')
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }, 500)
  }

  return (
    <div className="admin-page">
      {/* Page Header */}
      <section className="page-header">
        <div className="header-content">
          <h2>System Settings</h2>
          <p className="header-subtitle">Configure alert thresholds, notifications, and system preferences</p>
        </div>
      </section>

      {/* Save Message */}
      {saveMessage && <div className="success-message">{saveMessage}</div>}

      {/* Settings Form */}
      <div className="settings-grid">
        {/* Alert Thresholds Section */}
        <section className="settings-section">
          <h3>Alert Thresholds</h3>
          <p className="section-description">Configure default thresholds for system alerts</p>

          <div className="settings-subsection">
            <h4>Temperature Monitoring</h4>
            <FormField
              label="High Temperature Alert (°C)"
              type="number"
              name="tempHighThreshold"
              value={settings.tempHighThreshold}
              onChange={(e) => handleSettingChange('tempHighThreshold', Number(e.target.value))}
            />
            <FormField
              label="Low Temperature Alert (°C)"
              type="number"
              name="tempLowThreshold"
              value={settings.tempLowThreshold}
              onChange={(e) => handleSettingChange('tempLowThreshold', Number(e.target.value))}
            />
          </div>

          <div className="settings-subsection">
            <h4>Humidity Monitoring</h4>
            <FormField
              label="High Humidity Alert (%)"
              type="number"
              name="humidityHighThreshold"
              value={settings.humidityHighThreshold}
              onChange={(e) => handleSettingChange('humidityHighThreshold', Number(e.target.value))}
            />
            <FormField
              label="Low Humidity Alert (%)"
              type="number"
              name="humidityLowThreshold"
              value={settings.humidityLowThreshold}
              onChange={(e) => handleSettingChange('humidityLowThreshold', Number(e.target.value))}
            />
          </div>

          <div className="settings-subsection">
            <h4>Soil Moisture Monitoring</h4>
            <FormField
              label="Soil Moisture Alert (%)"
              type="number"
              name="soilMoistureThreshold"
              value={settings.soilMoistureThreshold}
              onChange={(e) => handleSettingChange('soilMoistureThreshold', Number(e.target.value))}
            />
          </div>
        </section>

        {/* Notification Preferences Section */}
        <section className="settings-section">
          <h3>Notification Preferences</h3>
          <p className="section-description">Control how notifications are sent to users</p>

          <div className="settings-subsection">
            <div className="setting-toggle">
              <label htmlFor="emailNotifications">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
                <span>Enable Email Notifications</span>
              </label>
              <p className="setting-help">Send alerts to users via email</p>
            </div>

            <div className="setting-toggle">
              <label htmlFor="smsNotifications">
                <input
                  id="smsNotifications"
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                />
                <span>Enable SMS Notifications</span>
              </label>
              <p className="setting-help">Send critical alerts via SMS</p>
            </div>

            <div className="setting-toggle">
              <label htmlFor="pushNotifications">
                <input
                  id="pushNotifications"
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                />
                <span>Enable Push Notifications</span>
              </label>
              <p className="setting-help">Send notifications to user devices</p>
            </div>
          </div>

          <div className="settings-subsection">
            <h4>Notification Delay</h4>
            <FormField
              label="Alert Notification Delay (minutes)"
              type="number"
              name="notificationDelay"
              value={settings.notificationDelay}
              onChange={(e) => handleSettingChange('notificationDelay', Number(e.target.value))}
            />
            <p className="setting-help">Wait before sending duplicate alerts for same issue</p>
          </div>
        </section>

        {/* System Configuration Section */}
        <section className="settings-section">
          <h3>System Configuration</h3>
          <p className="section-description">General system settings and maintenance options</p>

          <div className="settings-subsection">
            <div className="setting-toggle">
              <label htmlFor="maintenanceMode">
                <input
                  id="maintenanceMode"
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                />
                <span>Maintenance Mode</span>
              </label>
              <p className="setting-help">Disable system access for scheduled maintenance</p>
            </div>

            <div className="setting-toggle">
              <label htmlFor="autoBackup">
                <input
                  id="autoBackup"
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                />
                <span>Enable Automatic Backups</span>
              </label>
              <p className="setting-help">Regularly backup database and files</p>
            </div>
          </div>

          <div className="settings-subsection">
            <h4>Backup Configuration</h4>
            <div className="form-group">
              <label htmlFor="backupFrequency">Backup Frequency</label>
              <select
                id="backupFrequency"
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                className="form-input"
                disabled={!settings.autoBackup}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="settings-subsection">
            <h4>Session Management</h4>
            <FormField
              label="Session Timeout (minutes)"
              type="number"
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
            />
            <p className="setting-help">Automatically logout users after inactivity</p>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <section className="page-actions">
        <button
          className="primary-btn"
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </section>
    </div>
  )
}

export default SystemSettings
