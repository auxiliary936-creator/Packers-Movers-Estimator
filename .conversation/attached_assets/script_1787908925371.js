const houseTypeEl = document.getElementById('houseType');
const distanceEl = document.getElementById('distance');
const nameEl = document.getElementById('name');
const phoneEl = document.getElementById('phone');

const distanceErrorEl = document.getElementById('distanceError');
const nameErrorEl = document.getElementById('nameError');
const phoneErrorEl = document.getElementById('phoneError');

const resultEl = document.getElementById('result');
const totalPriceEl = document.getElementById('totalPrice');
const breakdownEl = document.getElementById('breakdown');
const bookingConfirmedEl = document.getElementById('bookingConfirmed');

const PER_KM_RATE = 30;
const PHONE_PATTERN = /^[6-9]\d{9}$/; // valid Indian 10-digit mobile pattern

function toggleError(errorEl, show) {
  errorEl.classList.toggle('visible', show);
}

function validateInputs() {
  const distance = parseFloat(distanceEl.value);
  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();

  const distanceValid = !isNaN(distance) && distance > 0;
  const nameValid = name.length > 0;
  const phoneValid = PHONE_PATTERN.test(phone);

  toggleError(distanceErrorEl, !distanceValid);
  toggleError(nameErrorEl, !nameValid);
  toggleError(phoneErrorEl, !phoneValid);

  return { distance, name, phone, valid: distanceValid && nameValid && phoneValid };
}

function calculateCost() {
  const { distance, valid } = validateInputs();
  if (!valid) {
    resultEl.classList.add('hidden');
    return;
  }

  const houseBase = parseFloat(houseTypeEl.value);
  const distanceCost = distance * PER_KM_RATE;
  const total = houseBase + distanceCost;

  totalPriceEl.textContent = '₹' + total.toLocaleString('en-IN');
  breakdownEl.textContent =
    `Base ₹${houseBase.toLocaleString('en-IN')} + ${distance} km × ₹${PER_KM_RATE}/km (₹${distanceCost.toLocaleString('en-IN')})`;

  resultEl.classList.remove('hidden');
  bookingConfirmedEl.classList.add('hidden');
}

function confirmBooking() {
  const name = nameEl.value.trim();
  bookingConfirmedEl.textContent =
    `Thank you, ${name}! Your booking request has been received. Our team will contact you shortly.`;
  bookingConfirmedEl.classList.remove('hidden');
}

document.getElementById('calcBtn').addEventListener('click', calculateCost);
document.getElementById('confirmBtn').addEventListener('click', confirmBooking);
