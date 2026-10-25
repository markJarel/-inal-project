
const STORAGE_KEY = "classTrackAttendance";

const today = new Date();
const dateKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

const demoStudents = [
  { id: "2026-001", name: "Alex Santos", section: "BSIT-1 SOUTH-2" },
  { id: "2026-002", name: "Jamie Reyes", section: "BSIT-1 SOUTH-2" },
  { id: "2026-003", name: "Taylor Cruz", section: "BSIT-1 SOUTH-2" },
  { id: "2026-004", name: "Morgan Garcia", section: "BSIT-1 SOUTH-2" },
  { id: "2026-005", name: "Casey Mendoza", section: "BSIT-1 SOUTH-2" }
];

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.students)) {
      return {
        students: saved.students,
        attendance: saved.attendance || {},
        history: saved.history || {}
      };
    }
  } catch (error) {
    console.warn("Could not load saved data.", error);
  }

  return { students: demoStudents, attendance: {}, history: {} };
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function todayRecords() {
  if (!data.attendance[dateKey]) {
    data.attendance[dateKey] = {};
  }
  return data.attendance[dateKey];
}

function getStatus(studentId) {
  return todayRecords()[studentId] || "Unmarked";
}

function getCounts(date) {
  const records = data.attendance[date] || {};
  const counts = {
    Present: 0,
    Absent: 0,
    Late: 0,
    Unmarked: 0
  };

  data.students.forEach(student => {
    const status = records[student.id] || "Unmarked";
    counts[status]++;
  });

  return counts;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function renderStats() {
  const counts = getCounts(dateKey);

  document.getElementById("totalStudents").textContent =
    data.students.length;
  document.getElementById("presentCount").textContent =
    counts.Present;
  document.getElementById("absentCount").textContent =
    counts.Absent;
  document.getElementById("lateCount").textContent =
    counts.Late;
}

function renderAttendance() {
  const query = document.getElementById("attendanceSearch")
    .value.toLowerCase();
  const filter = document.getElementById("statusFilter").value;

  const students = data.students.filter(student => {
    const text = `${student.name} ${student.id} ${student.section}`
      .toLowerCase();

    return text.includes(query) &&
      (filter === "All" || getStatus(student.id) === filter);
  });

  const table = document.getElementById("attendanceTable");

  if (!students.length) {
    table.innerHTML =
      '<tr><td colspan="5" class="empty">No students found.</td></tr>';
    return;
  }

  table.innerHTML = students.map(student => {
    const status = getStatus(student.id);

    return `
      <tr>
        <td><span class="student-name">${escapeHTML(student.name)}</span></td>
        <td>${escapeHTML(student.id)}</td>
        <td>${escapeHTML(student.section)}</td>
        <td><span class="status ${status}">${status}</span></td>
        <td>
          <select class="field status-select"
            data-status-id="${escapeHTML(student.id)}">
            ${["Unmarked", "Present", "Absent", "Late"].map(option =>
              `<option ${option === status ? "selected" : ""}>${option}</option>`
            ).join("")}
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

function renderStudents() {
  const query = document.getElementById("studentSearch")
    .value.toLowerCase();

  const students = data.students.filter(student =>
    `${student.name} ${student.id} ${student.section}`
      .toLowerCase().includes(query)
  );

  const table = document.getElementById("studentTable");

  if (!students.length) {
    table.innerHTML =
      '<tr><td colspan="4" class="empty">No student records found.</td></tr>';
    return;
  }

  table.innerHTML = students.map(student => `
    <tr>
      <td><span class="student-name">${escapeHTML(student.name)}</span></td>
      <td>${escapeHTML(student.id)}</td>
      <td>${escapeHTML(student.section)}</td>
      <td>
        <button class="delete-btn"
          data-delete-id="${escapeHTML(student.id)}"
          aria-label="Delete student">×</button>
      </td>
    </tr>
  `).join("");
}

function renderHistory() {
  const history = Object.values(data.history)
    .sort((a, b) => b.date.localeCompare(a.date));

  document.getElementById("historyDates").textContent = history.length;
  document.getElementById("historyPresent").textContent =
    history.length ? history[0].present : 0;
  document.getElementById("historyAbsent").textContent =
    history.length ? history[0].absent : 0;

  const table = document.getElementById("historyTable");

  if (!history.length) {
    table.innerHTML =
      '<tr><td colspan="6" class="empty">No saved attendance yet.</td></tr>';
    return;
  }

  table.innerHTML = history.map(record => `
    <tr>
      <td>${escapeHTML(record.date)}</td>
      <td>${record.total}</td>
      <td>${record.present}</td>
      <td>${record.absent}</td>
      <td>${record.late}</td>
      <td>${record.unmarked}</td>
    </tr>
  `).join("");
}

function renderAll() {
  renderStats();
  renderAttendance();
  renderStudents();
  renderHistory();
}

function switchPage(page) {
  const titles = {
    dashboard: ["Good day, Teacher!", "Here is your class attendance overview."],
    students: ["Student Records", "Manage your registered students."],
    history: ["Attendance History", "Review your saved attendance records."]
  };

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== page);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  document.getElementById("pageTitle").textContent = titles[page][0];
  document.getElementById("pageSubtitle").textContent = titles[page][1];
}

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => switchPage(button.dataset.page));
});

document.getElementById("todayDate").textContent =
  today.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

document.getElementById("attendanceSearch")
  .addEventListener("input", renderAttendance);

document.getElementById("statusFilter")
  .addEventListener("change", renderAttendance);

document.getElementById("studentSearch")
  .addEventListener("input", renderStudents);

document.getElementById("attendanceTable").addEventListener("change", event => {
  const select = event.target.closest("[data-status-id]");
  if (!select) return;

  const id = select.dataset.statusId;

  if (select.value === "Unmarked") {
    delete todayRecords()[id];
  } else {
    todayRecords()[id] = select.value;
  }

  saveData();
  renderAll();
});

document.getElementById("saveAttendance").addEventListener("click", () => {
  const counts = getCounts(dateKey);

  data.history[dateKey] = {
    date: dateKey,
    total: data.students.length,
    present: counts.Present,
    absent: counts.Absent,
    late: counts.Late,
    unmarked: counts.Unmarked
  };

  saveData();
  renderAll();
  showToast("Attendance saved successfully!");
});

const dialog = document.getElementById("studentDialog");

document.getElementById("addStudentBtn").addEventListener("click", () => {
  dialog.showModal();
});

document.getElementById("cancelAdd").addEventListener("click", () => {
  dialog.close();
});

document.getElementById("studentForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("newName").value.trim();
  const id = document.getElementById("newId").value.trim();
  const section = document.getElementById("newSection").value.trim();

  if (data.students.some(student =>
    student.id.toLowerCase() === id.toLowerCase()
  )) {
    alert("That Student ID already exists. Please use a unique ID.");
    return;
  }

  data.students.push({ name, id, section });
  saveData();
  renderAll();
  dialog.close();
  event.target.reset();
  showToast("Student added successfully!");
});

document.getElementById("studentTable").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  const id = button.dataset.deleteId;
  const student = data.students.find(item => item.id === id);

  if (!student || !confirm(`Delete ${student.name} from the student list?`)) {
    return;
  }

  data.students = data.students.filter(item => item.id !== id);

  Object.values(data.attendance).forEach(records => {
    delete records[id];
  });

  saveData();
  renderAll();
  showToast("Student deleted.");
});

document.getElementById("exportHistory").addEventListener("click", () => {
  const history = Object.values(data.history)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!history.length) {
    showToast("Save attendance before exporting.");
    return;
  }

  const rows = [
    ["Date", "Total", "Present", "Absent", "Late", "Unmarked"],
    ...history.map(record => [
      record.date, record.total, record.present,
      record.absent, record.late, record.unmarked
    ])
  ];

  const csv = rows.map(row =>
    row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
  ).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "attendance-history.csv";
  link.click();

  URL.revokeObjectURL(url);
});

renderAll();
