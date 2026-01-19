from flask import Blueprint, jsonify
import random

ai_bp = Blueprint('ai_bp', __name__)

@ai_bp.route('/api/ai/predict', methods=['GET'])
def predict_risk():
    """
    Simulates an AI model prediction for crop risk analysis.
    In the future, this will connect to a real ML model.
    """
    # Mock data simulation
    risks = ["Low", "Moderate", "High"]
    selected_risk = random.choice(risks)
    
    confidence = random.randint(70, 99)
    
    analysis_text = {
        "Low": "Conditions are optimal. Soil moisture and nutrient levels are within the desired range for the current crop cycle.",
        "Moderate": "Minor fluctuations in soil moisture detected. Monitor irrigation schedules closely to prevent stress.",
        "High": "Critical warning: Potential pest infestation detected based on recent visual patterns. immediate inspection recommended."
    }
    
    recommendations = {
        "Low": ["Continue current irrigation schedule", "Routine visual check recommended next week"],
        "Moderate": ["Increase water frequency by 10%", "Check soil sensors for calibration"],
        "High": ["Inspect Sector 4 for pests", "Apply organic neem oil solution if confirmed", "Reduce nitrogen fertilizer temporarily"]
    }

    return jsonify({
        "risk_level": selected_risk,
        "confidence_score": confidence,
        "analysis": analysis_text[selected_risk],
        "recommendations": recommendations[selected_risk],
        "timestamp": "2024-10-27T10:00:00Z" # Mock static timestamp or dynamic
    })
