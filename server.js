const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store with realistic mock buildings and areas
const buildings = [
  {
    id: 'bld-01',
    name: 'Cyber Heights Tower',
    areaLocation: 'HITEC City, Sector 2',
    city: 'Hyderabad',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    type: 'Commercial Tech Hub',
    totalFloors: 4,
    openingHours: '24/7 Access',
    amenities: ['EV Fast Charging', 'CCTV 24x7', 'Valet Assist', 'Covered Roof', 'Car Spa'],
    baseRatePerHour: 40,
    rating: 4.8,
    areas: [
      {
        id: 'area-b1',
        name: 'Basement 1 (B1) - Premium & EV Bay',
        level: 'Level -1',
        description: 'Nearest to main elevator lobby, includes high-speed DC EV chargers',
        ratePerHour: 55,
        slotCount: 24,
        features: ['EV Ready', 'Wide Slots', 'Direct Lift Access']
      },
      {
        id: 'area-b2',
        name: 'Basement 2 (B2) - Standard Sedan & SUV Bay',
        level: 'Level -2',
        description: 'Spacious multi-bay parking suitable for large SUVs and sedans',
        ratePerHour: 40,
        slotCount: 30,
        features: ['Automated Guidance Sensor', 'Covered']
      },
      {
        id: 'area-l1',
        name: 'Ground Level (G) - Fast Express Bay',
        level: 'Ground Floor',
        description: 'Instant drop & pick quick parking for short duration business visits',
        ratePerHour: 70,
        slotCount: 16,
        features: ['Quick Exit', 'Security Escort', 'Valet Station']
      }
    ]
  },
  {
    id: 'bld-02',
    name: 'Phoenix Grand Galleria',
    areaLocation: 'Whitefield Main Road',
    city: 'Bengaluru',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
    type: 'Shopping & Entertainment Mall',
    totalFloors: 3,
    openingHours: '08:00 AM - 01:00 AM',
    amenities: ['Mall Direct Entry', 'Car Wash', 'Handicap Friendly', 'Security Patrol'],
    baseRatePerHour: 50,
    rating: 4.9,
    areas: [
      {
        id: 'area-mall-p1',
        name: 'P1 - Cinema & Food Court Level',
        level: 'Level 1 Under',
        description: 'Direct escalator entrance into IMAX & Food Court',
        ratePerHour: 60,
        slotCount: 20,
        features: ['Mall Lobby Access', 'Bright LED Zone']
      },
      {
        id: 'area-mall-p2',
        name: 'P2 - Shoppers General Bay',
        level: 'Level 2 Under',
        description: 'Affordable extended shopping parking with trolley drop areas',
        ratePerHour: 45,
        slotCount: 28,
        features: ['Trolley Return Point', 'CCTV Monitored']
      }
    ]
  },
  {
    id: 'bld-03',
    name: 'Metropolitan Financial Plaza',
    areaLocation: 'Bandra Kurla Complex (BKC)',
    city: 'Mumbai',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    type: 'Corporate Banking District',
    totalFloors: 5,
    openingHours: '24/7 Corporate Pass',
    amenities: ['ANPR Automatic Plate Reader', 'Chauffeur Lounge', 'EV Superchargers'],
    baseRatePerHour: 65,
    rating: 4.7,
    areas: [
      {
        id: 'area-bkc-vip',
        name: 'VIP Executive Deck',
        level: 'Mezzanine Level',
        description: 'Concierge serviced executive parking with extra clearance',
        ratePerHour: 95,
        slotCount: 16,
        features: ['VIP Security', 'Chauffeur Seating', 'Zero Wait Exit']
      },
      {
        id: 'area-bkc-b1',
        name: 'B1 - West Wing Tower Bay',
        level: 'Level -1',
        description: 'Connecting to Tower A & B headquarters',
        ratePerHour: 65,
        slotCount: 26,
        features: ['Turnstile Access', 'Fast Toll Tag']
      }
    ]
  },
  {
    id: 'bld-04',
    name: 'Aeroville Transit & Airport Hub',
    areaLocation: 'Terminal Road Aerocity',
    city: 'New Delhi',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    type: 'Transit & Long Stay Hub',
    totalFloors: 3,
    openingHours: '24/7 Round the Clock',
    amenities: ['Airport Shuttle', 'Long Stay Discounts', 'Luggage Assistance', 'Undercover Security'],
    baseRatePerHour: 55,
    rating: 4.6,
    areas: [
      {
        id: 'area-aero-term',
        name: 'Terminal Express Pod',
        level: 'Level 0 Walkway',
        description: '3 minutes covered walkway directly into Terminal departure gates',
        ratePerHour: 80,
        slotCount: 22,
        features: ['Direct Terminal Walk', 'Baggage Carts']
      },
      {
        id: 'area-aero-long',
        name: 'Long Stay Multi-Day Yard',
        level: 'Basement P3',
        description: 'Secure multi-day and overnight parking with daily capped rates',
        ratePerHour: 40,
        slotCount: 32,
        features: ['24/7 Guarded', 'Low Daily Cap']
      }
    ]
  }
];

