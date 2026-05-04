const form = document.getElementById('ticketForm');
const ticketsBody = document.getElementById('ticketsBody');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEdit');

const pendingCount = document.getElementById('pendingCount');
const totalCount = document.getElementById('totalCount');
const finishedCount = document.getElementById('finishedCount');
const fixedTime = document.getElementById('fixedTime');

let tickets = [];

function daysBetween(startDate, endDate) {
  const oneDay = 1000 * 60 * 60 * 24;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(0, Math.round((end - start) / oneDay));
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function updateDashboard() {
  const total = tickets.length;
  const finished = tickets.filter((ticket) => ticket.status === 'Done').length;
  const pending = total - finished;
  const durations = tickets.map((ticket) => daysBetween(ticket.dateMention, ticket.timelineToFinish));
  const avg = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  pendingCount.textContent = pending;
  totalCount.textContent = total;
  finishedCount.textContent = finished;
  fixedTime.textContent = `${avg.toFixed(1)} days`;
}

function clearForm() {
  form.reset();
  document.getElementById('ticketId').value = '';
  formTitle.textContent = 'Create Ticket';
  cancelEditBtn.classList.add('hidden');
}

function renderTickets() {
  ticketsBody.innerHTML = '';

  tickets.forEach((ticket) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ticket.taskDescription}</td>
      <td>${ticket.brand}</td>
      <td>${ticket.market}</td>
      <td>${ticket.requestor}</td>
      <td>${ticket.assigned}</td>
      <td>${formatDate(ticket.dateMention)}</td>
      <td>${formatDate(ticket.timelineToFinish)}</td>
      <td>${ticket.status}</td>
      <td>${ticket.commentsNotes || ''}</td>
      <td>${ticket.latestUpdate || ''}</td>
      <td>
        <button data-action="edit" data-id="${ticket.id}">Edit</button>
        <button data-action="delete" data-id="${ticket.id}" class="secondary">Delete</button>
      </td>
    `;
    ticketsBody.appendChild(row);
  });

  updateDashboard();
}

function createTicketFromForm() {
  return {
    id: document.getElementById('ticketId').value || crypto.randomUUID(),
    taskDescription: document.getElementById('taskDescription').value.trim(),
    brand: document.getElementById('brand').value.trim(),
    market: document.getElementById('market').value.trim(),
    requestor: document.getElementById('requestor').value.trim(),
    assigned: document.getElementById('assigned').value.trim(),
    dateMention: document.getElementById('dateMention').value,
    timelineToFinish: document.getElementById('timelineToFinish').value,
    status: document.getElementById('status').value,
    commentsNotes: document.getElementById('commentsNotes').value.trim(),
    latestUpdate: document.getElementById('latestUpdate').value.trim()
  };
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const ticket = createTicketFromForm();
  const index = tickets.findIndex((item) => item.id === ticket.id);

  if (index >= 0) {
    tickets[index] = ticket;
  } else {
    tickets.push(ticket);
  }

  renderTickets();
  clearForm();
});

ticketsBody.addEventListener('click', (event) => {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  if (target.dataset.action === 'delete') {
    tickets = tickets.filter((ticket) => ticket.id !== id);
    renderTickets();
    return;
  }

  if (target.dataset.action === 'edit') {
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) return;

    document.getElementById('ticketId').value = ticket.id;
    document.getElementById('taskDescription').value = ticket.taskDescription;
    document.getElementById('brand').value = ticket.brand;
    document.getElementById('market').value = ticket.market;
    document.getElementById('requestor').value = ticket.requestor;
    document.getElementById('assigned').value = ticket.assigned;
    document.getElementById('dateMention').value = ticket.dateMention;
    document.getElementById('timelineToFinish').value = ticket.timelineToFinish;
    document.getElementById('status').value = ticket.status;
    document.getElementById('commentsNotes').value = ticket.commentsNotes;
    document.getElementById('latestUpdate').value = ticket.latestUpdate;

    formTitle.textContent = 'Update Ticket';
    cancelEditBtn.classList.remove('hidden');
  }
});

cancelEditBtn.addEventListener('click', clearForm);

const seedTickets = [
  {
    id: crypto.randomUUID(),
    taskDescription: 'Migrate Krap Catcher Review from NZ to SG',
    brand: 'Kooky Kibble',
    market: 'SG',
    requestor: 'Ika',
    assigned: 'Ryan',
    dateMention: '2026-04-23',
    timelineToFinish: '2026-04-24',
    status: 'Done',
    commentsNotes: '',
    latestUpdate: 'Ready to share the URL'
  }
];

tickets = seedTickets;
renderTickets();
