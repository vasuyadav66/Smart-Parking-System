// Smart Parking System - Frontend Application Logic

// Application State
const state = {
  buildings: [],
  selectedBuilding: null,
  selectedArea: null,
  slots: [],
  selectedSlot: null,
  slotFilter: 'all',
  currentQuote: null,
  bookings: [],
  activePaymentTab: 'card',
  qrCodeInstance: null,
  ticketQrInstance: null
};

// API Base URL
const API = {
  buildings: '/api/buildings',
  buildingDetails: (id) => `/api/buildings/${id}`,
  areaSlots: (bId, aId) => `/api/buildings/${bId}/areas/${aId}/slots`,
  quote: '/api/bookings/quote',
  bookings: '/api/bookings',
  cancelBooking: (id) => `/api/bookings/${id}/cancel`,
  stats: '/api/stats'
};

// Initialize Application on Page Load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchBuildings();
  await fetchBookings();
  await fetchStats();
});

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  const colors = {
    success: 'bg-emerald-950 border-emerald-500/50 text-emerald-300',
    error: 'bg-rose-950 border-rose-500/50 text-rose-300',
    info: 'bg-slate-900 border-indigo-500/50 text-indigo-300'
  };

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  toast.className = `p-3.5 rounded-xl border shadow-xl flex items-center gap-3 text-xs max-w-sm pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-base"></i>
    <span class="font-medium flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Fetch and render buildings
async function fetchBuildings() {
  try {
    const res = await fetch(API.buildings);
    const data = await res.json();
    if (data.success) {
      state.buildings = data.data;
      renderBuildings(state.buildings);

      // Select first building automatically by default
      if (state.buildings.length > 0) {
        selectBuilding(state.buildings[0].id);
      }
    }
  } catch (err) {
    console.error('Failed to load buildings', err);
    showToast('Failed to connect to parking server', 'error');
  }
}

// Render building cards
function renderBuildings(buildings) {
  const grid = document.getElementById('buildings-grid');
  grid.innerHTML = '';

  buildings.forEach(bld => {
    const isSelected = state.selectedBuilding && state.selectedBuilding.id === bld.id;
    const card = document.createElement('div');
    card.className = `building-card bg-slate-900/90 border ${isSelected ? 'active-building border-indigo-500' : 'border-slate-800'} rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between`;
    card.onclick = () => selectBuilding(bld.id);

    card.innerHTML = `
      <div>
        <div class="h-36 relative overflow-hidden">
          <img src="${bld.image}" alt="${bld.name}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur text-emerald-400 border border-slate-700/80">
            ${bld.availableSlots} spots free
          </span>
          <span class="absolute bottom-2.5 left-2.5 text-xs font-semibold text-white px-2 py-0.5 rounded bg-black/60 backdrop-blur">
            ${bld.type}
          </span>
        </div>
        <div class="p-4 space-y-2">
          <h3 class="text-base font-bold text-white leading-snug">${bld.name}</h3>
          <p class="text-xs text-slate-400 flex items-center gap-1.5">
            <i class="fa-solid fa-location-dot text-indigo-400"></i> ${bld.areaLocation}, ${bld.city}
          </p>
          <div class="flex items-center justify-between text-xs pt-1">
            <span class="text-slate-400"><i class="fa-solid fa-clock text-indigo-400 mr-1"></i> ${bld.openingHours}</span>
            <span class="text-emerald-400 font-bold font-mono">₹${bld.baseRatePerHour}/hr</span>
          </div>
        </div>
      </div>
      <div class="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span class="text-slate-400">${bld.areas.length} Parking Floors</span>
        <span class="text-indigo-400 font-semibold flex items-center gap-1">
          Select Area <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </span>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Filter buildings by search input
function filterBuildings() {
  const query = document.getElementById('building-search').value.toLowerCase().trim();
  const filtered = state.buildings.filter(b => 
    b.name.toLowerCase().includes(query) || 
    b.areaLocation.toLowerCase().includes(query) ||
    b.city.toLowerCase().includes(query)
  );
  renderBuildings(filtered);
}