// Helper to generate slots dynamically for any building and area
const slotStore = {};

function initSlotsForArea(buildingId, areaId, count) {
  const key = `${buildingId}_${areaId}`;
  if (slotStore[key]) return slotStore[key];

  const types = ['Sedan', 'SUV', 'EV', 'Compact', 'Handicapped'];
  const slots = [];

  for (let i = 1; i <= count; i++) {
    const code = `${areaId.split('-')[1]?.toUpperCase() || 'P'}-${i.toString().padStart(2, '0')}`;
    let slotType = 'Sedan';
    if (i % 6 === 0) slotType = 'EV';
    else if (i % 5 === 0) slotType = 'SUV';
    else if (i % 9 === 0) slotType = 'Handicapped';
    else if (i % 4 === 0) slotType = 'Compact';

    // Deterministic mock initial occupancy for realistic feel
    const isOccupied = (i * 7) % 5 === 0;
    const isReserved = !isOccupied && (i * 3) % 7 === 0;

    slots.push({
      id: `${key}_slot_${i}`,
      code: code,
      number: i,
      type: slotType,
      status: isOccupied ? 'OCCUPIED' : (isReserved ? 'RESERVED' : 'AVAILABLE'),
      currentBookingId: null,
      sensorActive: true
    });
  }

  slotStore[key] = slots;
  return slots;
}

