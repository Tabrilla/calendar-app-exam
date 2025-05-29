document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("monthYear");
  const currentDayNameEl = document.getElementById("currentDayName");
  const currentDateEl = document.getElementById("currentDate");
  const upcomingEventsEl = document.getElementById("upcomingEvents");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const modal = document.getElementById("eventModal");
  const modalTitleEl = document.getElementById("modalTitle");
  const eventTitleEl = document.getElementById("eventTitle");
  const eventDateEl = document.getElementById("eventDate");
  const eventTimeEl = document.getElementById("eventTime");
  const eventDescEl = document.getElementById("eventDescription");
  const saveEventBtn = document.getElementById("saveEvent");
  const deleteEventBtn = document.getElementById("deleteEvent");
  const closeModalBtn = modal.querySelector(".close");
  const seeMoreModal = document.getElementById("seeMoreModal");
  const closeSeeMoreModalBtn = document.getElementById("closeSeeMoreModal");

  // Close see more modal on clicking close
  closeSeeMoreModalBtn.addEventListener("click", () => {
    seeMoreModal.classList.remove("active");
  });

  // Close modal on clicking outside modal content
  seeMoreModal.addEventListener("click", (e) => {
    if (e.target === seeMoreModal) {
      seeMoreModal.classList.remove("active");
    }
  });

  function createDayElement(date, isOtherMonth, isToday = false) {
    const dayEl = document.createElement("div");
    dayEl.className = "day";
    if (isOtherMonth) dayEl.classList.add("other-month");
    if (isToday) dayEl.classList.add("today");

    const dateStr = formatDate(date);
    dayEl.dataset.date = dateStr;

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = date.getDate();
    dayEl.appendChild(dayNumber);

    const dayEvents = getEventsForDate(dateStr);
    if (dayEvents.length > 0) {
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "events-container";

      // Show only first event
      const firstEvent = dayEvents[0];
      const firstEventEl = document.createElement("div");
      firstEventEl.className = "event-item";
      firstEventEl.textContent = firstEvent.title;
      eventsContainer.appendChild(firstEventEl);

      if (dayEvents.length > 1) {
        const moreEventsEl = document.createElement("div");
        moreEventsEl.className = "event-item see-more";
        moreEventsEl.style.cursor = "pointer";
        moreEventsEl.textContent = `+${dayEvents.length - 1} see more events`;

        moreEventsEl.addEventListener("click", () => {
          openSeeMoreModal(dateStr);
        });

        eventsContainer.appendChild(moreEventsEl);
      }

      dayEl.appendChild(eventsContainer);
    }

    calendarEl.appendChild(dayEl);
  }

  // Function to open See More modal and list events for that day
  function openSeeMoreModal(dateStr) {
    const seeMoreModal = document.getElementById("seeMoreModal");
    const closeSeeMoreModalBtn = document.getElementById("closeSeeMoreModal");
    const seeMoreDateEl = document.getElementById("seeMoreDate");
    const eventsListContainer = document.getElementById("eventsListContainer");

    seeMoreDateEl.textContent = formatDisplayDate(dateStr);
    eventsListContainer.innerHTML = "";

    const dayEvents = getEventsForDate(dateStr);

    dayEvents.forEach((event, idx) => {
      const eventRow = document.createElement("div");
      eventRow.className = "event-item-row";

      const titleDiv = document.createElement("div");
      titleDiv.className = "event-title";
      titleDiv.textContent = event.title;
      eventRow.appendChild(titleDiv);

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        seeMoreModal.classList.remove("active");
        openEventModal(dateStr, idx); // open existing edit modal for event
      });
      eventRow.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        if (confirm(`Delete event "${event.title}"?`)) {
          events[dateStr].splice(idx, 1);
          if (events[dateStr].length === 0) {
            delete events[dateStr];
          }
          localStorage.setItem("luxuryCalendarEvents", JSON.stringify(events));
          renderCalendar();
          renderUpcomingEvents();
          openSeeMoreModal(dateStr); // refresh modal list
          showToast("Event deleted successfully");
        }
      });
      eventRow.appendChild(deleteBtn);

      eventsListContainer.appendChild(eventRow);
    });

    // Show modal
    seeMoreModal.classList.add("active");

    // Close modal on clicking close button or outside modal content
    closeSeeMoreModalBtn.onclick = () => seeMoreModal.classList.remove("active");
    seeMoreModal.onclick = (e) => {
      if (e.target === seeMoreModal) {
        seeMoreModal.classList.remove("active");
      }
    };
  }

  // State
  let currentDate = new Date();
  let selectedDate = null;
  let selectedEvent = null;
  let events = JSON.parse(localStorage.getItem("luxuryCalendarEvents")) || {};

  // Initialize
  renderCalendar();
  updateCurrentDateDisplay();
  renderUpcomingEvents();

  // Event Listeners
  prevMonthBtn.addEventListener("click", goToPreviousMonth);
  nextMonthBtn.addEventListener("click", goToNextMonth);
  saveEventBtn.addEventListener("click", saveEvent);
  deleteEventBtn.addEventListener("click", deleteEvent);
  closeModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  // Functions
  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    monthYearEl.textContent = firstDay.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    calendarEl.innerHTML = "";

    // Calculate days from previous month to show
    const startDay = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      createDayElement(date, true);
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      createDayElement(date, false, date.toDateString() === today.toDateString());
    }

    // Calculate days from next month to show
    const daysShown = startDay + lastDay.getDate();
    const weeksShown = Math.ceil(daysShown / 7);
    const nextMonthDays = weeksShown * 7 - daysShown;
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);
      createDayElement(date, true);
    }

    // Add event listeners to all event items
    document.querySelectorAll(".event-item").forEach((item) => {
      item.addEventListener("click", function () {
        const date = this.parentElement.dataset.date;
        const eventIndex = Array.from(this.parentElement.children).indexOf(this);
        openEventModal(date, eventIndex);
      });
    });

    // Add click listener to empty day spaces
    document.querySelectorAll(".day:not(.other-month)").forEach((day) => {
      day.addEventListener("click", function (e) {
        if (e.target === this) {
          openEventModal(this.dataset.date);
        }
      });
    });
  }

  function getEventsForDate(dateStr) {
    return events[dateStr] || [];
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateStr) {
    const [year, month, day] = dateStr.split("-");
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function goToPreviousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  }

  function goToNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  }

  function updateCurrentDateDisplay() {
    const now = new Date();
    currentDayNameEl.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
    currentDateEl.textContent = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function renderUpcomingEvents() {
    upcomingEventsEl.innerHTML = "";

    // Get events for next 7 days
    const today = new Date();
    const upcoming = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = formatDate(date);

      if (events[dateStr]) {
        events[dateStr].forEach((event) => {
          upcoming.push({
            date: dateStr,
            ...event,
          });
        });
      }
    }

    // Sort by date and time
    upcoming.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
      const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
      return dateA - dateB;
    });

    // Display (max 5)
    upcoming.slice(0, 5).forEach((event) => {
      const eventEl = document.createElement("div");
      eventEl.className = "event-card";
      eventEl.innerHTML = `
        <div class="event-time">${formatDisplayDate(event.date)}${
        event.time ? " at " + event.time : ""
      }</div>
        <div class="event-title">${event.title}</div>
      `;
      eventEl.addEventListener("click", () => {
        openEventModal(
          event.date,
          events[event.date].findIndex((e) => e.title === event.title)
        );
      });
      upcomingEventsEl.appendChild(eventEl);
    });

    if (upcoming.length === 0) {
      upcomingEventsEl.innerHTML = '<div class="no-events">No upcoming events</div>';
    }
  }

  function openEventModal(date, eventIndex = null) {
    selectedDate = date;
    selectedEvent = eventIndex !== null ? events[date][eventIndex] : null;

    if (selectedEvent) {
      modalTitleEl.textContent = "Edit Event";
      eventTitleEl.value = selectedEvent.title;
      eventDateEl.value = date;
      eventTimeEl.value = selectedEvent.time || "";
      eventDescEl.value = selectedEvent.description || "";
      deleteEventBtn.style.display = "block";
    } else {
      modalTitleEl.textContent = "New Event";
      eventTitleEl.value = "";
      eventDateEl.value = date;
      eventTimeEl.value = "12:00";
      eventDescEl.value = "";
      deleteEventBtn.style.display = "none";
    }

    modal.classList.add("active");
    eventTitleEl.focus();
  }

  function closeModal() {
    modal.classList.remove("active");
    selectedDate = null;
    selectedEvent = null;
  }

  // Add this function to show notifications
  function showToast(message, type = "success") {
    const toast = document.getElementById("notificationToast");
    const toastMessage = toast.querySelector(".toast-message");
    const toastIcon = toast.querySelector(".toast-icon");

    toast.className = `toast ${type}`;
    toastMessage.textContent = message;

    // Set icon based on type
    toastIcon.textContent = type === "success" ? "✓" : "⚠️";

    // Show toast
    toast.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // Update your saveEvent function
  function saveEvent() {
    const title = eventTitleEl.value.trim();
    if (!title) {
      showToast("Please enter an event title", "error");
      return;
    }

    const date = eventDateEl.value;
    const time = eventTimeEl.value;
    const description = eventDescEl.value.trim();

    const eventData = { title, time, description };

    if (!events[date]) events[date] = [];

    if (selectedEvent) {
      // Update existing event
      const index = events[date].findIndex((e) => e.title === selectedEvent.title);
      if (index !== -1) {
        events[date][index] = eventData;
        showToast("Event updated successfully");
      }
    } else {
      // Add new event
      events[date].push(eventData);
      showToast("Event added successfully");
    }

    localStorage.setItem("luxuryCalendarEvents", JSON.stringify(events));
    renderCalendar();
    renderUpcomingEvents();
    closeModal();
  }

  // Update your deleteEvent function
  function deleteEvent() {
    if (!selectedEvent || !confirm("Are you sure you want to delete this event?")) return;

    const index = events[selectedDate].findIndex((e) => e.title === selectedEvent.title);
    if (index !== -1) {
      events[selectedDate].splice(index, 1);
      if (events[selectedDate].length === 0) {
        delete events[selectedDate];
      }
      showToast("Event deleted successfully");
    }

    localStorage.setItem("luxuryCalendarEvents", JSON.stringify(events));
    renderCalendar();
    renderUpcomingEvents();
    closeModal();
  }
});