// Select building and load its areas
async function selectBuilding(buildingId) {
  try {
    const res = await fetch(API.buildingDetails(buildingId));
    const data = await res.json();
    if (!data.success) return;

    state.selectedBuilding = data.data;
    state.selectedSlot = null;

    // Highlight card
    renderBuildings(state.buildings);

    // Update Step 2 panel
    const panel = document.getElementById('area-selection-panel');
    panel.classList.remove('hidden');

    document.getElementById('active-building-name').textContent = state.selectedBuilding.name;
    document.getElementById('active-building-type').textContent = state.selectedBuilding.type;
    document.getElementById('active-building-loc').innerHTML = `<i class="fa-solid fa-location-dot text-indigo-400"></i> ${state.selectedBuilding.areaLocation}, ${state.selectedBuilding.city}`;
    document.getElementById('active-building-img').src = state.selectedBuilding.image;

    // Amenities pills
    const amenitiesCont = document.getElementById('active-building-amenities');
    amenitiesCont.innerHTML = state.selectedBuilding.amenities.map(a => 
      `<span class="px-2.5 py-1 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center gap-1.5"><i class="fa-solid fa-check text-indigo-400 text-[10px]"></i> ${a}</span>`
    ).join('');

    renderAreaTabs(state.selectedBuilding.areas);

    // Select first area automatically
    if (state.selectedBuilding.areas.length > 0) {
      selectArea(state.selectedBuilding.areas[0].id);
    }

  } catch (err) {
    console.error(err);
    showToast('Failed to load building areas', 'error');
  }
}