// In-memory bookings store
const bookings = [
  {
    id: 'BK-78214',
    buildingId: 'bld-01',
    buildingName: 'Cyber Heights Tower',
    areaId: 'area-b1',
    areaName: 'Basement 1 (B1) - Premium & EV Bay',
    buildingLocation: 'HITEC City, Sector 2, Hyderabad',
    slotId: 'bld-01_area-b1_slot_4',
    slotCode: 'B1-04',
    slotType: 'EV',
    vehicleNumber: 'TS-09-EA-4521',
    vehicleType: 'Electric Vehicle (EV)',
    driverName: 'Rahul Verma',
    phone: '+91 98765 43210',
    startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    durationHours: 3,
    endTime: new Date(Date.now() + 135 * 60 * 1000).toISOString(),
    pricing: {
      ratePerHour: 55,
      durationHours: 3,
      baseFare: 165,
      addOnsAmount: 50,
      addOns: ['EV Supercharging (Fast DC)'],
      subtotal: 215,
      tax: 38.7,
      total: 253.7
    },
    payment: {
      method: 'UPI',
      upiId: 'rahul@oksbi',
      transactionId: 'TXN-984271892',
      status: 'PAID',
      paidAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    ticketCode: 'PASS-CYBER-B1-04',
    status: 'ACTIVE'
  }
];

// Routes

// 1. Get all buildings with summary & available slot count
app.get('/api/buildings', (req, res) => {
  const result = buildings.map(bld => {
    let totalSlots = 0;
    let availableSlots = 0;

    bld.areas.forEach(area => {
      const slots = initSlotsForArea(bld.id, area.id, area.slotCount);
      totalSlots += slots.length;
      availableSlots += slots.filter(s => s.status === 'AVAILABLE').length;
    });

    return {
      ...bld,
      totalSlots,
      availableSlots,
      occupancyPercentage: Math.round(((totalSlots - availableSlots) / totalSlots) * 100)
    };
  });

  res.json({ success: true, data: result });
});

// 2. Get specific building details
app.get('/api/buildings/:id', (req, res) => {
  const bld = buildings.find(b => b.id === req.params.id);
  if (!bld) return res.status(404).json({ success: false, message: 'Building not found' });

  const areasWithStats = bld.areas.map(area => {
    const slots = initSlotsForArea(bld.id, area.id, area.slotCount);
    const available = slots.filter(s => s.status === 'AVAILABLE').length;
    return {
      ...area,
      totalSlots: slots.length,
      availableSlots: available
    };
  });

  res.json({
    success: true,
    data: {
      ...bld,
      areas: areasWithStats
    }
  });
});

// 3. Get slots for a specific building area
app.get('/api/buildings/:id/areas/:areaId/slots', (req, res) => {
  const { id: buildingId, areaId } = req.params;
  const bld = buildings.find(b => b.id === buildingId);
  if (!bld) return res.status(404).json({ success: false, message: 'Building not found' });

  const area = bld.areas.find(a => a.id === areaId);
  if (!area) return res.status(404).json({ success: false, message: 'Parking area not found' });

  const slots = initSlotsForArea(buildingId, areaId, area.slotCount);

  res.json({
    success: true,
    data: {
      building: { id: bld.id, name: bld.name, location: bld.areaLocation },
      area: { id: area.id, name: area.name, level: area.level, ratePerHour: area.ratePerHour },
      slots: slots
    }
  });
});

// 4. Calculate price quote before booking
app.post('/api/bookings/quote', (req, res) => {
  const { buildingId, areaId, slotId, durationHours = 2, addOns = [], vehicleType } = req.body;

  const bld = buildings.find(b => b.id === buildingId);
  if (!bld) return res.status(400).json({ success: false, message: 'Invalid building' });

  const area = bld.areas.find(a => a.id === areaId);
  if (!area) return res.status(400).json({ success: false, message: 'Invalid area' });

  const hours = Math.max(1, parseInt(durationHours, 10) || 1);
  let rate = area.ratePerHour;

  // Vehicle type adjustments
  if (vehicleType === 'Two Wheeler') rate = Math.round(rate * 0.5);
  else if (vehicleType === 'SUV/Van') rate = Math.round(rate * 1.2);

  const baseFare = rate * hours;

  // Addons pricing
  const addOnPricingMap = {
    'ev_charging': { name: 'Fast EV Charging', price: 120 },
    'car_wash': { name: 'Eco High-Pressure Car Wash', price: 199 },
    'valet_assist': { name: 'Executive Valet Service', price: 79 },
    'helmet_lock': { name: 'Secure Helmet Locker', price: 20 }
  };

  let addOnsAmount = 0;
  const selectedAddonsList = [];

  if (Array.isArray(addOns)) {
    addOns.forEach(addonKey => {
      if (addOnPricingMap[addonKey]) {
        addOnsAmount += addOnPricingMap[addonKey].price;
        selectedAddonsList.push(addOnPricingMap[addonKey].name);
      }
    });
  }

  const subtotal = baseFare + addOnsAmount;
  const gstRate = 0.18; // 18% GST
  const tax = Math.round(subtotal * gstRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  res.json({
    success: true,
    quote: {
      ratePerHour: rate,
      durationHours: hours,
      baseFare,
      addOnsAmount,
      selectedAddonsList,
      subtotal,
      tax,
      total,
      currency: 'INR',
      currencySymbol: '₹'
    }
  });
});

// 5. Create new booking and process simulated payment
app.post('/api/bookings', (req, res) => {
  const {
    buildingId,
    areaId,
    slotId,
    vehicleNumber,
    vehicleType,
    driverName,
    phone,
    durationHours = 2,
    addOns = [],
    paymentMethod,
    paymentDetails
  } = req.body;

  if (!buildingId || !areaId || !slotId || !vehicleNumber || !driverName) {
    return res.status(400).json({ success: false, message: 'Missing required booking fields' });
  }

  const bld = buildings.find(b => b.id === buildingId);
  if (!bld) return res.status(404).json({ success: false, message: 'Building not found' });

  const area = bld.areas.find(a => a.id === areaId);
  if (!area) return res.status(404).json({ success: false, message: 'Area not found' });

  const key = `${buildingId}_${areaId}`;
  const slots = initSlotsForArea(buildingId, areaId, area.slotCount);
  const slot = slots.find(s => s.id === slotId);

  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

  if (slot.status === 'OCCUPIED') {
    return res.status(400).json({ success: false, message: 'Selected parking slot is already occupied. Please pick another spot.' });
  }

  // Calculate fees
  const hours = Math.max(1, parseInt(durationHours, 10) || 1);
  let rate = area.ratePerHour;
  if (vehicleType === 'Two Wheeler') rate = Math.round(rate * 0.5);
  else if (vehicleType === 'SUV/Van') rate = Math.round(rate * 1.2);

  const baseFare = rate * hours;
  const addOnPricingMap = {
    'ev_charging': { name: 'Fast EV Charging', price: 120 },
    'car_wash': { name: 'Eco High-Pressure Car Wash', price: 199 },
    'valet_assist': { name: 'Executive Valet Service', price: 79 },
    'helmet_lock': { name: 'Secure Helmet Locker', price: 20 }
  };

  let addOnsAmount = 0;
  const selectedAddonsList = [];
  if (Array.isArray(addOns)) {
    addOns.forEach(keyName => {
      if (addOnPricingMap[keyName]) {
        addOnsAmount += addOnPricingMap[keyName].price;
        selectedAddonsList.push(addOnPricingMap[keyName].name);
      }
    });
  }

  const subtotal = baseFare + addOnsAmount;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const bookingId = 'BK-' + Math.floor(100000 + Math.random() * 900000);
  const transactionId = 'TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

  // Update slot status
  slot.status = 'OCCUPIED';
  slot.currentBookingId = bookingId;

  const newBooking = {
    id: bookingId,
    buildingId,
    buildingName: bld.name,
    buildingLocation: `${bld.areaLocation}, ${bld.city}`,
    areaId,
    areaName: area.name,
    areaLevel: area.level,
    slotId,
    slotCode: slot.code,
    slotType: slot.type,
    vehicleNumber: vehicleNumber.toUpperCase().trim(),
    vehicleType: vehicleType || 'Sedan',
    driverName: driverName.trim(),
    phone: phone ? phone.trim() : 'N/A',
    startTime: startTime.toISOString(),
    durationHours: hours,
    endTime: endTime.toISOString(),
    pricing: {
      ratePerHour: rate,
      durationHours: hours,
      baseFare,
      addOnsAmount,
      addOns: selectedAddonsList,
      subtotal,
      tax,
      total,
      currency: 'INR'
    },
    payment: {
      method: paymentMethod || 'Card',
      transactionId,
      status: 'PAID',
      paidAt: startTime.toISOString(),
      cardLast4: paymentDetails?.cardLast4 || '4242',
      upiId: paymentDetails?.upiId || null
    },
    ticketCode: `PASS-${bld.name.split(' ')[0].toUpperCase()}-${slot.code}`,
    status: 'ACTIVE'
  };

  bookings.unshift(newBooking);

  res.status(201).json({
    success: true,
    message: 'Parking slot booked successfully! Payment authorized.',
    data: newBooking
  });
});

// 6. Get all bookings / history
app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    data: bookings
  });
});

