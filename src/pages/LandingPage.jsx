import { useNavigate } from 'react-router-dom'
import NavigationBar from '../components/NavigationBar'
import './LandingPage.css'

const LandingPage = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    const hasHistory = window.history.state?.idx > 0
    if (hasHistory) {
      navigate(-1)
      return
    }
    navigate('/login')
  }

  return (
    <div className="welcome-shell">
      <NavigationBar onBack={handleBack} userName="Your account" />

      <div className="welcome-body">
        <div className="welcome-card">
          <h1>Welcome to EcoGrow</h1>
          <p>Your account is ready. Monitor and grow with confidence.</p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
