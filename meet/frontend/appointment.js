// Sample doctor data
const doctors = [
  {
    id: 1,
    name: "Dr. Arjun Mehta",
    image: "https://i.pinimg.com/736x/4c/1c/9e/4c1c9edd3857a345d9c4868d7f1ce83d.jpg",
    specialization: "Clinical Psychologist",
    type: "Clinical",
    experience: 8,
    phone: "+91 9123456789",
    available: true,
  },
  {
    id: 2,
    name: "Dr. Rohan Chatterjee",
    image: "https://i.pinimg.com/1200x/42/a5/4d/42a54d685541075f2c03702d0eb7fdf0.jpg",
    specialization: "Child Psychologist",
    type: "Child",
    experience: 6,
    phone: "+91 8796541230",
    available: true,
  },
  {
    id: 3,
    name: "Dr. Tanvi Kulkarni",
    image: "https://i.pinimg.com/736x/c5/a3/90/c5a3904b38eb241dd03dd30889599dc4.jpg",
    specialization: "Behavioral Therapist",
    type: "Behavioral",
    experience: 10,
    phone: "+91 9876543210",
    available: false,
  },
  {
    id: 4,
    name: "Dr. Saurabh Deshmukh",
    image: "https://i.pinimg.com/736x/21/2c/16/212c16040c53e3b799a3ef6dbf81dc31.jpg",
    specialization: "Counseling Psychologist",
    type: "Counseling",
    experience: 4,
    phone: "+91 9012765432",
    available: true,
  },
  {
    id: 5,
    name: "Dr. Kavita Menon",
    image: "https://i.pinimg.com/736x/ad/6c/b0/ad6cb07e44a5e63ffc89d7723b181052.jpg",
    specialization: "Neuropsychologist",
    type: "Neuropsychologist",
    experience: 12,
    phone: "+91 9890076543",
    available: true,
  },
  {
    id: 6,
    name: "Dr. Aditya Iyer",
    image: "https://i.pinimg.com/1200x/6d/68/82/6d68826d9b78bf9c4f354b7bb5088837.jpg",
    specialization: "Clinical Psychologist",
    type: "Clinical",
    experience: 7,
    phone: "+91 9182736450",
    available: true,
  },
];

let currentDoctor = null;
let selectedTime = null;

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  renderDoctors(doctors);
  setupEventListeners();
  setMinDate();
});

// Set minimum date to today
function setMinDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("appointmentDate").setAttribute("min", today);
  document.getElementById("appointmentDate").value = today;
}

