# EcoGrow: Greenhouse Environmental Monitoring and Management Platform

EcoGrow is an integrated IoT solution designed for precision agriculture. The platform leverages edge computing, real-time telemetry, and predictive analytics to monitor greenhouse environments and mitigate biological risks to plant growth. 

The system utilizes an ESP32-based hardware layer to collect high-granularity sensor data, which is then processed through a dual-service backend architecture to provide real-time monitoring, AI-driven risk assessment, and comprehensive historical reporting.

---

## System Architecture

The EcoGrow ecosystem is partitioned into several distinct functional layers:

### 1. Edge Layer (Hardware)
- **ESP32 Microcontroller**: Serves as the primary IoT gateway.
- **Sensor Integration**: Captures temperature, relative humidity, and CO2 concentrations.
- **Data Ingestion**: Transmits telemetry over MQTT to the centralized broker.

### 2. Communication and Messaging
- **MQTT (Paho)**: High-performance messaging protocol for low-latency data transmission.
- **Socket.io**: Enables bi-directional, real-time communication between the backend services and the presentation layer.

### 3. Core Services Layer (Python/Flask)
- **IoT Hub**: Manages MQTT client sessions and sensor data normalization.
- **Inference Engine**: Executes predictive models to identify risks of bacterial or fungal proliferation.
- **Background Scheduler**: Periodically evaluates environmental conditions and triggers autonomous alerts.
- **Data Persistence**: Interfaces with MySQL for historical record-keeping.

### 4. Identity and Session Management (Node.js/Express)
- **Authentication Microservice**: Handles JWT-based user authentication and Google OAuth 2.0 integration.
- **Secure Sessions**: Implements cookie-based session management and identity verification.

### 5. Presentation Layer (React/Vite)
- **Monitoring Dashboard**: Real-time visualization using Recharts for telemetric data.
- **Administrative Interface**: Dedicated portal for user management and system status monitoring.
- **Risk Analytics**: Dedicated interface for AI-generated environmental insights.

---

## Technical Specifications

- **Predictive Analytics**: Integrated with Gemini AI for advanced environmental risk forecasting and mitigation suggestions.
- **Telemetry Processing**: Real-time data stream processing with sub-second latency from edge to dashboard.
- **Identity Management**: Modular authentication service with support for multi-provider login and role-based access control (RBAC).
- **Automated Testing**: Comprehensive end-to-end validation suite using Selenium.

---

## Project Structure

```text
ecogrow/
├── src/                    # Frontend Application (React/Vite)
│   ├── pages/              # Functional views (Dashboard, Admin, Auth)
│   ├── components/         # Modular UI elements
│   └── services/           # API integration layer
├── server/
│   ├── backend/            # Core IoT and AI Service (Python/Flask)
│   │   ├── app.py          # Service entry point and scheduler
│   │   ├── ai_service.py   # Risk analysis logic
│   │   └── mqtt_service.py # Telemetry ingestion client
│   ├── index.js            # Authentication Service (Node.js/Express)
│   └── db/                 # Database schema and migration scripts
├── seleniumtest.py         # E2E Automation Suite
└── package.json            # Deployment and dependency configuration
```

---

## Installation and Configuration

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL Server 8.0+
- MQTT Broker (EMQX or Mosquitto recommended)

### 1. Database Initialization
Execute the following SQL commands or import `server/db/schema.sql` into your MySQL instance:
```sql
CREATE DATABASE ecogrow_db;
```

### 2. Core Service Configuration (Python)
Navigate to `server/backend/` and install dependencies:
```bash
pip install -r requirements.txt
```
Configure external service parameters in the `.env` file (Database, MQTT Broker, Gemini API Key).

Start the core service:
```bash
python app.py
```

### 3. Authentication Service Configuration (Node.js)
Install Node.js dependencies in the project root:
```bash
npm install
```
Start the authentication microservice:
```bash
npm run dev:server
```

### 4. Development Environment (Frontend)
Initialize the Vite development server:
```bash
npm run dev
```

---

## Testing Infrastructure

The project includes a Selenium-based automated testing suite for validating critical user flows:
- **TC01**: Authenticated session establishment.
- **TC02**: CSV/Excel report generation and data export validation.
- **TC03**: Real-time notification toggle and UI state persistence.

To execute tests:
```bash
python seleniumtest.py
```

---

## Deployment Reference

The application is architected for deployment on AWS EC2 instances. Ensure that the security groups are configured to allow traffic on the following ports:
- **5173**: Frontend Development Server
- **5000**: Core IoT/AI Service
- **4000**: Authentication Microservice
- **8883/1883**: MQTT Broker Traffic
