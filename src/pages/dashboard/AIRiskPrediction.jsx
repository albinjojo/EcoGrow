import { useState, useEffect } from 'react'
import './Dashboard.css'

const AIRiskPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/ai/predict');
      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, []);

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return '#10B981'; // Green
      case 'moderate': return '#F59E0B'; // Amber
      case 'high': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  return (
    <div className="dash-page">
      <div className="page-header">
        <p className="eyebrow">AI insights</p>
        <h2>AI Risk Prediction</h2>
      </div>

      {loading && (
        <div className="placeholder-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Analyzing farm data with AI...</p>
        </div>
      )}

      {error && (
        <div className="placeholder-card" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
          <p>Error: {error}</p>
          <button onClick={fetchPrediction} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      )}

      {!loading && !error && prediction && (
        <div className="ai-dashboard-grid">
          <div className="placeholder-card risk-card" style={{ borderLeft: `6px solid ${getRiskColor(prediction.risk_level)}` }}>
            <h3>Current Risk Level</h3>
            <div className="risk-display">
              <span className="risk-badge" style={{ backgroundColor: getRiskColor(prediction.risk_level) }}>
                {prediction.risk_level}
              </span>
              <span className="confidence-score">Confidence: {prediction.confidence_score}%</span>
            </div>
            <p className="analysis-text">{prediction.analysis}</p>
          </div>

          <div className="placeholder-card recommendations-card">
            <h3>AI Recommendations</h3>
            <ul className="recommendations-list">
              {prediction.recommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">
                  <span className="bullet">•</span> {rec}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={fetchPrediction} className="btn-secondary">Refresh Analysis</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIRiskPrediction
