# SmartPark™ - Smart Parking Booking System

A full-stack Smart Parking Management & Space Booking System with interactive building & area selection, real-time bay availability status, live price estimation, multi-method payment gateway checkout, and digital QR gate pass generation.

---

## 🚀 Key Features

1. **Building & Destination Selector**
   - Browse multi-story commercial buildings, shopping malls, airport hubs, and tech parks.
   - Shows location address, amenities (EV chargers, valet, security), ratings, and live total vacancies.

2. **Place Area & Parking Floor Selection**
   - Detailed levels: Basement B1 (Premium & EV), Basement B2 (General), Ground Fast Express, Mall Entertainment Levels, etc.
   - Per-floor dynamic hourly rate pricing, slot count, and floor space dimensions in metres and centimetres (e.g. `1,250 m² (50m × 25m / 5,000cm × 2,500cm)`).

3. **Interactive Visual Parking Deck & Space Metrics**
   - Real-time slot status: **Available (Green)**, **Occupied (Red)**, **Reserved (Amber)**, **Selected (Indigo)**.
   - Exact spot space & dimensions specified in both **metres (m)** and **centimetres (cm)** for each spot type:
     - **Sedan**: `5.0m × 2.5m (500cm × 250cm) • 12.5 m²`
     - **SUV / Van**: `5.5m × 2.8m (550cm × 280cm) • 15.4 m²`
     - **⚡ EV Charging Spot**: `5.2m × 2.6m (520cm × 260cm) • 13.5 m²`
     - **Compact**: `4.5m × 2.3m (450cm × 230cm) • 10.35 m²`
     - **Handicapped**: `6.0m × 3.6m (600cm × 360cm) • 21.6 m²`
   - Height clearance indicators (e.g. `2.4m (240cm)` to `3.0m (300cm)`).
   - Filtering by spot type.

4. **Transparent Pricing & Calculation Breakdown**
   - Dynamic real-time calculation based on hourly rates, parking duration slider (1–12 hours), vehicle category multipliers.
   - Optional smart amenities (Fast EV Supercharging, Eco Car Wash, Valet Concierge).
   - Itemized bill with base rate, GST & service tax (18%), and total payable.

5. **Integrated Payment Gateway Checkout**
   - **Credit/Debit Card**: Virtual card preview with live validation.
   - **UPI / Dynamic QR Code**: Generates standard UPI QR codes scannable with Google Pay, PhonePe, Paytm, and BHIM.
   - **Digital Wallets & Net Banking**: Instant checkout simulation.
   - Secure authorization simulation.

6. **Smart Digital Boarding Pass & QR Entry Ticket**
   - Real-time generated entry pass with barcode / QR scanner data.
   - Vehicle registration number, driver name, slot code, area level, validity window timer.
   - Print to PDF / paper pass support.

7. **My Bookings & Cancellation Support**
   - View active and past passes.
   - One-click spot cancellation with instant refund processing.

8. **Live Admin & Sensor Metrics Dashboard**
   - Occupancy percentages, total available vs occupied slots, and real-time revenue analytics.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, REST API architecture
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, Tailwind CSS, FontAwesome 6, QRCode.js
- **Data Persistence**: In-memory store with dynamic generator and slot state sync

---

## 📦 How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Launch
```bash
# Clone the repository
git clone https://github.com/<your-username>/smart-parking-system.git
cd smart-parking-system

# Install dependencies
npm install

# Start the server
node server.js
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/buildings` | List all buildings with vacancies & rates |
| `GET` | `/api/buildings/:id` | Get specific building with all parking floors/areas |
| `GET` | `/api/buildings/:id/areas/:areaId/slots` | Fetch live slots grid for a building area |
| `POST` | `/api/bookings/quote` | Calculate real-time pricing breakdown |
| `POST` | `/api/bookings` | Book spot and authorize payment |
| `GET` | `/api/bookings` | Get all booking passes |
| `POST` | `/api/bookings/:id/cancel` | Cancel booking and release parking spot |
| `GET` | `/api/stats` | System occupancy and revenue dashboard stats |

---

## 📄 License
MIT License
