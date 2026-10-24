/* ============================================================
   AFC HOTEL — Admin dashboard
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const SESSION_KEY = 'afc_admin_session';

  let db = DB.load();
  let state = { view: 'overview', orderFilter: 'all', bookingFilter: 'all', menuQ: '', menuCat: 'all', editItemId: null, editRoomId: null };
  let knownOrderIds = new Set(db.orders.map(o => o.id));

  /* ---------------- toast ---------------- */
  function toast(msg, ok) {
    const el = document.createElement('div');
    el.className = 'toast' + (ok ? ' ok' : ''); el.textContent = msg;
    $('#toastStack').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3000);
  }

  /* ---------------- auth ---------------- */
  const isLoggedIn = () => sessionStorage.getItem(SESSION_KEY) === '1';
  function showDash() {
    $('#loginScreen').style.display = 'none';
    $('#dash').hidden = false;
    renderAll();
  }
  function showLogin() {
    $('#loginScreen').style.display = 'grid';
    $('#dash').hidden = true;
  }
  $('#loginForm').onsubmit = e => {
    e.preventDefault();
    const u = $('#loginUser').value.trim(), p = $('#loginPass').value;
    if (u === db.auth.username && p === db.auth.password) {
      sessionStorage.setItem(SESSION_KEY, '1');
      $('#loginError').classList.remove('show');
      e.target.reset();
      showDash();
      toast('👋 Welcome back, Admin!', true);
    } else {
      $('#loginError').classList.remove('show');
      void $('#loginError').offsetWidth;
      $('#loginError').classList.add('show');
    }
  };
  $('#logoutBtn').onclick = () => { sessionStorage.removeItem(SESSION_KEY); showLogin(); };

  /* ---------------- routing ---------------- */
  const TITLES = { overview: 'Overview', orders: 'Live Orders', bookings: 'Bookings', menu: 'Menu Manager', rooms: 'Rooms', settings: 'Settings' };
  function setView(v) {
    state.view = v;
    $$('#sideNav a').forEach(a => a.classList.toggle('active', a.dataset.view === v));
    $$('.view').forEach(s => s.classList.remove('active'));
    $('#view-' + v).classList.add('active');
    $('#viewTitle').textContent = TITLES[v];
    $('#sideToggle').parentElement && $('.side').classList.remove('open');
    renderView(v);
  }
  $$('#sideNav a').forEach(a => a.onclick = () => setView(a.dataset.view));
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]');
    if (g) setView(g.dataset.goto);
  });
  $('#sideToggle').onclick = () => $('.side').classList.toggle('open');
  $('#mainDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function renderView(v) {
    ({ overview: renderOverview, orders: renderOrders, bookings: renderBookings, menu: renderMenuMgr, rooms: renderRooms, settings: renderSettings })[v]();
  }
  function renderAll() {
    $('#sideHotel').textContent = db.settings.hotelName;
    updateBadges();
    renderView(state.view);
  }

  /* ---------------- badges ---------------- */
  function updateBadges() {
    const po = db.orders.filter(o => o.status === 'pending').length;
    const pb = db.bookings.filter(b => b.status === 'pending').length;
    $('#navOrderBadge').hidden = !po; $('#navOrderBadge').textContent = po;
    $('#navBookingBadge').hidden = !pb; $('#navBookingBadge').textContent = pb;
  }

  /* ---------------- helpers ---------------- */
  const NXT = { delivery: { pending: 'accepted', accepted: 'preparing', preparing: 'out', out: 'completed' },
    pickup:  { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'completed' },
    dinein:  { pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'completed' } };
  const ADVANCE_LABEL = { pending: '✅ Accept order', accepted: '👨‍🍳 Start preparing', preparing: '🛵 Mark out / ready', out: '✔ Mark delivered', ready: '✔ Mark completed' };
  const TYPE_ICON = { delivery: '🛵 Delivery', pickup: '🥡 Takeaway', dinein: '🍽️ Dine-in' };
  const pill = st => `<span class="pill p-${st}">${st.replace('_', ' ')}</span>`;

  /* ---------------- overview ---------------- */
  function renderOverview() {
    const today = new Date().toDateString();
    const tOrders = db.orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== 'cancelled');
    $('#stRevenue').textContent = fmtRs(tOrders.reduce((a, o) => a + o.total, 0));
    $('#stOrders').textContent = tOrders.length;
    $('#stPending').textContent = db.orders.filter(o => o.status === 'pending').length;
    $('#stBookings').textContent = db.bookings.filter(b => b.status === 'pending').length;
    $('#stMenu').textContent = db.menu.length;
    drawChart();
    renderTopItems();
    renderRecentOrders();
  }

  function drawChart() {
    const cv = $('#revChart');
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth || cv.parentElement.clientWidth - 40, H = 180;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const rev = db.orders
        .filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.status !== 'cancelled')
        .reduce((a, o) => a + o.total, 0);
      days.push({ label: d.toLocaleDateString('en-GB', { weekday: 'short' }), rev });
    }
    const max = Math.max(...days.map(d => d.rev), 100);
    const pad = { l: 8, r: 8, t: 26, b: 26 };
    const bw = (W - pad.l - pad.r) / days.length;

    days.forEach((d, i) => {
      const x = pad.l + i * bw;
      const bh = Math.max(4, (d.rev / max) * (H - pad.t - pad.b));
      const y = H - pad.b - bh;
      const grad = ctx.createLinearGradient(0, y, 0, H - pad.b);
      grad.addColorStop(0, '#f0d77b'); grad.addColorStop(1, '#c39a23');
      ctx.fillStyle = d.rev ? grad : '#eee7d5';
      const r = 6, bx = x + bw * .2, bwd = bw * .6;
      ctx.beginPath();
      ctx.moveTo(bx, H - pad.b);
      ctx.lineTo(bx, y + r); ctx.quadraticCurveTo(bx, y, bx + r, y);
      ctx.lineTo(bx + bwd - r, y); ctx.quadraticCurveTo(bx + bwd, y, bx + bwd, y + r);
      ctx.lineTo(bx + bwd, H - pad.b); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a8194'; ctx.font = '11px Jost, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x + bw / 2, H - 8);
      if (d.rev) {
        ctx.fillStyle = '#8a6d1a'; ctx.font = 'bold 10.5px Jost, sans-serif';
        ctx.fillText((d.rev >= 1000 ? (d.rev / 1000).toFixed(1) + 'k' : d.rev), x + bw / 2, y - 7);
      }
    });
  }

  function renderTopItems() {
    const tally = {};
    db.orders.filter(o => o.status !== 'cancelled').forEach(o => o.items.forEach(i => {
      tally[i.name] = (tally[i.name] || 0) + i.qty;
    }));
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
    $('#topItems').innerHTML = top.length
      ? top.map((t, i) => `<div class="top-item"><span class="rank">${i + 1}</span><b>${esc(t[0])}</b><span>${t[1]} sold</span></div>`).join('')
      : '<div class="top-empty">No sales yet — top items will appear here.</div>';
  }

  function renderRecentOrders() {
    const rows = db.orders.slice(0, 6).map(o => `
      <tr>
        <td class="oid">${esc(o.id)}<small class="mut">${timeAgo(o.createdAt)}</small></td>
        <td><span class="type-ico">${TYPE_ICON[o.type] || o.type}</span></td>
        <td>${esc(o.customer.name)}<small class="mut">${esc(o.customer.phone)}</small></td>
        <td>${o.items.reduce((a, i) => a + i.qty, 0)} items</td>
        <td><b>${fmtRs(o.total)}</b></td>
        <td>${pill(o.status)}</td>
      </tr>`).join('');
    $('#recentOrdersTable').innerHTML = `
      <thead><tr><th>Order</th><th>Type</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--mut);padding:30px">No orders yet. New orders appear here in real time.</td></tr>'}</tbody>`;
  }

  /* ---------------- orders ---------------- */
  $$('#orderFilters .fchip').forEach(c => c.onclick = () => {
    $$('#orderFilters .fchip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); state.orderFilter = c.dataset.f; renderOrders();
  });

  function orderMatches(o) {
    const f = state.orderFilter;
    if (f === 'all') return true;
    if (f === 'out') return o.status === 'out' || o.status === 'ready';
    return o.status === f;
  }

  function renderOrders(flashIds) {
    const orders = db.orders.filter(orderMatches);
    const grid = $('#ordersGrid');
    if (!orders.length) {
      grid.innerHTML = `<div class="orders-empty"><span>🧾</span>No ${state.orderFilter === 'all' ? '' : state.orderFilter + ' '}orders yet.<br><small>Orders placed on the website show up here instantly.</small></div>`;
      return;
    }
    grid.innerHTML = orders.map(o => {
      const next = (NXT[o.type] || NXT.delivery)[o.status];
      const flash = flashIds && flashIds.has(o.id) ? ' new-flash' : '';
      return `<div class="ocard${flash}" data-id="${esc(o.id)}">
        <div class="oc-head">
          <div><b>${esc(o.id)}</b><small>${timeAgo(o.createdAt)} · ${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>
          ${pill(o.status)}
        </div>
        <span class="type-ico">${TYPE_ICON[o.type] || o.type}${o.customer.table ? ' · Table ' + esc(o.customer.table) : ''}</span>
        <div class="oc-cust">
          <b>${esc(o.customer.name)}</b> · <a href="tel:${esc(o.customer.phone)}" style="color:#2166a5">${esc(o.customer.phone)}</a>
          ${o.customer.address ? `<br>📍 ${esc(o.customer.address)}` : ''}
          <br><small>💳 ${o.customer.pay === 'wallet' ? 'Khalti / eSewa' : 'Cash'}</small>
        </div>
        <div class="oc-items">
          ${o.items.map(i => `<div><span>${i.qty} × ${esc(i.name)}${i.label ? ' <small>(' + esc(i.label) + ')</small>' : ''}</span><span>${fmtRs(i.price * i.qty)}</span></div>`).join('')}
          ${o.deliveryFee ? `<div><span>Delivery fee</span><span>${fmtRs(o.deliveryFee)}</span></div>` : ''}
        </div>
        ${o.customer.note ? `<div class="oc-note">📝 ${esc(o.customer.note)}</div>` : ''}
        <div class="oc-total"><span>Total</span><span>${fmtRs(o.total)}</span></div>
        ${o.status !== 'completed' && o.status !== 'cancelled' ? `
        <div class="oc-actions">
          ${next ? `<button class="abtn oc-advance" data-adv="${esc(o.id)}">${ADVANCE_LABEL[o.status]}</button>` : ''}
          <button class="abtn oc-cancel" data-cancel="${esc(o.id)}">✖ Cancel</button>
        </div>` : ''}
      </div>`;
    }).join('');

    grid.querySelectorAll('[data-adv]').forEach(b => b.onclick = () => advanceOrder(b.dataset.adv));
    grid.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => {
      if (confirm('Cancel order ' + b.dataset.cancel + '?')) setOrderStatus(b.dataset.cancel, 'cancelled');
    });
  }

  function advanceOrder(id) {
    const o = db.orders.find(x => x.id === id);
    if (!o) return;
    const next = (NXT[o.type] || NXT.delivery)[o.status];
    if (next) setOrderStatus(id, next);
  }
  function setOrderStatus(id, status) {
    DB.update(d => {
      const o = d.orders.find(x => x.id === id);
      if (o) { o.status = status; (o.timeline = o.timeline || []).push({ status, at: Date.now() }); }
    });
    toast(`Order ${id} → ${status.replace('_', ' ')}`, true);
  }

  $('#clearDoneBtn').onclick = () => {
    if (!confirm('Remove all completed and cancelled orders from history?')) return;
    DB.update(d => { d.orders = d.orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled'); });
    toast('Cleared finished orders', true);
  };

  /* ---------------- bookings ---------------- */
  $$('#bookingFilters .fchip').forEach(c => c.onclick = () => {
    $$('#bookingFilters .fchip').forEach(x => x.classList.remove('active'));
    c.classList.add('active'); state.bookingFilter = c.dataset.f; renderBookings();
  });

  function renderBookings() {
    const f = state.bookingFilter;
    const list = db.bookings.filter(b => {
      if (f === 'all') return true;
      if (f === 'room' || f === 'table') return b.kind === f;
      return b.status === f;
    });
    const rows = list.map(b => `
      <tr>
        <td class="oid">${esc(b.id)}<small class="mut">${timeAgo(b.createdAt)}</small></td>
        <td><span class="type-ico">${b.kind === 'room' ? '🛏️ Room' : '🍽️ Table'}</span></td>
        <td>${b.kind === 'room'
          ? `<b>${esc(b.roomName || '')}</b><small class="mut">${esc(b.checkin)} → ${esc(b.checkout)}</small>`
          : `<b>${esc(b.date)}</b><small class="mut">at ${esc(b.time)}</small>`}</td>
        <td>${b.guests} guest${b.guests > 1 ? 's' : ''}</td>
        <td><b>${esc(b.name)}</b><small class="mut">${esc(b.phone)}${b.note ? ' · ' + esc(b.note) : ''}</small></td>
        <td>${pill(b.status)}</td>
        <td><div class="bk-actions">
          <a class="mini-btn" href="tel:${esc(b.phone)}">📞 Call</a>
          ${b.status === 'pending' ? `<button class="mini-btn ok" data-bstatus="confirmed" data-id="${esc(b.id)}">Confirm</button>` : ''}
          ${b.status === 'confirmed' ? `<button class="mini-btn done" data-bstatus="completed" data-id="${esc(b.id)}">Complete</button>` : ''}
          ${b.status !== 'cancelled' && b.status !== 'completed' ? `<button class="mini-btn no" data-bstatus="cancelled" data-id="${esc(b.id)}">Cancel</button>` : ''}
          <button class="mini-btn del" data-bdel="${esc(b.id)}">🗑</button>
        </div></td>
      </tr>`).join('');
    $('#bookingsTable').innerHTML = `
      <thead><tr><th>Ref</th><th>Type</th><th>Details</th><th>Guests</th><th>Customer</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--mut);padding:30px">No bookings found.</td></tr>'}</tbody>`;

    $$('#bookingsTable [data-bstatus]').forEach(b => b.onclick = () => {
      DB.update(d => { const bk = d.bookings.find(x => x.id === b.dataset.id); if (bk) bk.status = b.dataset.bstatus; });
      toast(`Booking ${b.dataset.id} → ${b.dataset.bstatus}`, true);
    });
    $$('#bookingsTable [data-bdel]').forEach(b => b.onclick = () => {
      if (!confirm('Delete booking ' + b.dataset.bdel + '?')) return;
      DB.update(d => { d.bookings = d.bookings.filter(x => x.id !== b.dataset.bdel); });
      toast('Booking deleted', true);
    });
  }

  /* ---------------- menu manager ---------------- */
  function mgrCategories() { return [...new Set(db.menu.map(it => it.cat))]; }

  function renderMenuMgr() {
    const sel = $('#mgrCat');
    const cats = mgrCategories();
    sel.innerHTML = '<option value="all">All categories</option>' + cats.map(c => `<option ${state.menuCat === c ? 'selected' : ''}>${esc(c)}</option>`).join('');

    const q = state.menuQ.toLowerCase();
    const items = db.menu.filter(it =>
      (state.menuCat === 'all' || it.cat === state.menuCat) &&
      (!q || it.name.toLowerCase().includes(q)));

    const rows = items.map(it => `
      <tr>
        <td><span class="veg-dot ${it.veg ? 'veg' : 'nonveg'}" title="${it.veg ? 'Veg' : 'Non-veg'}"></span></td>
        <td><b>${esc(it.name)}</b>${it.popular ? ' <span class="star">★</span>' : ''}${it.desc ? `<small class="mut">${esc(it.desc)}</small>` : ''}</td>
        <td>${esc(it.cat)}</td>
        <td>${it.variants ? it.variants.map(vrb => `${esc(vrb.label)}: <b>${vrb.price}</b>`).join('<br>') : `<b>${fmtRs(it.price)}</b>`}</td>
        <td><button class="avail-toggle ${it.available ? 'on' : ''}" data-toggle="${it.id}" title="Toggle availability"></button></td>
        <td><div class="bk-actions">
          <button class="mini-btn" data-edit="${it.id}">✏️ Edit</button>
          <button class="mini-btn del" data-del="${it.id}">🗑</button>
        </div></td>
      </tr>`).join('');

    $('#menuTable').innerHTML = `
      <thead><tr><th></th><th>Item</th><th>Category</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--mut);padding:30px">No items match.</td></tr>'}</tbody>`;

    $$('#menuTable [data-toggle]').forEach(b => b.onclick = () => {
      DB.update(d => { const it = d.menu.find(x => x.id === b.dataset.toggle); if (it) it.available = !it.available; });
    });
    $$('#menuTable [data-del]').forEach(b => b.onclick = () => {
      const it = db.menu.find(x => x.id === b.dataset.del);
      if (!confirm(`Delete "${it ? it.name : ''}" from the menu?`)) return;
      DB.update(d => { d.menu = d.menu.filter(x => x.id !== b.dataset.del); });
      toast('Item deleted', true);
    });
    $$('#menuTable [data-edit]').forEach(b => b.onclick = () => openItemModal(b.dataset.edit));
  }
  $('#mgrSearch').addEventListener('input', e => { state.menuQ = e.target.value; renderMenuMgr(); });
  $('#mgrCat').onchange = e => { state.menuCat = e.target.value; renderMenuMgr(); };

  /* ----- item modal ----- */
  function fillGroupSelect(selected) {
    $('#it-group').innerHTML = AFC_GROUPS.map(g => `<option value="${g.id}" ${g.id === selected ? 'selected' : ''}>${g.icon} ${g.name}</option>`).join('');
  }
  function addVarRow(label, price) {
    const row = document.createElement('div');
    row.className = 'var-row';
    row.innerHTML = `<input placeholder="e.g. Steam / 750 ml" value="${esc(label || '')}">
      <input type="number" min="0" placeholder="Price" value="${price ?? ''}">
      <button type="button" class="var-rm">✕</button>`;
    row.querySelector('.var-rm').onclick = () => row.remove();
    $('#varRows').appendChild(row);
  }
  $('#addVarRow').onclick = () => addVarRow();
  $$('input[name="pmode"]').forEach(r => r.onchange = () => {
    const single = document.querySelector('input[name="pmode"]:checked').value === 'single';
    $('#singlePriceWrap').hidden = !single;
    $('#variantsWrap').hidden = single;
    if (!single && !$('#varRows').children.length) addVarRow();
  });

  function openItemModal(id) {
    state.editItemId = id || null;
    $('#itemModalTitle').textContent = id ? 'Edit Menu Item' : 'Add Menu Item';
    $('#catList').innerHTML = mgrCategories().map(c => `<option value="${esc(c)}">`).join('');
    const it = id ? db.menu.find(x => x.id === id) : null;
    $('#it-name').value = it ? it.name : '';
    $('#it-cat').value = it ? it.cat : '';
    fillGroupSelect(it ? groupOf(db, it.cat) : 'snacks');
    $('#it-veg').checked = it ? !!it.veg : false;
    $('#it-popular').checked = it ? !!it.popular : false;
    $('#it-available').checked = it ? !!it.available : true;
    $('#it-desc').value = it && it.desc ? it.desc : '';
    $('#varRows').innerHTML = '';
    if (it && it.variants) {
      document.querySelector('input[name="pmode"][value="variants"]').checked = true;
      $('#singlePriceWrap').hidden = true; $('#variantsWrap').hidden = false;
      it.variants.forEach(vrb => addVarRow(vrb.label, vrb.price));
    } else {
      document.querySelector('input[name="pmode"][value="single"]').checked = true;
      $('#singlePriceWrap').hidden = false; $('#variantsWrap').hidden = true;
      $('#it-price').value = it ? it.price : '';
    }
    $('#itemModal').classList.add('open');
  }
  $('#addItemBtn').onclick = () => openItemModal(null);
  $$('[data-close]').forEach(b => b.onclick = () => $('#' + b.dataset.close).classList.remove('open'));
  $$('.amodal-veil').forEach(v => v.addEventListener('click', e => { if (e.target === v) v.classList.remove('open'); }));

  $('#itemForm').onsubmit = e => {
    e.preventDefault();
    const single = document.querySelector('input[name="pmode"]:checked').value === 'single';
    const cat = $('#it-cat').value.trim();
    if (!cat) { toast('⚠ Category is required'); return; }

    let price = null, variants = null;
    if (single) {
      price = Number($('#it-price').value);
      if (isNaN(price) || price < 0 || $('#it-price').value === '') { toast('⚠ Enter a valid price'); return; }
    } else {
      variants = [...$('#varRows').children].map(r => ({
        label: r.children[0].value.trim(), price: Number(r.children[1].value),
      })).filter(vrb => vrb.label && !isNaN(vrb.price));
      if (!variants.length) { toast('⚠ Add at least one valid variant'); return; }
    }

    DB.update(d => {
      d.catGroups[cat] = $('#it-group').value;
      if (state.editItemId) {
        const it = d.menu.find(x => x.id === state.editItemId);
        if (it) Object.assign(it, {
          name: $('#it-name').value.trim(), cat, price, variants,
          veg: $('#it-veg').checked, popular: $('#it-popular').checked,
          available: $('#it-available').checked, desc: $('#it-desc').value.trim() || undefined,
        });
      } else {
        d.menu.push({
          id: 'm' + Date.now().toString(36),
          name: $('#it-name').value.trim(), cat, price, variants,
          veg: $('#it-veg').checked, popular: $('#it-popular').checked,
          available: $('#it-available').checked, desc: $('#it-desc').value.trim() || undefined,
        });
      }
    });
    $('#itemModal').classList.remove('open');
    toast(state.editItemId ? '✓ Item updated' : '✓ Item added to menu', true);
    state.editItemId = null;
  };

  /* ---------------- rooms ---------------- */
  function renderRooms() {
    $('#roomsGrid').innerHTML = db.rooms.map(r => `
      <div class="aroom ${r.available ? '' : 'off'}">
        <h4>${esc(r.name)} ${r.popular ? '<span class="star">★</span>' : ''}<b>${fmtRs(r.price)}</b></h4>
        <p>${esc(r.desc || '')}</p>
        <div class="meta"><span>👤 ${r.capacity} guests</span><span>${r.available ? '✔ Available' : '✖ Unavailable'}</span></div>
        <div class="acts">
          <button class="mini-btn" data-redit="${r.id}">✏️ Edit</button>
          <button class="mini-btn ${r.available ? 'no' : 'ok'}" data-rtoggle="${r.id}">${r.available ? 'Mark unavailable' : 'Mark available'}</button>
          <button class="mini-btn del" data-rdel="${r.id}">🗑</button>
        </div>
      </div>`).join('');

    $$('#roomsGrid [data-redit]').forEach(b => b.onclick = () => openRoomModal(b.dataset.redit));
    $$('#roomsGrid [data-rtoggle]').forEach(b => b.onclick = () => {
      DB.update(d => { const r = d.rooms.find(x => x.id === b.dataset.rtoggle); if (r) r.available = !r.available; });
    });
    $$('#roomsGrid [data-rdel]').forEach(b => b.onclick = () => {
      if (!confirm('Delete this room type?')) return;
      DB.update(d => { d.rooms = d.rooms.filter(x => x.id !== b.dataset.rdel); });
      toast('Room deleted', true);
    });
  }

  function openRoomModal(id) {
    state.editRoomId = id || null;
    const r = id ? db.rooms.find(x => x.id === id) : null;
    $('#roomModalTitle').textContent = id ? 'Edit Room' : 'Add Room';
    $('#rm-name').value = r ? r.name : '';
    $('#rm-price').value = r ? r.price : '';
    $('#rm-cap').value = r ? r.capacity : 2;
    $('#rm-desc').value = r && r.desc ? r.desc : '';
    $('#rm-available').checked = r ? !!r.available : true;
    $('#rm-popular').checked = r ? !!r.popular : false;
    $('#roomModal').classList.add('open');
  }
  $('#addRoomBtn').onclick = () => openRoomModal(null);

  $('#roomFormA').onsubmit = e => {
    e.preventDefault();
    DB.update(d => {
      if (state.editRoomId) {
        const r = d.rooms.find(x => x.id === state.editRoomId);
        if (r) Object.assign(r, { name: $('#rm-name').value.trim(), price: Number($('#rm-price').value), capacity: Number($('#rm-cap').value), desc: $('#rm-desc').value.trim(), available: $('#rm-available').checked, popular: $('#rm-popular').checked });
      } else {
        d.rooms.push({ id: 'r' + Date.now().toString(36), name: $('#rm-name').value.trim(), price: Number($('#rm-price').value), capacity: Number($('#rm-cap').value), desc: $('#rm-desc').value.trim(), available: $('#rm-available').checked, popular: $('#rm-popular').checked });
      }
    });
    $('#roomModal').classList.remove('open');
    toast(state.editRoomId ? '✓ Room updated' : '✓ Room added', true);
    state.editRoomId = null;
  };

  /* ---------------- settings ---------------- */
  function renderSettings() {
    const s = db.settings;
    ['hotelName', 'tagline', 'phone', 'email', 'address', 'facebook', 'hours', 'heroTitle', 'heroSubtitle', 'about', 'notice', 'deliveryFee', 'freeDeliveryAbove']
      .forEach(k => { const el = $('#s-' + k); if (el) el.value = s[k] ?? ''; });
    $('#a-username').value = db.auth.username;
    $('#a-password').value = '';
  }

  $('#settingsForm').onsubmit = e => {
    e.preventDefault();
    DB.update(d => {
      ['hotelName', 'tagline', 'phone', 'email', 'address', 'facebook', 'hours', 'heroTitle', 'heroSubtitle', 'about', 'notice']
        .forEach(k => d.settings[k] = $('#s-' + k).value.trim());
      d.settings.deliveryFee = Number($('#s-deliveryFee').value) || 0;
      d.settings.freeDeliveryAbove = Number($('#s-freeDeliveryAbove').value) || 0;
    });
    toast('✓ Settings saved — website updated live', true);
  };

  $('#authForm').onsubmit = e => {
    e.preventDefault();
    const u = $('#a-username').value.trim();
    const p = $('#a-password').value;
    if (!u) { toast('⚠ Username cannot be empty'); return; }
    DB.update(d => { d.auth.username = u; if (p) d.auth.password = p; });
    toast('✓ Admin login updated', true);
    $('#a-password').value = '';
  };

  $('#resetBtn').onclick = () => {
    if (!confirm('⚠ This will erase ALL edits, orders and bookings, and restore the original site. Continue?')) return;
    DB.reset();
    db = DB.get();
    knownOrderIds = new Set(db.orders.map(o => o.id));
    renderAll();
    toast('↺ Website data reset to defaults', true);
  };

  $('#demoBtn').onclick = () => {
    DB.update(d => {
      const pick = (id, label) => { const it = d.menu.find(x => x.id === id); return { id: it.id, name: it.name, label: label || (it.variants ? it.variants[0].label : null), price: label && it.variants ? (it.variants.find(x => x.label === label) || it.variants[0]).price : itemPrice(it), qty: 1 }; };
      const mk = (type, items, cust, status, minsAgo) => {
        const sub = items.reduce((a, i) => a + i.price * i.qty, 0);
        const fee = type === 'delivery' && sub < d.settings.freeDeliveryAbove ? d.settings.deliveryFee : 0;
        return { id: uid('AFC'), type, items, subtotal: sub, deliveryFee: fee, total: sub + fee, customer: cust, status, createdAt: Date.now() - minsAgo * 60000, timeline: [{ status, at: Date.now() - minsAgo * 60000 }] };
      };
      const o1 = mk('delivery', [{ ...pick('m168', 'Steam'), qty: 2 }, pick('m24'), pick('m105')], { name: 'Ramesh Kumar', phone: '9842011223', address: 'Golbazar-3, near bus park', note: 'Extra achaar please', pay: 'cod' }, 'pending', 6);
      const o2 = mk('dinein', [pick('m206'), { ...pick('m72'), qty: 2 }], { name: 'Sita Sharma', phone: '9807111223', table: 'T-5', note: '', pay: 'cod' }, 'preparing', 25);
      const o3 = mk('pickup', [{ ...pick('m190'), qty: 1 }, { ...pick('m227'), qty: 2 }], { name: 'Bikash Yadav', phone: '9815667788', note: '', pay: 'wallet' }, 'completed', 140);
      d.orders.unshift(o1, o2, o3);
      d.bookings.unshift(
        { id: uid('BK'), kind: 'room', roomName: 'Deluxe Double Room', checkin: new Date().toISOString().slice(0, 10), checkout: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10), guests: 2, name: 'Anil Gupta', phone: '9851122334', note: 'Late check-in', status: 'pending', createdAt: Date.now() - 3600000 },
        { id: uid('BK'), kind: 'table', date: new Date().toISOString().slice(0, 10), time: '19:00', guests: 6, name: 'Pooja Singh', phone: '9814332211', note: 'Birthday dinner', status: 'confirmed', createdAt: Date.now() - 7200000 }
      );
    });
    toast('✨ Demo data loaded — check Orders & Bookings', true);
  };

  /* ---------------- real-time sync ---------------- */
  function onExternalChange() {
    db = DB.get();
    // detect new orders placed on the website
    const newOnes = db.orders.filter(o => !knownOrderIds.has(o.id));
    knownOrderIds = new Set(db.orders.map(o => o.id));
    updateBadges();
    renderView(state.view);
    if (newOnes.length) {
      toast(`🔔 New order ${newOnes[0].id} received — ${newOnes[0].customer.name}`, true);
      renderOrders(new Set(newOnes.map(o => o.id)));
    }
  }
  window.addEventListener('storage', e => { if (e.key === AFC_KEY && isLoggedIn()) { DB.load(); onExternalChange(); } });
  window.addEventListener('afc:change', () => { if (isLoggedIn()) { db = DB.get(); knownOrderIds = new Set(db.orders.map(o => o.id)); updateBadges(); renderView(state.view); } });
  window.addEventListener('resize', () => { if (state.view === 'overview' && isLoggedIn()) drawChart(); });

  /* init */
  if (isLoggedIn()) showDash(); else showLogin();
})();
