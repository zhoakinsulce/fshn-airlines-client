// FSHN-Airlines-Client/script.js

// ========== KONFIGURIMI I API ==========
const API_URL = 'http://localhost:3000/api';

// ========== VARIABLA GLOBALE ==========
let selectedFlightId = '';
let selectedFlightData = {};
let allFlights = [];
let currentBooking = {};

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", 
  "Belgium", "Brazil", "Canada", "China", "Croatia", "Denmark", "Egypt", 
  "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "India", 
  "Italy", "Japan", "Mexico", "Netherlands", "Norway", "Poland", "Portugal", 
  "Romania", "Spain", "Sweden", "Switzerland", "Turkey", "USA", "United Kingdom"
];

// ========== INICIALIZIMI ==========
window.onload = () => {
  populateCountries();
  setMinDate();
  checkApiHealth();
};

// ========== FUNKSIONET NDIHMËSE ==========

// Kontrollo shëndetit të API
const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    const data = await response.json();
    console.log('✅ API është aktiv:', data);
  } catch (error) {
    console.error('❌ API nuk është aktiv. Sigurohu që Back-End është nisur!', error);
    alert('⚠️ Gabim: Serveri nuk është aktiv. Niso Back-End-in me: npm start');
  }
};

// Populo vendet në dropdown
const populateCountries = () => {
  const from = document.getElementById('fromCountry');
  const to = document.getElementById('toCountry');

  countries.sort().forEach(country => {
    const option1 = document.createElement('option');
    option1.value = country;
    option1.textContent = country;
    from.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = country;
    option2.textContent = country;
    to.appendChild(option2);
  });
};

// Vendos datën minimale (sot)
const setMinDate = () => {
  const today = new Date().toISOString().split('T');
  document.getElementById('flightDate').min = today;
};

// Navigimi ndërmjet faqeve
const navigate = (pageId) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);
};

// ========== FUNKSIONET E FLUTURIMEVE ==========

// 1️⃣ GJEJ FLUTURIMET
const generateFlights = async () => {
  const from = document.getElementById('fromCountry').value;
  const to = document.getElementById('toCountry').value;
  const date = document.getElementById('flightDate').value;

  // Validimi
  if (!from || !to || !date) {
    alert('⚠️ Ju lutemi plotësoni të gjitha fushat!');
    return;
  }

  if (from === to) {
    alert('⚠️ Nisja dhe destinacioni duhet të jenë të ndryshme!');
    return;
  }

  try {
    // Shfaq loading
    const list = document.getElementById('flightsList');
    list.innerHTML = '<p style="text-align: center; padding: 40px;">⏳ Po ngarkohen fluturimet...</p>';

    // Merr fluturimet nga API
    const response = await fetch(`${API_URL}/flights`);
    const result = await response.json();

    if (!result.success) {
      throw new Error('Gabim në marrjen e fluturimeve');
    }

    allFlights = result.data;

    // Filtro fluturimet sipas origin dhe destination
    const filteredFlights = allFlights.filter(f => 
      f.origin.toUpperCase() === from.toUpperCase() && 
      f.destination.toUpperCase() === to.toUpperCase()
    );

    if (filteredFlights.length === 0) {
      list.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">❌ Nuk ka fluturime të disponueshme për këtë rute!</p>';
      navigate('resultsPage');
      return;
    }

    // Përditëso titullin
    document.getElementById('routeLabel').innerText = `${from} ➔ ${to} (${date})`;

    // Shfaq fluturimet
    list.innerHTML = '';
    filteredFlights.forEach((flight, index) => {
      const flightCard = document.createElement('div');
      flightCard.className = 'flight-card';
      flightCard.innerHTML = `
        <div class="flight-info">
          <div style="text-align: center;">
            <strong>${flight.departureTime.substring(11, 16)}</strong>
            <p>${flight.origin}</p>
          </div>
          <div style="font-size: 24px; color: var(--sky-blue);">✈</div>
          <div style="text-align: center;">
            <strong>${flight.arrivalTime.substring(11, 16)}</strong>
            <p>${flight.destination}</p>
          </div>
        </div>
        <div class="price-box">
          <div class="price-val">€${flight.price}</div>
          <button class="main-btn" style="padding: 10px; font-size: 14px;" 
            onclick="selectFlight('${flight.id}', '${flight.flightNumber}', ${flight.price}, '${flight.origin}', '${flight.destination}')">
            ZGJIDH
          </button>
        </div>
      `;
      list.appendChild(flightCard);
    });

    navigate('resultsPage');

  } catch (error) {
    console.error('❌ Gabim:', error);
    alert('❌ Gabim në marrjen e fluturimeve: ' + error.message);
  }
};

