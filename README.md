# 🌱 EcoGrow – Greenhouse Environment Monitoring System

EcoGrow is an IoT-based greenhouse monitoring system that uses an ESP32 and sensors to measure temperature, humidity, and CO₂ levels in real time. An AI model analyzes these readings to check whether the environment is safe for plant growth or if it may lead to harmful bacteria or fungal development. The system provides alerts when conditions become risky and also stores historical data to help farmers understand environmental changes over time.

## ⭐ Key Features

- **Real-time Monitoring**: Tracks Temperature, Humidity, and CO₂ levels.
- **AI Analysis**: Detects unsafe environmental conditions and predicts bacteria/fungus growth risks.
- **Alert System**: Notifies users when environmental risks increase.
- **Historical Data**: Visualizes past readings and trends.
- **User Management**: Secure login/signup including Google OAuth.

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite)
- **Recharts** for data visualization
- **Socket.io-client** for real-time updates

### Backend
- **Python Flask**: Core API and business logic
- **MySQL**: Relational database for storage
- **MQTT (Paho)**: IoT data ingestion
- **Socket.io**: Real-time communication with frontend
- **Google OAuth**: User authentication

### IoT (Hardware)
- **ESP32**: Microcontroller for sensor data collection

## 📂 Project Structure

```
ecogrow/
├── src/                  # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── pages/            # Application pages
│   ├── services/         # API and service calls
│   └── context/          # React Context (Auth, etc.)
├── server/
│   ├── backend/          # Python Flask Backend
│   │   ├── app.py        # Main entry point for Flask app
│   │   ├── ai_service.py # AI logic for risk prediction
│   │   ├── mqtt_service.py # MQTT client handling
│   │   └── sensor_handler.py # Sensor data processing
│   └── db/
│       └── schema.sql    # Database schema structure
├── public/               # Static assets
└── package.json          # Frontend dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.x
- MySQL Server
- MQTT Broker (e.g., EMQX, Mosquitto)

### 1. Database Setup
1. Create a MySQL database (e.g., `ecogrow_db`).
2. Import the schema from `server/db/schema.sql` into the database.

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd server/backend
pip install -r requirements.txt
```

Create a `.env` file in `server/backend/` with the following variables:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecogrow_db

# Security & Auth
FLASK_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback

# MQTT Configuration
MQTT_BROKER=your_mqtt_broker_url
MQTT_PORT=8883
MQTT_TOPIC=ecogrow/sensors
```

Run the backend server:
```bash
python app.py
```
*The backend server will start on port 5000.*

### 3. Frontend Setup
Navigate to the project root and install dependencies:
```bash
npm install
```

Run the frontend development server:
```bash
npm run dev
```
*The frontend will generally start on http://localhost:5173.*

## 🧪 Usage
1. Open the frontend in your browser.
2. Sign up or log in.
3. View the Dashboard to see real-time sensor data from your ESP32.
4. Check Reports for historical analysis and AI risk predictions.

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
