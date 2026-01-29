// Sample appointment data
const appointments = [
  {
    id: 1,
    patientName: "Rahul Sharma",
    date: "2024-10-15",
    time: "09:00 AM",
    contact: "+91 9876543210",
    sessionType: "Online",
    status: "Confirmed",
  },
  {
    id: 2,
    patientName: "Priya Patel",
    date: "2024-10-15",
    time: "11:00 AM",
    contact: "+91 8765432109",
    sessionType: "In-person",
    status: "Confirmed",
  },
  {
    id: 3,
    patientName: "Amit Kumar",
    date: "2024-10-15",
    time: "02:00 PM",
    contact: "+91 7654321098",
    sessionType: "Online",
    status: "Confirmed",
  },
  {
    id: 4,
    patientName: "Sneha Reddy",
    date: "2024-10-18",
    time: "10:00 AM",
    contact: "+91 9123456789",
    sessionType: "In-person",
    status: "Confirmed",
  },
  {
    id: 5,
    patientName: "Vikram Singh",
    date: "2024-10-18",
    time: "03:00 PM",
    contact: "+91 8012345678",
    sessionType: "Online",
    status: "Confirmed",
  },
  {
    id: 6,
    patientName: "Anjali Desai",
    date: "2024-10-20",
    time: "09:00 AM",
    contact: "+91 9234567890",
    sessionType: "In-person",
    status: "Confirmed",
  },
  {
    id: 7,
    patientName: "Rohan Mehta",
    date: "2024-10-22",
    time: "11:00 AM",
    contact: "+91 8345678901",
    sessionType: "Online",
    status: "Confirmed",
  },
  {
    id: 8,
    patientName: "Kavya Iyer",
    date: "2024-10-22",
    time: "04:00 PM",
    contact: "+91 7456789012",
    sessionType: "In-person",
    status: "Confirmed",
  },
];

let currentDate = new Date();
let selectedDate = null;

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners();
  renderCalendar();
  updateStats();
});

// Setup event listeners
function setupEventListeners() {
  // Mobile menu
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Calendar navigation
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

// Render calendar
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Update month display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  document.getElementById(
    "currentMonth"
  ).textContent = `${monthNames[month]} ${year}`;

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarGrid = document.getElementById("calendarGrid");
  calendarGrid.innerHTML = "";

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "h-16";
    calendarGrid.appendChild(emptyCell);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const hasAppointments = appointments.some((apt) => apt.date === dateStr);
    const isToday =
      new Date().toDateString() === new Date(dateStr).toDateString();

    const dayCell = document.createElement("div");
    dayCell.className = `calendar-day h-16 flex items-center justify-center rounded-lg cursor-pointer font-semibold ${
      hasAppointments ? "has-appointments" : ""
    } ${isToday ? "border-2 border-primary-blue" : "border border-gray-200"}`;
    dayCell.textContent = day;
    dayCell.dataset.date = dateStr;

    dayCell.addEventListener("click", () => selectDate(dateStr));

    calendarGrid.appendChild(dayCell);
  }
}

// Select date and show appointments
function selectDate(dateStr) {
  selectedDate = dateStr;

  // Update selected styling
  document.querySelectorAll(".calendar-day").forEach((cell) => {
    cell.classList.remove("selected");
  });
  document
    .querySelector(`[data-date="${dateStr}"]`)
    ?.classList.add("selected");

  // Format date for display
  const date = new Date(dateStr + "T00:00:00");
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);

  document.getElementById(
    "selectedDateDisplay"
  ).textContent = `Appointments for ${formattedDate}`;

  // Filter and display appointments
  const dayAppointments = appointments.filter((apt) => apt.date === dateStr);
  renderAppointments(dayAppointments);
}