// Render Floor / Area Selector Cards
function renderAreaTabs(areas) {
  const container = document.getElementById('area-tabs-container');
  container.innerHTML = '';

  areas.forEach(area => {
    const isSelected = state.selectedArea && state.selectedArea.id === area.id;
    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
      isSelected 
        ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/20' 
        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
    }`;
    card.onclick = () => selectArea(area.id);

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-bold text-white">${area.name}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            area.availableSlots > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }">${area.availableSlots} Free</span>
        </div>
        <p class="text-[11px] text-slate-400 line-clamp-2">${area.description}</p>
      </div>
      <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
        <span class="text-slate-400">${area.level}</span>
        <span class="font-bold text-emerald-400 font-mono">₹${area.ratePerHour}/hr</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// Select Area and Load Slots Grid
async function selectArea(areaId) {
  const area = state.selectedBuilding.areas.find(a => a.id === areaId);
  if (!area) return;

  state.selectedArea = area;
  state.selectedSlot = null;

  renderAreaTabs(state.selectedBuilding.areas);
  document.getElementById('area-rate-badge').textContent = `₹${area.ratePerHour} / hr`;

  // Show slots layout
  const slotsPanel = document.getElementById('slots-layout-panel');
  slotsPanel.classList.remove('hidden');

  document.getElementById('current-area-title').textContent = `${state.selectedBuilding.name} — ${area.name}`;
  document.getElementById('current-area-level').textContent = area.level;
  document.getElementById('current-area-desc').textContent = `${area.description} • Base Rate: ₹${area.ratePerHour}/hr`;

  // Fetch Slots
  try {
    const res = await fetch(API.areaSlots(state.selectedBuilding.id, area.id));
    const data = await res.json();
    if (data.success) {
      state.slots = data.data.slots;
      renderSlotsGrid();
      resetBookingForm();
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to load parking slots', 'error');
  }
}

// Filter Slots by Vehicle Type
function filterSlots(type) {
  state.slotFilter = type;
  document.querySelectorAll('.slot-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(type) || (type === 'all' && btn.textContent === 'All'));
    btn.classList.toggle('bg-slate-800', btn.classList.contains('active'));
    btn.classList.toggle('text-white', btn.classList.contains('active'));
  });
  renderSlotsGrid();
}

// Render Parking Slots Deck
function renderSlotsGrid() {
  const grid = document.getElementById('slots-grid');
  grid.innerHTML = '';

  const filtered = state.slotFilter === 'all' 
    ? state.slots 
    : state.slots.filter(s => s.type === state.slotFilter);

  filtered.forEach(slot => {
    const isSelected = state.selectedSlot && state.selectedSlot.id === slot.id;
    const isAvailable = slot.status === 'AVAILABLE';
    const isOccupied = slot.status === 'OCCUPIED';
    const isReserved = slot.status === 'RESERVED';

    const card = document.createElement('div');
    let statusClass = 'available';
    if (isOccupied) statusClass = 'occupied';
    else if (isReserved) statusClass = 'reserved';
    if (isSelected) statusClass = 'selected';

    card.className = `slot-card ${statusClass} p-3 rounded-xl flex flex-col justify-between items-center text-center aspect-[4/5]`;

    // Slot type icon
    let typeIcon = 'fa-car';
    if (slot.type === 'EV') typeIcon = 'fa-bolt text-cyan-400';
    else if (slot.type === 'SUV') typeIcon = 'fa-truck-pickup';
    else if (slot.type === 'Handicapped') typeIcon = 'fa-wheelchair text-blue-400';

    card.innerHTML = `
      <div class="w-full flex items-center justify-between text-[10px] font-mono">
        <span class="font-bold text-slate-300">${slot.code}</span>
        <i class="fa-solid ${typeIcon}"></i>
      </div>

      <div class="my-auto">
        <div class="text-sm sm:text-base font-black font-mono tracking-tight ${
          isAvailable ? 'text-emerald-400' : (isOccupied ? 'text-rose-400' : 'text-amber-400')
        }">
          ${slot.code}
        </div>
        <div class="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
          ${slot.type}
        </div>
      </div>

      <div class="w-full">
        <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
          isSelected 
            ? 'bg-indigo-500 text-white' 
            : (isAvailable 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : (isOccupied ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'))
        }">
          ${isSelected ? 'Selected' : slot.status}
        </span>
      </div>
    `;

    if (isAvailable) {
      card.onclick = () => selectSlot(slot);
    } else {
      card.onclick = () => {
        showToast(`Spot ${slot.code} is currently ${slot.status.toLowerCase()}. Please pick another spot.`, 'info');
      };
    }

    grid.appendChild(card);
  });
}

// Select a slot and activate booking panel
function selectSlot(slot) {
  state.selectedSlot = slot;
  renderSlotsGrid();

  document.getElementById('no-slot-notice').classList.add('hidden');
  document.getElementById('booking-form').classList.remove('hidden');

  document.getElementById('selected-slot-code').textContent = slot.code;
  document.getElementById('selected-slot-area-name').textContent = `${state.selectedArea.name} (${state.selectedBuilding.name})`;
  document.getElementById('selected-slot-type-info').innerHTML = `<i class="fa-solid fa-car"></i> ${slot.type} Bay`;
  document.getElementById('selected-slot-rate').textContent = `₹${state.selectedArea.ratePerHour}/hr`;

  updatePriceCalculation();
}

// Reset booking form
function resetBookingForm() {
  state.selectedSlot = null;
  document.getElementById('no-slot-notice').classList.remove('hidden');
  document.getElementById('booking-form').classList.add('hidden');
}

// Duration slider change
function onDurationChange(val) {
  document.getElementById('duration-display').textContent = `${val} ${val == 1 ? 'Hour' : 'Hours'}`;
  updatePriceCalculation();
}

// Real-time Price Calculation via Quote API
async function updatePriceCalculation() {
  if (!state.selectedBuilding || !state.selectedArea || !state.selectedSlot) return;

  const durationHours = parseInt(document.getElementById('input-duration').value, 10);
  const vehicleType = document.getElementById('input-vehicle-type').value;

  const selectedAddons = [];
  document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
    selectedAddons.push(cb.value);
  });

  try {
    const res = await fetch(API.quote, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildingId: state.selectedBuilding.id,
        areaId: state.selectedArea.id,
        slotId: state.selectedSlot.id,
        durationHours,
        vehicleType,
        addOns: selectedAddons
      })
    });

    const data = await res.json();
    if (data.success) {
      const q = data.quote;
      state.currentQuote = q;

      document.getElementById('calc-hours').textContent = q.durationHours;
      document.getElementById('calc-rate').textContent = q.ratePerHour;
      document.getElementById('calc-base').textContent = q.baseFare.toFixed(2);

      const addonRow = document.getElementById('calc-addon-row');
      if (q.addOnsAmount > 0) {
        addonRow.classList.remove('hidden');
        document.getElementById('calc-addons').textContent = q.addOnsAmount.toFixed(2);
      } else {
        addonRow.classList.add('hidden');
      }

      document.getElementById('calc-tax').textContent = q.tax.toFixed(2);
      document.getElementById('calc-total').textContent = q.total.toFixed(2);
      document.getElementById('btn-pay-total').textContent = q.total.toFixed(2);
    }
  } catch (err) {
    console.error('Quote calculation error', err);
  }
}

// Open Payment Checkout Modal
function openPaymentModal() {
  if (!state.selectedSlot || !state.currentQuote) return;

  const modal = document.getElementById('payment-modal');
  modal.classList.remove('hidden');

  document.getElementById('modal-pay-amount').textContent = state.currentQuote.total.toFixed(2);
  document.getElementById('modal-pay-btn-label').textContent = state.currentQuote.total.toFixed(2);
  document.getElementById('modal-pay-slot-info').textContent = `${state.selectedBuilding.name} (${state.selectedSlot.code})`;
  document.getElementById('modal-pay-duration').textContent = `${state.currentQuote.durationHours} Hours Duration`;

  // Update cardholder name preview
  const driverName = document.getElementById('input-driver-name').value.toUpperCase() || 'VASU YADAV';
  document.getElementById('card-preview-name').textContent = driverName;

  // Render UPI QR code if selected
  generateUpiQrCode();
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

// Payment Tab Switcher
function selectPaymentTab(tab) {
  state.activePaymentTab = tab;

  ['card', 'upi', 'wallet'].forEach(t => {
    const btn = document.getElementById(`pay-tab-${t}`);
    const body = document.getElementById(`payment-body-${t}`);
    const isActive = t === tab;

    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('border-indigo-500', isActive);
      btn.classList.toggle('bg-indigo-950/40', isActive);
    }
    if (body) {
      body.classList.toggle('hidden', !isActive);
    }
  });

  if (tab === 'upi') {
    generateUpiQrCode();
  }
}

// Generate UPI QR Code inside modal
function generateUpiQrCode() {
  const container = document.getElementById('upi-qrcode-container');
  container.innerHTML = '';
  const total = state.currentQuote ? state.currentQuote.total.toFixed(2) : '47.20';
  const upiUrl = `upi://pay?pa=smartpark@bank&pn=SmartParkSystems&am=${total}&cu=INR&tn=ParkingSpot-${state.selectedSlot?.code || 'P1'}`;

  new QRCode(container, {
    text: upiUrl,
    width: 140,
    height: 140,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// Process Payment and Confirm Booking
async function confirmPaymentAndBook() {
  const processingState = document.getElementById('payment-processing-state');
  const actionBtns = document.getElementById('payment-action-buttons');

  processingState.classList.remove('hidden');
  actionBtns.classList.add('hidden');

  const durationHours = parseInt(document.getElementById('input-duration').value, 10);
  const vehicleNumber = document.getElementById('input-vehicle-number').value;
  const driverName = document.getElementById('input-driver-name').value;
  const phone = document.getElementById('input-phone').value;
  const vehicleType = document.getElementById('input-vehicle-type').value;

  const selectedAddons = [];
  document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
    selectedAddons.push(cb.value);
  });

  const payload = {
    buildingId: state.selectedBuilding.id,
    areaId: state.selectedArea.id,
    slotId: state.selectedSlot.id,
    vehicleNumber,
    vehicleType,
    driverName,
    phone,
    durationHours,
    addOns: selectedAddons,
    paymentMethod: state.activePaymentTab.toUpperCase(),
    paymentDetails: {
      cardLast4: '4242',
      upiId: state.activePaymentTab === 'upi' ? document.getElementById('input-upi-id').value : null
    }
  };

  try {
    // Artificial 1.2s delay for payment authorization UX
    await new Promise(r => setTimeout(r, 1200));

    const res = await fetch(API.bookings, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    processingState.classList.add('hidden');
    actionBtns.classList.remove('hidden');

    if (data.success) {
      closePaymentModal();
      showToast('Payment Successful! Parking Pass Generated.', 'success');

      // Refresh data
      await fetchBookings();
      await fetchStats();
      await selectArea(state.selectedArea.id);

      // Open ticket pass modal
      openTicketModal(data.data);
    } else {
      showToast(data.message || 'Payment failed', 'error');
    }

  } catch (err) {
    console.error(err);
    processingState.classList.add('hidden');
    actionBtns.classList.remove('hidden');
    showToast('Failed to complete booking payment', 'error');
  }
}

// Open Digital Pass Ticket Modal
function openTicketModal(booking) {
  const modal = document.getElementById('ticket-modal');
  modal.classList.remove('hidden');

  document.getElementById('pass-id').textContent = booking.id;
  document.getElementById('pass-building-name').textContent = booking.buildingName;
  document.getElementById('pass-building-loc').textContent = booking.buildingLocation;
  document.getElementById('pass-slot-code').textContent = booking.slotCode;
  document.getElementById('pass-area-level').textContent = `${booking.areaLevel} (${booking.areaName.split('-')[0]})`;
  document.getElementById('pass-vehicle').textContent = booking.vehicleNumber;
  document.getElementById('pass-veh-type').textContent = booking.vehicleType;

  const start = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const end = new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('pass-start-time').textContent = start;
  document.getElementById('pass-end-time').textContent = end;

  document.getElementById('pass-total-paid').textContent = booking.pricing.total.toFixed(2);
  document.getElementById('pass-tx-id').textContent = booking.payment.transactionId;

  // Render Gate QR Code
  const qrContainer = document.getElementById('gate-qrcode');
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, {
    text: JSON.stringify({
      passId: booking.id,
      code: booking.ticketCode,
      slot: booking.slotCode,
      vehicle: booking.vehicleNumber
    }),
    width: 120,
    height: 120,
    colorDark: '#0f172a',
    colorLight: '#ffffff'
  });
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.add('hidden');
}

// Fetch and render user bookings
async function fetchBookings() {
  try {
    const res = await fetch(API.bookings);
    const data = await res.json();
    if (data.success) {
      state.bookings = data.data;
      document.getElementById('nav-bookings-count').textContent = state.bookings.filter(b => b.status === 'ACTIVE').length;
      renderBookingsList();
    }
  } catch (err) {
    console.error(err);
  }
}

// Render Bookings List
function renderBookingsList() {
  const container = document.getElementById('bookings-list');
  container.innerHTML = '';

  if (state.bookings.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center border border-slate-800 rounded-2xl bg-slate-900/60">
        <i class="fa-solid fa-ticket text-3xl text-slate-500 mb-3"></i>
        <h4 class="text-sm font-bold text-white">No Bookings Yet</h4>
        <p class="text-xs text-slate-400 mt-1">Reserve a parking slot to see your active pass and tickets here.</p>
      </div>
    `;
    return;
  }

  state.bookings.forEach(b => {
    const card = document.createElement('div');
    const isActive = b.status === 'ACTIVE';

    card.className = `p-5 rounded-2xl border ${isActive ? 'border-slate-700 bg-slate-900' : 'border-slate-800/60 bg-slate-950/70 opacity-75'} space-y-4 shadow-xl`;

    const start = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <div class="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <span class="text-xs font-mono font-bold text-slate-400">${b.id}</span>
          <h4 class="text-base font-bold text-white mt-0.5">${b.buildingName}</h4>
          <p class="text-xs text-slate-400">${b.buildingLocation}</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${
          isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }">${b.status}</span>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs font-mono">
        <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span class="text-[10px] text-slate-400 block font-sans">Spot & Area:</span>
          <span class="text-white font-bold text-sm text-indigo-400">${b.slotCode}</span> (${b.areaLevel})
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span class="text-[10px] text-slate-400 block font-sans">Vehicle Plate:</span>
          <span class="text-white font-bold text-sm">${b.vehicleNumber}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span class="text-[10px] text-slate-400 block font-sans">Duration:</span>
          <span class="text-white">${b.durationHours} Hours (${start} - ${end})</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span class="text-[10px] text-slate-400 block font-sans">Paid Total:</span>
          <span class="text-emerald-400 font-bold font-mono">₹${b.pricing.total.toFixed(2)}</span> (${b.payment.method})
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button onclick='openTicketModal(${JSON.stringify(b)})' class="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition">
          <i class="fa-solid fa-qrcode"></i> View Gate Pass
        </button>
        ${isActive ? `
          <button onclick="cancelBooking('${b.id}')" class="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition">
            <i class="fa-solid fa-ban"></i> Cancel Spot
          </button>
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

// Cancel Booking
async function cancelBooking(id) {
  if (!confirm(`Are you sure you want to cancel booking ${id}? A full refund will be processed immediately.`)) return;

  try {
    const res = await fetch(API.cancelBooking(id), { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await fetchBookings();
      await fetchStats();
      if (state.selectedArea) {
        await selectArea(state.selectedArea.id);
      }
    } else {
      showToast(data.message || 'Failed to cancel', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to cancel booking', 'error');
  }
}

// Fetch Stats and Dashboard Metrics
async function fetchStats() {
  try {
    const res = await fetch(API.stats);
    const data = await res.json();
    if (data.success) {
      const s = data.data;
      document.getElementById('stat-total-slots').textContent = s.totalSlots;
      document.getElementById('stat-avail-slots').textContent = s.totalAvailable;
      document.getElementById('stat-active-bookings').textContent = s.activeBookingsCount;
      document.getElementById('stat-revenue').textContent = `₹${s.totalRevenue.toFixed(2)}`;

      renderStatsTable();
    }
  } catch (err) {
    console.error(err);
  }
}

// Render Stats Table
function renderStatsTable() {
  const tbody = document.getElementById('buildings-stats-table-body');
  tbody.innerHTML = '';

  state.buildings.forEach(b => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition';

    tr.innerHTML = `
      <td class="p-3.5 font-bold text-white">${b.name}</td>
      <td class="p-3.5 text-slate-400">${b.areaLocation}, ${b.city}</td>
      <td class="p-3.5 font-mono">${b.totalSlots}</td>
      <td class="p-3.5 font-mono text-emerald-400 font-bold">${b.availableSlots}</td>
      <td class="p-3.5 font-mono">
        <div class="flex items-center gap-2">
          <div class="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div class="h-full bg-indigo-500 rounded-full" style="width: ${b.occupancyPercentage}%"></div>
          </div>
          <span>${b.occupancyPercentage}%</span>
        </div>
      </td>
      <td class="p-3.5">
        <button onclick="switchView('explore'); selectBuilding('${b.id}');" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-indigo-300 border border-slate-700">
          Book Spots
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Switch between views (explore, bookings, stats)
function switchView(viewName) {
  ['explore', 'bookings', 'stats'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const navBtn = document.getElementById(`nav-btn-${v}`);
    const isActive = v === viewName;

    if (el) el.classList.toggle('hidden', !isActive);
    if (navBtn) navBtn.classList.toggle('active', isActive);
  });

  if (viewName === 'stats') {
    fetchStats();
  } else if (viewName === 'bookings') {
    fetchBookings();
  }
}
