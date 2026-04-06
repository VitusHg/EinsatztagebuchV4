const STORAGE_KEY = 'einsatzTagebuchV4';
const timeFields = ['Alarmierung', 'Anfahrt', 'Am Einsatzort', 'Transport', 'Am Transportziel', 'Einsatz beendet'];
const AUTO_LIGHTS_RE = /^(A\d|B1\b|B2\b|C1\b)/;

const defaults = {
  services: [],
  alarmCodes: window.ALARM_CODES || [],
  pzcCodes: window.PZC_CODES || []
};

let state = loadState();
let selectedServiceId = null;
let editingIncidentId = null;
let incidentLights = false;

const byId = (id) => document.getElementById(id);

function nowClock() {
  byId('clock').textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
setInterval(nowClock, 1000);
nowClock();

function loadState() {
  try {
    return normalizeState({ ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') });
  } catch {
    return structuredClone(defaults);
  }
}

function normalizeState(raw) {
  return {
    ...raw,
    services: Array.isArray(raw.services) ? raw.services : [],
    alarmCodes: uniqByCode(Array.isArray(raw.alarmCodes) ? raw.alarmCodes : defaults.alarmCodes),
    pzcCodes: uniqByCode(Array.isArray(raw.pzcCodes) ? raw.pzcCodes : defaults.pzcCodes)
  };
}

function uniqByCode(items) {
  const seen = new Set();
  return items.filter((x) => {
    const c = x?.code?.trim();
    if (!c || seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

function saveState() {
  state = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function uid() { return crypto.randomUUID(); }

function render() {
  renderServiceList();
  renderServiceDetail();
  renderStats();
  renderCodeLists();
}

function renderServiceList() {
  const list = byId('service-list');
  list.innerHTML = '';
  [...state.services].sort((a, b) => (b.startAt || '').localeCompare(a.startAt || '')).forEach((s) => {
    const card = document.createElement('button');
    card.className = 'card';
    const start = s.startAt ? formatDateTime(s.startAt) : '-';
    const end = s.endAt ? formatDateTime(s.endAt) : '-';
    card.innerHTML = `<h4>${start} → ${end}</h4><div class="meta">📍 ${s.location} · 🚑 ${s.vehicle} · 👥 ${s.colleagues?.length || 0} · ${s.incidents.length} Einsätze</div>`;
    card.onclick = () => selectService(s.id);
    list.append(card);
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
}

function selectService(id) {
  selectedServiceId = id;
  renderServiceDetail();
  byId('service-detail-panel').classList.add('show-mobile');
}

function serviceById() {
  return state.services.find((s) => s.id === selectedServiceId);
}

function calcDuration(times) {
  const vals = Object.values(times || {}).filter(Boolean).sort();
  if (vals.length < 2) return '-';
  const m = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const delta = m(vals.at(-1)) - m(vals[0]);
  return delta > 0 ? `${Math.floor(delta / 60)}h ${delta % 60}m` : '-';
}

function renderServiceDetail() {
  const s = serviceById();
  byId('btn-new-incident').disabled = !s;
  byId('service-title').textContent = s ? `${s.vehicle} · ${s.location}` : 'Dienst auswählen';
  byId('service-meta').textContent = s ? `${formatDateTime(s.startAt)} bis ${formatDateTime(s.endAt)} · Kollegen: ${(s.colleagues || []).join(', ') || '-'}` : '';
  const list = byId('incident-list');
  list.innerHTML = '';
  if (!s) return;
  s.incidents.forEach((i) => {
    const card = document.createElement('article');
    card.className = 'card';
    const pzc = i.pzc?.diag ? `${i.pzc.diag}-${i.pzc.age || '--'}-${i.pzc.prio || '-'}` : '-';
    const timeStrip = timeFields.map((f) => `<span class="pill ${i.times?.[f] ? 'blue' : ''}">${f}${i.times?.[f] ? ` ${i.times[f]}` : ''}</span>`).join(' ');
    card.innerHTML = `<h4>#${i.incidentNumber} · ${i.alarmCode}</h4><div class="meta">${i.lights ? '🚨 Einsatz' : '🧰 Nicht-Einsatz'} · ⏱️ ${calcDuration(i.times)} · PZC ${pzc}</div><div>${timeStrip}</div>`;
    card.onclick = () => openIncidentDialog(i.id);
    list.append(card);
  });
}

function renderStats() {
  const root = byId('stats');
  const incidents = state.services.flatMap((s) => s.incidents);
  const byAlarm = incidents.reduce((a, i) => ((a[i.alarmCode] = (a[i.alarmCode] || 0) + 1), a), {});
  const byPzc = incidents.filter((i) => i.pzc?.diag).reduce((a, i) => ((a[i.pzc.diag] = (a[i.pzc.diag] || 0) + 1), a), {});
  const topAlarm = Object.entries(byAlarm).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || '-';
  const topPzc = Object.entries(byPzc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || '-';
  root.innerHTML = `<div class="card"><h4>Einsätze gesamt</h4>${incidents.length}</div>
    <div class="card"><h4>Blaulichtquote</h4>${incidents.length ? Math.round(100 * incidents.filter((i) => i.lights).length / incidents.length) : 0}%</div>
    <div class="card"><h4>Top Stichwörter</h4><div class="meta">${topAlarm}</div></div>
    <div class="card"><h4>Top PZC Diagnose</h4><div class="meta">${topPzc}</div></div>`;
}

function renderCodeLists() {
  byId('alarm-code-list').innerHTML = state.alarmCodes.slice(0, 250).map((c) => `<div class="card">${c.code}</div>`).join('');
  byId('pzc-code-list').innerHTML = state.pzcCodes.slice(0, 250).map((p) => `<div class="card">${p.code} → ${p.diagnosis}</div>`).join('');
}

function mountSuggestions(input, containerId, items, max = 8) {
  const box = byId(containerId);
  const renderItems = () => {
    const q = input.value.toLowerCase().trim();
    box.innerHTML = items.filter((x) => x.toLowerCase().includes(q)).slice(0, max).map((x) => `<button type="button" class="suggest">${x}</button>`).join('');
    [...box.querySelectorAll('.suggest')].forEach((btn) => btn.onclick = () => { input.value = btn.textContent; renderItems(); });
  };
  input.addEventListener('input', renderItems);
  renderItems();
}

function collectHistoryValues(key) {
  const set = new Set();
  state.services.forEach((s) => {
    if (Array.isArray(s[key])) s[key].forEach((v) => set.add(v));
    else if (s[key]) set.add(s[key]);
  });
  return [...set].sort();
}

function addColleagueField(value = '') {
  const wrap = byId('colleague-wrap');
  const row = document.createElement('div');
  row.className = 'incident-no-wrap';
  row.innerHTML = `<input class="colleague-input" value="${value}" placeholder="Kollege/Kollegin"><button type="button" class="btn">−</button><div class="suggest-list"></div>`;
  row.querySelector('button').onclick = () => row.remove();
  const input = row.querySelector('input');
  const suggestBox = row.querySelector('.suggest-list');
  const pool = collectHistoryValues('colleagues');
  const redraw = () => {
    const q = input.value.toLowerCase().trim();
    suggestBox.innerHTML = pool.filter((x) => x.toLowerCase().includes(q)).slice(0, 6).map((x) => `<button type="button" class="suggest">${x}</button>`).join('');
    [...suggestBox.querySelectorAll('.suggest')].forEach((b) => b.onclick = () => { input.value = b.textContent; redraw(); });
  };
  input.addEventListener('input', redraw);
  redraw();
  wrap.append(row);
}

function openServiceDialog() {
  const form = byId('service-form');
  form.reset();
  byId('colleague-wrap').innerHTML = '';
  addColleagueField('');
  mountSuggestions(form.location, 'service-location-suggest', collectHistoryValues('location'));
  mountSuggestions(form.vehicle, 'service-vehicle-suggest', collectHistoryValues('vehicle'));
  byId('service-dialog').showModal();
}

function openIncidentDialog(incidentId = null) {
  editingIncidentId = incidentId;
  const form = byId('incident-form');
  form.reset();
  const year = String(new Date().getFullYear());
  byId('incident-year-prefix').textContent = year;
  buildTimeButtons();
  mountSuggestions(form.alarmCode, 'alarm-suggest', state.alarmCodes.map((a) => a.code), 10);
  incidentLights = false;
  setLightButton();

  if (incidentId) {
    const i = serviceById().incidents.find((x) => x.id === incidentId);
    form.incidentSuffix.value = i.incidentNumber.slice(4);
    form.alarmCode.value = i.alarmCode;
    incidentLights = !!i.lights;
    form.note.value = i.note || '';
    form.pzcDiag.value = i.pzc?.diag || '';
    form.pzcAge.value = i.pzc?.age || '';
    form.pzcPrio.value = i.pzc?.prio || '';
    [...byId('time-grid').querySelectorAll('.status-btn')].forEach((btn) => {
      const t = i.times?.[btn.dataset.key];
      if (t) { btn.dataset.time = t; btn.classList.add('on'); btn.querySelector('small').textContent = t; }
    });
    setLightButton();
    updatePzcPreview();
  }
  byId('incident-dialog').showModal();
}

function setLightButton() {
  const b = byId('btn-lights-toggle');
  b.classList.toggle('off', !incidentLights);
  b.textContent = incidentLights ? '🚨' : '🧰';
}

function shouldAutoLights(code) {
  return AUTO_LIGHTS_RE.test(code || '');
}

function buildTimeButtons() {
  const root = byId('time-grid');
  root.innerHTML = '';
  timeFields.forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'status-btn';
    btn.dataset.key = name;
    btn.innerHTML = `<strong>${name}</strong><small>--:--</small>`;
    btn.onclick = () => {
      const value = prompt(`${name} (HH:MM)`, btn.dataset.time || '');
      if (!value) return;
      if (!/^\d{2}:\d{2}$/.test(value)) return alert('Format HH:MM');
      btn.dataset.time = value;
      btn.classList.add('on');
      btn.querySelector('small').textContent = value;
    };
    root.append(btn);
  });
}

function updatePzcPreview() {
  const f = byId('incident-form');
  const diag = f.pzcDiag.value;
  const txt = state.pzcCodes.find((p) => p.code === diag)?.diagnosis || '-';
  byId('pzc-preview').textContent = `Diagnose: ${txt}`;
}

byId('btn-new-service').onclick = openServiceDialog;
byId('btn-back').onclick = () => byId('service-detail-panel').classList.remove('show-mobile');
byId('btn-new-incident').onclick = () => openIncidentDialog();
byId('btn-add-colleague').onclick = () => addColleagueField('');
byId('btn-lights-toggle').onclick = () => { incidentLights = !incidentLights; setLightButton(); };

byId('service-form').onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const colleagues = [...byId('colleague-wrap').querySelectorAll('.colleague-input')].map((x) => x.value.trim()).filter(Boolean);
  const service = {
    id: uid(),
    startAt: f.startAt.value,
    endAt: f.endAt.value,
    location: f.location.value.trim(),
    vehicle: f.vehicle.value.trim(),
    colleagues,
    incidents: []
  };
  state.services.push(service);
  selectedServiceId = service.id;
  byId('service-dialog').close();
  saveState();
};

byId('incident-form').onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const alarmCode = f.alarmCode.value.trim();
  const suffix = f.incidentSuffix.value.trim();
  if (!/^\d{6}$/.test(suffix)) return alert('Bitte 6 Ziffern bei der Einsatznummer eingeben.');
  const year = String(new Date().getFullYear());
  const times = Object.fromEntries([...byId('time-grid').querySelectorAll('.status-btn')].filter((b) => b.dataset.time).map((b) => [b.dataset.key, b.dataset.time]));
  const payload = {
    id: editingIncidentId || uid(),
    incidentNumber: `${year}${suffix}`,
    alarmCode,
    lights: shouldAutoLights(alarmCode) ? true : incidentLights,
    times,
    note: f.note.value.trim(),
    pzc: { diag: f.pzcDiag.value.trim(), age: f.pzcAge.value.trim(), prio: f.pzcPrio.value.trim() }
  };
  const s = serviceById();
  if (editingIncidentId) s.incidents = s.incidents.map((i) => i.id === editingIncidentId ? payload : i);
  else s.incidents.push(payload);
  byId('incident-dialog').close();
  saveState();
};

byId('incident-form').alarmCode.addEventListener('input', (e) => {
  if (shouldAutoLights(e.target.value.trim())) {
    incidentLights = true;
    setLightButton();
  }
});
['pzcDiag', 'pzcAge', 'pzcPrio'].forEach((k) => byId('incident-form')[k].addEventListener('input', updatePzcPreview));

byId('btn-export').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `einsatztagebuch-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
};

byId('import-input').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state = normalizeState({ ...defaults, ...JSON.parse(await file.text()) });
  saveState();
};

document.querySelectorAll('.tab').forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    byId(`tab-${t.dataset.tab}`).classList.add('active');
  };
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

render();