// 2️⃣ ZGJIDH NJË FLUTURIM
const selectFlight = (flightId, flightNumber, price, origin, destination) => {
  selectedFlightId = flightId;
  selectedFlightData = { flightNumber, price, origin, destination };
  currentBooking.flightId = flightId;
  currentBooking.price = price;
  navigate('passengerPage');
};

// ========== FUNKSIONET E REZERVIMIT ==========

// 3️⃣ KRIJO REZERVIM
const goToConfirmation = async () => {
  const firstName = document.getElementById('pName').value;
  const lastName = document.getElementById('pSurname').value;
  const passport = document.getElementById('pPassport').value;

  // Validimi
  if (!firstName || !lastName || !passport) {
    alert('⚠️ Ju lutemi plotësoni të gjitha të dhënat!');
    return;
  }

  try {
    // Shfaq loading
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Po përpunohet...';

    // Krijo rezervim përmes API
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flightId: selectedFlightId,
        passengerName: `${firstName} ${lastName}`,
        passportNumber: passport,
        email: 'passenger@fshn.com',
        phone: '+355 (0) 123 456 789'
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Gabim në krijimin e rezervimit');
    }

    // Ruaj të dhënat e rezervimit
    currentBooking = result.data;

    // Përditëso Boarding Pass
    document.getElementById('ticketUser').innerText = `${firstName} ${lastName}`.toUpperCase();
    document.getElementById('ticketPass').innerText = passport;
    document.getElementById('ticketDate').innerText = new Date().toISOString().split('T');
    document.getElementById('tDep').innerText = selectedFlightData.origin.substring(0, 3).toUpperCase();
    document.getElementById('tArr').innerText = selectedFlightData.destination.substring(0, 3).toUpperCase();
    document.getElementById('tDepFull').innerText = selectedFlightData.origin;
    document.getElementById('tArrFull').innerText = selectedFlightData.destination;

    // Shfaq PNR në boarding pass
    document.querySelector('.barcode-strips').textContent = `PNR: ${result.data.pnr}`;

    navigate('confirmPage');
    btn.disabled = false;
    btn.textContent = 'REZERVO DHE KONFIRMO';

  } catch (error) {
    console.error('❌ Gabim:', error);
    alert('❌ Gabim në rezervim: ' + error.message);
    event.target.disabled = false;
    event.target.textContent = 'REZERVO DHE KONFIRMO';
  }
};

// ========== FUNKSIONET E CHECK-IN ==========

// 4️⃣ KRIJO PREVIEW TË PASHAPORTES
const previewPassport = (input) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('passportImgPreview');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  if (input.files) {
    reader.readAsDataURL(input.files);
  }
};

// 5️⃣ KRYEJ CHECK-IN
const doCheckIn = async () => {
  const pnr = document.getElementById('pnrCode').value;
  const lastName = document.getElementById('pLName').value;
  const passportFile = document.getElementById('passportInput').files;

  // Validimi
  if (!pnr || !lastName || !passportFile) {
    alert('⚠️ Ju lutemi plotësoni PNR, mbiemrin dhe ngarkoni pashaportin!');
    return;
  }

  try {
    // Shfaq loading
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Po përpunohet Check-in...';

    // Krijo check-in përmes API
    const response = await fetch(`${API_URL}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pnr: pnr,
        passportNumber: lastName // Përdorimi i mbiemrit si identifikues
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Gabim në check-in');
    }

    // Përditëso Boarding Pass me të dhënat e check-in
    const boardingPass = result.boardingPass;
    document.getElementById('ticketUser').innerText = result.boardingPass.passenger.toUpperCase();
    document.getElementById('ticketPass').innerText = 'PHOTO VERIFIED ✓';
    document.getElementById('ticketDate').innerText = new Date().toISOString().split('T');

    // Shfaq gate dhe seat
    document.querySelectorAll('.barcode-strips').textContent = 
      `GATE: ${boardingPass.gate} | SEAT: ${boardingPass.seat}`;

    alert('✅ Check-in u kriju me sukses!\n\nGate: ' + boardingPass.gate + '\nSeat: ' + boardingPass.seat);

    navigate('confirmPage');
    btn.disabled = false;
    btn.textContent = 'KRYEJ CHECK-IN FINAL';

  } catch (error) {
    console.error('❌ Gabim:', error);
    alert('❌ Gabim në check-in: ' + error.message);
    event.target.disabled = false;
    event.target.textContent = 'KRYEJ CHECK-IN FINAL';
  }
};

// ========== FUNKSIONET E PRINTIMIT ==========

// 6️⃣ PRINTO BILETËN
const printTicket = () => {
  window.print();
};

// ========== FUNKSIONET E NAVIGIMIT ==========

// Buton për të shkuar në Check-in
const goToCheckIn = () => {
  navigate('checkinPage');
};

// Buton për të rifilluar
const restartApp = () => {
  location.reload();
};