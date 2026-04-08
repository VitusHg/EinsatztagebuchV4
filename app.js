const STORAGE_KEY = 'einsatzTagebuchV4';
const timeFields = ['Alarmierung', 'Anfahrt', 'Am Einsatzort', 'Transport', 'Am Transportziel', 'Einsatz beendet'];
const AUTO_LIGHTS_RE = /^(A\d|B1\b|B2\b|C1\b)/;

const defaults = {
  profile: { displayName: 'Privat' },
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
    profile: raw.profile && typeof raw.profile === 'object' ? raw.profile : defaults.profile,
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
    card.className = 'card service-card';
    const start = s.startAt ? formatDateTime(s.startAt) : '-';
    const end = s.endAt ? formatDateTime(s.endAt) : '-';
    const weekday = new Date(s.startAt).toLocaleDateString('de-DE', { weekday: 'short' }).toUpperCase();
    card.innerHTML = `<h4>☀️ ${start} <span class="pill">${weekday}</span></h4>
      <div class="meta">📍 ${s.location}</div>
      <div class="meta">🚑 ${s.vehicle} · 👥 ${s.colleagues?.length || 0}</div>
      <div class="meta">📷 ${s.incidents.length} Einsätze · ⏱️ ${serviceHours(s)}</div>`;
    card.onclick = () => selectService(s.id);
    list.append(card);
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
}
function serviceHours(service) {
  if (!service.startAt || !service.endAt) return '-';
  const diffMin = Math.max(0, Math.round((new Date(service.endAt) - new Date(service.startAt)) / 60000));
  return `${(diffMin / 60).toFixed(1)}h`;
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
  let isOpen = false;
  const renderItems = () => {
    const q = input.value.toLowerCase().trim();
    const results = items.filter((x) => x.toLowerCase().includes(q)).slice(0, max);
    box.innerHTML = results.map((x) => `<button type="button" class="dropdown-item">${x}</button>`).join('');
    box.classList.toggle('open', isOpen && results.length > 0);
    [...box.querySelectorAll('.dropdown-item')].forEach((btn) => btn.onclick = () => {
      input.value = btn.textContent;
      isOpen = false;
      renderItems();
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  input.addEventListener('focus', () => { isOpen = true; renderItems(); });
  input.addEventListener('input', () => { isOpen = true; renderItems(); });
  input.addEventListener('blur', () => setTimeout(() => { isOpen = false; renderItems(); }, 120));
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
  const nextSuffix = String(((serviceById()?.incidents || []).length + 1)).padStart(6, '0');
  form.incidentSuffix.value = nextSuffix;
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
    const writeTime = (value) => {
      btn.dataset.time = value;
      btn.classList.add('on');
      btn.querySelector('small').textContent = value;
    };
    let longPressTimer = null;
    let consumed = false;
    btn.addEventListener('pointerdown', () => {
      consumed = false;
      longPressTimer = setTimeout(() => {
        const now = new Date().toTimeString().slice(0, 5);
        writeTime(now);
        consumed = true;
      }, 520);
    });
    btn.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    btn.addEventListener('pointerleave', () => clearTimeout(longPressTimer));
    btn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const now = new Date().toTimeString().slice(0, 5);
      writeTime(now);
      consumed = true;
    });
    btn.addEventListener('click', () => {
      if (consumed) return;
      const value = prompt(`${name} (HH:MM)`, btn.dataset.time || '');
      if (!value) return;
      if (!/^\d{2}:\d{2}$/.test(value)) return alert('Format HH:MM');
      writeTime(value);
    });
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
  if (!alarmCode) return alert('Bitte mindestens ein Stichwort eingeben.');
  const rawSuffix = f.incidentSuffix.value.trim();
  const suffix = /^\d{6}$/.test(rawSuffix) ? rawSuffix : String(Date.now()).slice(-6);
  const year = String(new Date().getFullYear());
  const times = Object.fromEntries([...byId('time-grid').querySelectorAll('.status-btn')].filter((b) => b.dataset.time).map((b) => [b.dataset.key, b.dataset.time]));
  const payload = {
    id: editingIncidentId || uid(),
    incidentNumber: `${year}${suffix}`,
    alarmCode,
    lights: shouldAutoLights(alarmCode) ? true : incidentLights,
    times,
    note: f.note.value.trim(),
    createdAt: new Date().toISOString(),
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
  const exportPayload = toCompatExport(state);
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `einsatztagebuch-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
};

byId('import-input').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const imported = JSON.parse(await file.text());
  state = normalizeState(fromCompatibleImport(imported));
  saveState();
};

function toCompatExport(source) {
  return {
    exportedAt: new Date().toISOString(),
    user: { displayName: source.profile?.displayName || 'Privat' },
    shifts: source.services.map((s) => {
      const start = s.startAt ? new Date(s.startAt) : null;
      const end = s.endAt ? new Date(s.endAt) : null;
      const duration = start && end ? Number(((end - start) / 3600000).toFixed(2)) : 0;
      return {
        shiftId: s.id,
        startTime: start ? start.toISOString() : null,
        endTime: end ? end.toISOString() : null,
        duration,
        location: s.location || '',
        resource: s.vehicle || '',
        tip: 0,
        note: s.note || '',
        crew: s.colleagues || [],
        missions: (s.incidents || []).map((m) => ({
          missionId: m.id,
          title: m.alarmCode || '',
          emergency: !!m.lights,
          tip: 0,
          note: m.note || '',
          creation: m.createdAt || new Date().toISOString(),
          highlighted: false,
          incidentNumber: m.incidentNumber || '',
          times: m.times || {},
          pzc: m.pzc || {}
        }))
      };
    })
  };
}

function fromCompatibleImport(payload) {
  if (Array.isArray(payload?.services)) return { ...defaults, ...payload };
  if (!Array.isArray(payload?.shifts)) return { ...defaults };
  return {
    ...defaults,
    profile: { displayName: payload?.user?.displayName || 'Privat' },
    services: payload.shifts.map((shift) => ({
      id: shift.shiftId || uid(),
      startAt: shift.startTime ? new Date(shift.startTime).toISOString().slice(0, 16) : '',
      endAt: shift.endTime ? new Date(shift.endTime).toISOString().slice(0, 16) : '',
      location: shift.location || '',
      vehicle: shift.resource || '',
      note: shift.note || '',
      colleagues: Array.isArray(shift.crew) ? shift.crew : [],
      incidents: (shift.missions || []).map((m) => ({
        id: m.missionId || uid(),
        incidentNumber: m.incidentNumber || `${new Date().getFullYear()}${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`,
        alarmCode: m.title || '',
        lights: !!m.emergency,
        times: m.times || {},
        note: m.note || '',
        createdAt: m.creation || new Date().toISOString(),
        pzc: m.pzc || { diag: '', age: '', prio: '' }
      }))
    }))
  };
}

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
