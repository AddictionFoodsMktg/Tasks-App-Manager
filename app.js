const form = document.getElementById('ticketForm');
const ticketsBody = document.getElementById('ticketsBody');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEdit');
const ticketModal = document.getElementById('ticketModal');

const pendingCount = document.getElementById('pendingCount');
const totalCount = document.getElementById('totalCount');
const finishedCount = document.getElementById('finishedCount');
const fixedTime = document.getElementById('fixedTime');
const delayedCount = document.getElementById('delayedCount');

let tickets = [];
const today = () => new Date(new Date().toDateString());

function daysBetween(startDate, endDate) { return Math.round((new Date(endDate) - new Date(startDate)) / 86400000); }
function formatDate(dateValue) { return dateValue ? new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }

function getPriority(ticket) {
  if (ticket.status === 'Done') return { label: 'Completed', level: 'low' };
  if (ticket.status === 'On-hold') return { label: 'On-hold', level: 'medium' };
  if (ticket.status === 'Not Started') return { label: 'Not Started', level: 'high' };
  const diff = daysBetween(today(), new Date(ticket.timelineToFinish));
  if (diff < 0) return { label: `Critical (${Math.abs(diff)}d delay)`, level: 'critical' };
  if (diff <= 1) return { label: 'High (Due soon)', level: 'high' };
  if (diff <= 3) return { label: 'Medium', level: 'medium' };
  return { label: 'Low', level: 'low' };
}

function updateDashboard() {
  const total = tickets.length;
  const finished = tickets.filter((t) => t.status === 'Done').length;
  const pending = tickets.filter((t) => t.status !== 'Done').length;
  const delayed = tickets.filter((t) => t.status !== 'Done' && daysBetween(today(), t.timelineToFinish) < 0).length;
  const durations = tickets.map((t) => Math.max(0, daysBetween(t.dateMention, t.timelineToFinish)));
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  pendingCount.textContent = pending;
  totalCount.textContent = total;
  finishedCount.textContent = finished;
  fixedTime.textContent = `${avg.toFixed(1)} days`;
  delayedCount.textContent = delayed;
}

function drawBars(canvasId, labels, values, colors) {
  const c = document.getElementById(canvasId);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const max = Math.max(1, ...values);
  const barW = (c.width - 60) / values.length;
  values.forEach((v, i) => {
    const h = (v / max) * (c.height - 70);
    const x = 30 + i * barW + 8;
    const y = c.height - h - 30;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, y, barW - 16, h);
    ctx.fillStyle = '#3b2a53';
    ctx.font = '12px Poppins';
    ctx.fillText(labels[i], x, c.height - 10);
    ctx.fillText(String(v), x + 4, y - 6);
  });
}

function updateCharts() {
  const statusOrder = ['Not Started', 'Pending', 'On-hold', 'Done'];
  const statusValues = statusOrder.map((s) => tickets.filter((t) => t.status === s).length);
  drawBars('statusChart', statusOrder, statusValues, ['#a78bfa', '#60a5fa', '#f59e0b', '#34d399']);

  const levels = ['critical', 'high', 'medium', 'low'];
  const priorityValues = levels.map((lvl) => tickets.filter((t) => getPriority(t).level === lvl).length);
  drawBars('priorityChart', ['Critical', 'High', 'Medium', 'Low'], priorityValues, ['#ef4444', '#f97316', '#eab308', '#22c55e']);
}

function clearForm() {
  form.reset();
  document.getElementById('ticketId').value = '';
  formTitle.textContent = 'Create Ticket';
  cancelEditBtn.classList.add('hidden');
}

function renderTickets() {
  ticketsBody.innerHTML = '';
  tickets.slice().sort((a, b) => new Date(a.timelineToFinish) - new Date(b.timelineToFinish)).forEach((ticket) => {
    const p = getPriority(ticket);
    const row = document.createElement('tr');
    row.innerHTML = `<td>${ticket.taskDescription}</td><td>${ticket.brand}</td><td>${ticket.market}</td><td>${ticket.requestor}</td><td>${ticket.assigned}</td><td>${formatDate(ticket.dateMention)}</td><td>${formatDate(ticket.timelineToFinish)}</td><td>${ticket.status}</td><td><span class="priority ${p.level}">${p.label}</span></td><td>${ticket.commentsNotes || ''}</td><td>${ticket.latestUpdate || ''}</td><td><button data-action="edit" data-id="${ticket.id}">Edit</button> <button data-action="delete" data-id="${ticket.id}" class="secondary">Delete</button></td>`;
    ticketsBody.appendChild(row);
  });
  updateDashboard();
  updateCharts();
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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ticket = createTicketFromForm();
  const i = tickets.findIndex((t) => t.id === ticket.id);
  if (i >= 0) tickets[i] = ticket; else tickets.push(ticket);
  renderTickets();
  clearForm();
  ticketModal.close();
});

document.getElementById('openCreateModal').addEventListener('click', () => { clearForm(); ticketModal.showModal(); });
document.getElementById('closeModal').addEventListener('click', () => ticketModal.close());
cancelEditBtn.addEventListener('click', clearForm);

ticketsBody.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  if (e.target.dataset.action === 'delete') { tickets = tickets.filter((t) => t.id !== id); renderTickets(); return; }
  if (e.target.dataset.action === 'edit') {
    const t = tickets.find((x) => x.id === id); if (!t) return;
    document.getElementById('ticketId').value = t.id;
    document.getElementById('taskDescription').value = t.taskDescription;
    document.getElementById('brand').value = t.brand;
    document.getElementById('market').value = t.market;
    document.getElementById('requestor').value = t.requestor;
    document.getElementById('assigned').value = t.assigned;
    document.getElementById('dateMention').value = t.dateMention;
    document.getElementById('timelineToFinish').value = t.timelineToFinish;
    document.getElementById('status').value = t.status;
    document.getElementById('commentsNotes').value = t.commentsNotes;
    document.getElementById('latestUpdate').value = t.latestUpdate;
    formTitle.textContent = 'Update Ticket';
    cancelEditBtn.classList.remove('hidden');
    ticketModal.showModal();
  }
});

tickets = [{ id: crypto.randomUUID(), taskDescription: 'Migrate Krap Catcher Review from NZ to SG', brand: 'Addiction', market: 'SG', requestor: 'Ika', assigned: 'Ryan', dateMention: '2026-04-23', timelineToFinish: '2026-04-24', status: 'Not Started', commentsNotes: 'Need legal review before publishing.', latestUpdate: 'Delayed waiting on feedback.' }];
renderTickets();
window.addEventListener('resize', updateCharts);