// Render doctor cards
function renderDoctors(doctorList) {
  const grid = document.getElementById("doctorGrid");
  const noResults = document.getElementById("noResults");
  const resultCount = document.getElementById("resultCount");

  if (doctorList.length === 0) {
    grid.innerHTML = "";
    noResults.classList.remove("hidden");
    resultCount.textContent = "0";
    return;
  }

  noResults.classList.add("hidden");
  resultCount.textContent = doctorList.length;

  grid.innerHTML = doctorList
    .map(
      (doctor) => `
      <div class="bg-white rounded-xl shadow-lg overflow-hidden card-hover fade-in">
        <div class="relative">
          <img
            src="${doctor.image}"
            alt="${doctor.name}"
            class="w-full h-48 object-cover object-top"
          />
          ${
            doctor.available
              ? '<span class="badge absolute top-4 right-4 bg-primary-green text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"><i class="fas fa-check-circle mr-1"></i>Available Today</span>'
              : '<span class="badge absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg"><i class="fas fa-times-circle mr-1"></i>Fully Booked</span>'
          }
        </div>
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${doctor.name}</h3>
          <div class="flex flex-wrap gap-2 mb-3">
            <span class="bg-wellmind-blue text-primary-blue px-3 py-1 rounded-full text-xs font-semibold">
              ${doctor.specialization}
            </span>
          </div>
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-briefcase text-primary-blue w-5"></i>
              <span>${doctor.experience} years experience</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-phone text-primary-blue w-5"></i>
              <span>${doctor.phone}</span>
            </div>
          </div>
          <button
            onclick="openBookingModal(${doctor.id})"
            class="w-full bg-gradient-to-r from-primary-blue to-primary-purple text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
              !doctor.available ? "opacity-50 cursor-not-allowed" : ""
            }"
            ${!doctor.available ? "disabled" : ""}
          >
            <i class="fas fa-calendar-check mr-2"></i>Book Session
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

// Setup event listeners
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Search functionality
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const experienceFilter = document.getElementById("experienceFilter");

  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });

  // Modal controls
  const closeModal = document.getElementById("closeModal");
  const bookingModal = document.getElementById("bookingModal");
  const confirmBtn = document.getElementById("confirmAppointment");

  closeModal.addEventListener("click", () => {
    bookingModal.classList.remove("active");
    resetModal();
  });

  bookingModal.addEventListener("click", (e) => {
    if (e.target === bookingModal) {
      bookingModal.classList.remove("active");
      resetModal();
    }
  });

  confirmBtn.addEventListener("click", confirmAppointment);

  // Time slot selection
  const timeSlots = document.querySelectorAll(".time-slot");
  timeSlots.forEach((slot) => {
    slot.addEventListener("click", function () {
      timeSlots.forEach((s) => s.classList.remove("selected"));
      this.classList.add("selected");
      selectedTime = this.getAttribute("data-time");
    });
  });
}

// Perform search and filter
function performSearch() {
  const searchTerm = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const typeFilter = document.getElementById("typeFilter").value;
  const experienceFilter = document.getElementById("experienceFilter").value;

  let filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm) ||
      doctor.specialization.toLowerCase().includes(searchTerm);

    const matchesType = !typeFilter || doctor.type === typeFilter;

    let matchesExperience = true;
    if (experienceFilter === "0-2") {
      matchesExperience = doctor.experience >= 0 && doctor.experience <= 2;
    } else if (experienceFilter === "3-5") {
      matchesExperience = doctor.experience >= 3 && doctor.experience <= 5;
    } else if (experienceFilter === "5+") {
      matchesExperience = doctor.experience > 5;
    }

    return matchesSearch && matchesType && matchesExperience;
  });

  // Sort by name A-Z
  filteredDoctors.sort((a, b) => a.name.localeCompare(b.name));

  renderDoctors(filteredDoctors);
}

// Open booking modal
function openBookingModal(doctorId) {
  currentDoctor = doctors.find((d) => d.id === doctorId);
  if (!currentDoctor || !currentDoctor.available) return;

  const modal = document.getElementById("bookingModal");
  document.getElementById("modalDoctorImage").src = currentDoctor.image;
  document.getElementById("modalDoctorName").textContent = currentDoctor.name;
  document.getElementById("modalDoctorSpec").textContent =
    currentDoctor.specialization;

  modal.classList.add("active");
}

// Reset modal
function resetModal() {
  selectedTime = null;
  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });
  setMinDate();
}

// Confirm appointment
function confirmAppointment() {
  const date = document.getElementById("appointmentDate").value;

  if (!date) {
    alert("Please select a date");
    return;
  }

  if (!selectedTime) {
    alert("Please select a time slot");
    return;
  }

  // Format date for display
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Close modal
  document.getElementById("bookingModal").classList.remove("active");

  // Show success message
  const successMessage = document.getElementById("successMessage");
  const successDetails = document.getElementById("successDetails");
  successDetails.textContent = `Your appointment with ${currentDoctor.name} is confirmed for ${formattedDate} at ${selectedTime}`;

  successMessage.classList.remove("hidden");

  // Hide success message after 5 seconds
  setTimeout(() => {
    successMessage.classList.add("hidden");
  }, 5000);

  // Reset modal
  resetModal();
}

// Make openBookingModal available globally
window.openBookingModal = openBookingModal;