// 7. Get single booking
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, data: booking });
});

// 8. Cancel booking
app.post('/api/bookings/:id/cancel', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.status === 'CANCELLED') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }

  // Release the slot
  const key = `${booking.buildingId}_${booking.areaId}`;
  if (slotStore[key]) {
    const slot = slotStore[key].find(s => s.id === booking.slotId);
    if (slot) {
      slot.status = 'AVAILABLE';
      slot.currentBookingId = null;
    }
  }

  booking.status = 'CANCELLED';
  booking.cancelledAt = new Date().toISOString();
  booking.refundAmount = booking.pricing.total;
  booking.refundStatus = 'INITIATED';

  res.json({
    success: true,
    message: 'Booking cancelled successfully. Refund of ₹' + booking.pricing.total + ' initiated to original payment source.',
    data: booking
  });
});

// 9. Dashboard overview stats
app.get('/api/stats', (req, res) => {
  let totalSlots = 0;
  let totalAvailable = 0;
  let totalOccupied = 0;

  buildings.forEach(bld => {
    bld.areas.forEach(area => {
      const slots = initSlotsForArea(bld.id, area.id, area.slotCount);
      totalSlots += slots.length;
      totalAvailable += slots.filter(s => s.status === 'AVAILABLE').length;
      totalOccupied += slots.filter(s => s.status === 'OCCUPIED').length;
    });
  });

  const activeBookingsCount = bookings.filter(b => b.status === 'ACTIVE').length;
  const totalRevenue = bookings
    .filter(b => b.payment.status === 'PAID')
    .reduce((sum, b) => sum + (b.pricing?.total || 0), 0);

  res.json({
    success: true,
    data: {
      totalBuildings: buildings.length,
      totalSlots,
      totalAvailable,
      totalOccupied,
      activeBookingsCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      occupancyRate: Math.round((totalOccupied / totalSlots) * 100)
    }
  });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚗 Smart Parking System is running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