// Render appointments list
function renderAppointments(appointmentsList) {
  const container = document.getElementById("appointmentsList");

  if (appointmentsList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-calendar-times text-4xl text-gray-300 mb-2"></i>
        <p class="text-gray-500">No appointments for this day</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appointmentsList
    .map(
      (apt) => `
    <div class="bg-gradient-to-r from-wellmind-blue to-wellmind-teal rounded-lg p-4 card-hover slide-in">
      <div class="flex items-start justify-between mb-3">
        <div>
          <h4 class="font-bold text-gray-800">${apt.patientName}</h4>
          <p class="text-sm text-gray-600">
            <i class="fas fa-clock text-primary-blue mr-1"></i>${apt.time}
          </p>
        </div>
        <span class="px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
          apt.status
        )}">
          ${apt.status}
        </span>
      </div>
      
      <div class="space-y-2 mb-3">
        <p class="text-sm text-gray-700">
          <i class="fas fa-phone text-primary-blue mr-2"></i>${apt.contact}
        </p>
        <p class="text-sm text-gray-700">
          <i class="fas ${
            apt.sessionType === "Online" ? "fa-video" : "fa-user"
          } text-primary-blue mr-2"></i>${apt.sessionType}
        </p>
      </div>
      
      ${
        apt.status === "Confirmed"
          ? `
      <div class="flex space-x-2">
        <button
          onclick="markCompleted(${apt.id})"
          class="flex-1 bg-primary-green text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
        >
          <i class="fas fa-check mr-1"></i>Complete
        </button>
        <button
          onclick="cancelAppointment(${apt.id})"
          class="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
        >
          <i class="fas fa-times mr-1"></i>Cancel
        </button>
      </div>
      `
          : ""
      }
    </div>
  `
    )
    .join("");
}

// Get status color
function getStatusColor(status) {
  switch (status) {
    case "Confirmed":
      return "bg-blue-100 text-primary-blue";
    case "Completed":
      return "bg-green-100 text-primary-green";
    case "Canceled":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// Mark appointment as completed
function markCompleted(appointmentId) {
  const appointment = appointments.find((apt) => apt.id === appointmentId);
  if (appointment) {
    appointment.status = "Completed";
    if (selectedDate) {
      const dayAppointments = appointments.filter(
        (apt) => apt.date === selectedDate
      );
      renderAppointments(dayAppointments);
    }
    updateStats();
    showNotification("Appointment marked as completed!", "success");
  }
}

// Cancel appointment
function cancelAppointment(appointmentId) {
  if (
    confirm("Are you sure you want to cancel this appointment?")
  ) {
    const appointment = appointments.find((apt) => apt.id === appointmentId);
    if (appointment) {
      appointment.status = "Canceled";
      if (selectedDate) {
        const dayAppointments = appointments.filter(
          (apt) => apt.date === selectedDate
        );
        renderAppointments(dayAppointments);
      }
      updateStats();
      showNotification("Appointment canceled", "error");
    }
  }
}

// Update statistics
function updateStats() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date + "T00:00:00");
    return aptDate >= weekStart && aptDate <= weekEnd;
  });

  const totalBookings = weekAppointments.length;
  const completedSessions = appointments.filter(
    (apt) => apt.status === "Completed"
  ).length;
  const pendingSessions = appointments.filter(
    (apt) => apt.status === "Confirmed"
  ).length;

  document.getElementById("totalBookings").textContent = totalBookings;
  document.getElementById("completedSessions").textContent = completedSessions;
  document.getElementById("pendingSessions").textContent = pendingSessions;
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `fixed top-24 right-4 bg-white rounded-lg shadow-2xl p-4 z-50 border-l-4 ${
    type === "success" ? "border-primary-green" : "border-red-500"
  } fade-in`;
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 ${
        type === "success" ? "bg-primary-green" : "bg-red-500"
      } rounded-full flex items-center justify-center">
        <i class="fas ${
          type === "success" ? "fa-check" : "fa-times"
        } text-white"></i>
      </div>
      <p class="text-gray-800 font-semibold">${message}</p>
    </div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Make functions available globally
window.markCompleted = markCompleted;
window.cancelAppointment = cancelAppointment;
