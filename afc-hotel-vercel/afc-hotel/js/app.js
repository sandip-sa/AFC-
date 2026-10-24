/* ============================================================
   AFC HOTEL — Public site app
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const CART_KEY = 'afc_cart_v1';
  const MY_ORDERS_KEY = 'afc_myorders_v1';

  let db = DB.load();
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  let menuState = { group: 'all', q: '', veg: false };

  /* ---------- toast ---------- */
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    $('#toastStack').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 2600);
  }

  /* ---------- settings -> UI ---------- */
  function applySettings() {
    const s = db.settings;
    document.title = `${s.hotelName} & Restaurant — Golbazar, Siraha`;
    $('#tb-address').textContent = s.address;
    $('#tb-phone').textContent = '📞 ' + s.phone; $('#tb-phone').href = 'tel:' + s.phone.replace(/[^0-9+]/g, '');
    $('#tb-email').textContent = '✉️ ' + s.email; $('#tb-email').href = 'mailto:' + s.email;
    $('#tb-hours').textContent = '🕒 ' + s.hours;
    $('#brand-name').textContent = s.hotelName;
    $('#heroTitle').textContent = s.heroTitle;
    $('#heroSubtitle').textContent = s.heroSubtitle;
    $('#heroNotice').textContent = s.notice || '';
    $('#aboutText').textContent = s.about;
    $('#ctName').textContent = s.hotelName;
    $('#ctTagline').textContent = s.tagline;
    $('#c-address').textContent = s.address;
    $('#cc-address').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address);
    $('#c-phone').textContent = s.phone; $('#cc-phone').href = 'tel:' + s.phone.replace(/[^0-9+]/g, '');
    $('#c-email').textContent = s.email; $('#cc-email').href = 'mailto:' + s.email;
    $('#cc-fb').href = s.facebook;
    $('#c-hours').textContent = s.hours;
    $('#f-name').textContent = s.hotelName;
    $('#f-tagline').textContent = '“' + s.tagline + '”';
    $('#f-address').textContent = s.address;
    $('#f-phone').textContent = '📞 ' + s.phone;
    $('#f-email').textContent = '✉️ ' + s.email;
    $('#f-copy').textContent = `© ${new Date().getFullYear()} ${s.hotelName} & Restaurant · ${s.address}`;
  }

  /* ---------- menu ---------- */
  function menuGroups() {
    const used = new Set(db.menu.map(it => groupOf(db, it.cat)));
    return AFC_GROUPS.filter(g => used.has(g.id));
  }

  function renderGroupChips() {
    const wrap = $('#menuGroups');
    const chips = [`<button class="mg-chip ${menuState.group === 'all' ? 'active' : ''}" data-g="all">✨ All</button>`]
      .concat(menuGroups().map(g =>
        `<button class="mg-chip ${menuState.group === g.id ? 'active' : ''}" data-g="${g.id}">${g.icon} ${g.name}</button>`));
    wrap.innerHTML = chips.join('');
    wrap.querySelectorAll('.mg-chip').forEach(b => b.onclick = () => { menuState.group = b.dataset.g; renderMenu(); renderGroupChips(); });
  }

  function visibleItems() {
    const q = menuState.q.trim().toLowerCase();
    return db.menu.filter(it => {
      if (menuState.group !== 'all' && groupOf(db, it.cat) !== menuState.group) return false;
      if (menuState.veg && !it.veg) return false;
      if (q && !(it.name.toLowerCase().includes(q) || it.cat.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  function renderMenu() {
    const items = visibleItems();
    const list = $('#menuList');
    if (!items.length) {
      list.innerHTML = `<div class="menu-empty">😕 No dishes match your search. Try something else!</div>`;
      return;
    }
    // group by category, keeping order
    const cats = [];
    items.forEach(it => { if (!cats.includes(it.cat)) cats.push(it.cat); });
    list.innerHTML = cats.map(cat => {
      const cards = items.filter(it => it.cat === cat).map(dishCard).join('');
      const g = AFC_GROUPS.find(x => x.id === groupOf(db, cat));
      return `<div class="menu-cat">
        <div class="menu-cat-head"><h3>${esc(cat)}</h3><span>${g ? g.icon + ' ' + g.name : ''}</span></div>
        <div class="menu-grid">${cards}</div></div>`;
    }).join('');

    list.querySelectorAll('.add-btn').forEach(btn => btn.onclick = () => {
      const it = db.menu.find(x => x.id === btn.dataset.id);
      if (!it) return;
      const sel = btn.closest('.dish').querySelector('.dish-variant');
      addToCart(it, sel ? sel.value : null);
    });
    list.querySelectorAll('.dish-variant').forEach(sel => sel.onchange = () => {
      const it = db.menu.find(x => x.id === sel.dataset.id);
      const priceEl = sel.closest('.dish').querySelector('.dish-price b');
      if (it && priceEl) priceEl.textContent = fmtRs(itemPrice(it, sel.value));
    });
  }

  function dishCard(it) {
    const price = it.variants ? it.variants[0].price : it.price;
    return `<div class="dish ${it.available ? '' : 'unavailable'}">
      ${it.popular ? '<span class="dish-badge">★ Popular</span>' : ''}
      <div class="dish-top">
        <div class="dish-name">${esc(it.name)}</div>
        <span class="dish-dot ${it.veg ? 'veg' : 'nonveg'}" title="${it.veg ? 'Vegetarian' : 'Non-veg'}"></span>
      </div>
      ${it.desc ? `<div class="dish-desc">${esc(it.desc)}</div>` : ''}
      ${it.variants ? `<select class="dish-variant" data-id="${it.id}" ${it.available ? '' : 'disabled'}>
          ${it.variants.map(vrb => `<option value="${esc(vrb.label)}">${esc(vrb.label)} — ${fmtRs(vrb.price)}</option>`).join('')}</select>` : ''}
      <div class="dish-foot">
        <span class="dish-price"><b>${fmtRs(price)}</b></span>
        <button class="add-btn" data-id="${it.id}" ${it.available ? '' : 'disabled'}>${it.available ? '+ Add' : 'Unavailable'}</button>
      </div>
    </div>`;
  }

  /* ---------- cart ---------- */
  const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  function addToCart(it, variantLabel) {
    const label = it.variants ? (variantLabel || it.variants[0].label) : null;
    const key = it.id + '|' + (label || '');
    const found = cart.find(c => c.key === key);
    if (found) found.qty++;
    else cart.push({ key, id: it.id, name: it.name, label, price: itemPrice(it, label), qty: 1 });
    saveCart(); renderCart();
    toast(`✓ ${it.name}${label ? ' (' + label + ')' : ''} added to order`);
  }

  function cartTotals(orderType) {
    const sub = cart.reduce((a, c) => a + c.price * c.qty, 0);
    let fee = 0;
    if (orderType === 'delivery' && sub > 0) {
      fee = sub >= db.settings.freeDeliveryAbove ? 0 : Number(db.settings.deliveryFee || 0);
    }
    return { sub, fee, total: sub + fee };
  }

  function renderCart() {
    const body = $('#cartBody'), foot = $('#cartFoot');
    const count = cart.reduce((a, c) => a + c.qty, 0);
    $('#cartCount').textContent = count;
    if (!cart.length) {
      body.innerHTML = `<div class="cd-empty"><span>🛍️</span>Your order is empty.<br>Add something delicious from the menu!</div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = cart.map(c => `
      <div class="ci">
        <div class="ci-info">
          <b>${esc(c.name)}</b>
          ${c.label ? `<small>${esc(c.label)}</small>` : ''}
          <span class="ci-price">${fmtRs(c.price)} × ${c.qty}</span>
        </div>
        <div class="ci-qty">
          <button data-act="dec" data-key="${esc(c.key)}">−</button>
          <span>${c.qty}</span>
          <button data-act="inc" data-key="${esc(c.key)}">+</button>
        </div>
        <button class="ci-rm" data-act="rm" data-key="${esc(c.key)}">🗑</button>
      </div>`).join('');

    const t = cartTotals(currentOrderType());
    foot.innerHTML = `
      <div class="cd-line"><span>Subtotal</span><span>${fmtRs(t.sub)}</span></div>
      <div class="cd-line"><span>Delivery fee</span>${t.fee === 0 && currentOrderType() === 'delivery'
        ? '<span class="free">FREE 🎉</span>' : `<span>${fmtRs(t.fee)}</span>`}</div>
      <div class="cd-line total"><span>Total</span><span>${fmtRs(t.total)}</span></div>
      ${t.sub < db.settings.freeDeliveryAbove && currentOrderType() === 'delivery'
        ? `<div class="cd-line"><small>Add ${fmtRs(db.settings.freeDeliveryAbove - t.sub)} more for free delivery</small></div>` : ''}
      <button class="btn btn-gold btn-block" id="checkoutBtn" style="margin-top:6px">Proceed to Checkout →</button>`;

    body.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
      const item = cart.find(c => c.key === b.dataset.key);
      if (!item) return;
      if (b.dataset.act === 'inc') item.qty++;
      if (b.dataset.act === 'dec') item.qty = Math.max(0, item.qty - 1);
      if (b.dataset.act === 'rm' || item.qty === 0) cart = cart.filter(c => c.key !== b.dataset.key);
      saveCart(); renderCart();
    });
    const cb = $('#checkoutBtn');
    if (cb) cb.onclick = openCheckout;
  }

  /* ---------- drawer ---------- */
  const openDrawer = () => { $('#cartDrawer').classList.add('open'); $('#drawerVeil').classList.add('open'); };
  const closeDrawer = () => { $('#cartDrawer').classList.remove('open'); $('#drawerVeil').classList.remove('open'); };
  $('#cartBtn').onclick = openDrawer;
  $('#cartClose').onclick = closeDrawer;
  $('#drawerVeil').onclick = closeDrawer;

  /* ---------- checkout ---------- */
  const currentOrderType = () => (document.querySelector('input[name="otype"]:checked') || {}).value || 'delivery';

  function openCheckout() {
    if (!cart.length) return;
    updateCheckoutTotal();
    $('#checkoutVeil').classList.add('open');
  }
  function updateCheckoutTotal() {
    const t = cartTotals(currentOrderType());
    $('#coTotal').innerHTML = `
      <div><span>Subtotal</span><span>${fmtRs(t.sub)}</span></div>
      <div><span>Delivery fee</span><span>${t.fee ? fmtRs(t.fee) : 'FREE'}</span></div>
      <div class="tt"><span>Total to pay</span><span>${fmtRs(t.total)}</span></div>`;
    $('#co-address-wrap').classList.toggle('hidden', currentOrderType() === 'dinein' || currentOrderType() === 'pickup');
    $('#co-table-wrap').classList.toggle('hidden', currentOrderType() !== 'dinein');
    $('#co-address').required = currentOrderType() === 'delivery';
  }
  $$('input[name="otype"]').forEach(r => r.onchange = updateCheckoutTotal);
  $$('[data-close]').forEach(b => b.onclick = () => $('#' + b.dataset.close).classList.remove('open'));
  $$('.modal-veil').forEach(v => v.addEventListener('click', e => { if (e.target === v) v.classList.remove('open'); }));

  $('#checkoutForm').onsubmit = e => {
    e.preventDefault();
    if (!cart.length) return;
    const type = currentOrderType();
    const t = cartTotals(type);
    const order = {
      id: uid('AFC'),
      type,
      items: cart.map(c => ({ id: c.id, name: c.name, label: c.label, price: c.price, qty: c.qty })),
      subtotal: t.sub, deliveryFee: t.fee, total: t.total,
      customer: {
        name: $('#co-name').value.trim(),
        phone: $('#co-phone').value.trim(),
        address: type === 'delivery' ? $('#co-address').value.trim() : '',
        table: type === 'dinein' ? $('#co-table').value.trim() : '',
        note: $('#co-note').value.trim(),
        pay: (document.querySelector('input[name="pay"]:checked') || {}).value || 'cod',
      },
      status: 'pending',
      createdAt: Date.now(),
      timeline: [{ status: 'pending', at: Date.now() }],
    };
    DB.update(d => d.orders.unshift(order));
    // remember my orders
    const mine = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]');
    mine.unshift(order.id);
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(mine.slice(0, 8)));

    cart = []; saveCart(); renderCart();
    closeDrawer();
    $('#checkoutVeil').classList.remove('open');
    e.target.reset(); updateCheckoutTotal();
    showSuccess('Order placed! 🎉',
      type === 'delivery' ? 'Your food is being prepared. We’ll call you to confirm delivery.' :
      type === 'pickup' ? 'Your order will be ready for pickup. We’ll call to confirm.' :
      'Show this order ID at your table. Our staff will confirm shortly.',
      order.id, true);
    $('#trackInput').value = order.id;
    renderTrack(order.id);
    renderRecentOrders();
  };

  function showSuccess(title, text, refId, isOrder) {
    $('#successTitle').textContent = title;
    $('#successText').textContent = text;
    $('#successId').textContent = refId;
    $('#successActions').innerHTML = isOrder
      ? `<a class="btn btn-gold" href="#track" onclick="document.getElementById('successVeil').classList.remove('open')">Track Order</a>
         <button class="btn btn-ghost" onclick="document.getElementById('successVeil').classList.remove('open')">Close</button>`
      : `<button class="btn btn-gold" onclick="document.getElementById('successVeil').classList.remove('open')">Done</button>`;
    $('#successVeil').classList.add('open');
  }

  /* ---------- booking: rooms ---------- */
  function renderRooms() {
    const grid = $('#roomGrid');
    const rooms = db.rooms.filter(r => r.available);
    grid.innerHTML = rooms.map(r => `
      <div class="room-card" data-room="${r.id}">
        <h4>${esc(r.name)} ${r.popular ? '<span class="rc-pop">POPULAR</span>' : ''}
          <b>${fmtRs(r.price)}<small> /night</small></b></h4>
        <p>${esc(r.desc || '')}</p>
        <div class="rc-meta"><span>👤 Up to ${r.capacity} guests</span><span>✔ Free Wi-Fi</span><span>✔ Hot water</span></div>
      </div>`).join('') || '<p style="color:var(--mut)">No rooms available right now.</p>';

    const sel = $('#bf-room');
    sel.innerHTML = rooms.map(r => `<option value="${r.id}">${esc(r.name)} — ${fmtRs(r.price)}/night</option>`).join('');
    grid.querySelectorAll('.room-card').forEach(card => card.onclick = () => {
      grid.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      sel.value = card.dataset.room;
      updateRoomSummary();
    });
    if (grid.querySelector('.room-card')) grid.querySelector('.room-card').click();
  }

  function updateRoomSummary() {
    const r = db.rooms.find(x => x.id === $('#bf-room').value);
    const ci = $('#bf-checkin').value, co = $('#bf-checkout').value;
    const box = $('#roomSummary');
    if (!r || !ci || !co) { box.classList.remove('show'); return; }
    const nights = Math.round((new Date(co) - new Date(ci)) / 86400000);
    if (nights <= 0) { box.classList.remove('show'); return; }
    box.classList.add('show');
    box.innerHTML = `🛏️ <b>${esc(r.name)}</b> · ${nights} night${nights > 1 ? 's' : ''} · Estimated total: <b>${fmtRs(nights * r.price)}</b> <small>(pay at hotel)</small>`;
  }
  ['#bf-room', '#bf-checkin', '#bf-checkout'].forEach(s => { const el = $(s); if (el) el.onchange = updateRoomSummary; });

  $('#roomForm').onsubmit = e => {
    e.preventDefault();
    const r = db.rooms.find(x => x.id === $('#bf-room').value);
    const booking = {
      id: uid('BK'), kind: 'room',
      roomName: r ? r.name : 'Room',
      checkin: $('#bf-checkin').value, checkout: $('#bf-checkout').value,
      guests: $('#bf-guests').value,
      name: $('#bf-name').value.trim(), phone: $('#bf-phone').value.trim(),
      note: $('#bf-note').value.trim(),
      status: 'pending', createdAt: Date.now(),
    };
    DB.update(d => d.bookings.unshift(booking));
    e.target.reset(); renderRooms(); setMinDates();
    showSuccess('Booking requested! 🛏️', 'We have received your room booking request and will call you shortly to confirm.', booking.id, false);
  };

  $('#tableForm').onsubmit = e => {
    e.preventDefault();
    const booking = {
      id: uid('BK'), kind: 'table',
      date: $('#tf-date').value, time: $('#tf-time').value,
      guests: $('#tf-guests').value,
      name: $('#tf-name').value.trim(), phone: $('#tf-phone').value.trim(),
      note: $('#tf-note').value.trim(),
      status: 'pending', createdAt: Date.now(),
    };
    DB.update(d => d.bookings.unshift(booking));
    e.target.reset(); setMinDates();
    showSuccess('Table reserved! 🍽️', 'Your table request has been received. We’ll confirm by phone soon.', booking.id, false);
  };

  /* booking tabs */
  $$('.bk-tab').forEach(t => t.onclick = () => {
    $$('.bk-tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $$('.bk-panel').forEach(p => p.classList.remove('active'));
    $('#panel-' + t.dataset.tab).classList.add('active');
  });

  function setMinDates() {
    const today = new Date().toISOString().slice(0, 10);
    ['#bf-checkin', '#bf-checkout', '#tf-date'].forEach(s => { const el = $(s); if (el) el.min = today; });
    if (!$('#bf-checkin').value) $('#bf-checkin').value = today;
    if (!$('#bf-checkout').value) { const d = new Date(); d.setDate(d.getDate() + 1); $('#bf-checkout').value = d.toISOString().slice(0, 10); }
    if (!$('#tf-date').value) $('#tf-date').value = today;
    updateRoomSummary();
  }

  /* ---------- tracking ---------- */
  const FLOW = {
    delivery: [['pending', 'Order received', 'Waiting for kitchen confirmation'],
      ['accepted', 'Order accepted', 'Kitchen confirmed your order'],
      ['preparing', 'Being prepared', 'Our chefs are cooking your food'],
      ['out', 'Out for delivery', 'Rider is on the way with your order'],
      ['completed', 'Delivered', 'Enjoy your meal! 🍽️']],
    pickup: [['pending', 'Order received', 'Waiting for kitchen confirmation'],
      ['accepted', 'Order accepted', 'Kitchen confirmed your order'],
      ['preparing', 'Being prepared', 'Our chefs are cooking your food'],
      ['ready', 'Ready for pickup', 'Come and grab your order!'],
      ['completed', 'Picked up', 'Enjoy your meal! 🍽️']],
    dinein: [['pending', 'Order received', 'Waiting for confirmation'],
      ['accepted', 'Order accepted', 'Kitchen confirmed your order'],
      ['preparing', 'Being prepared', 'Our chefs are cooking your food'],
      ['ready', 'Served at table', 'Your food is being served'],
      ['completed', 'Completed', 'Thank you for dining with us! 🍽️']],
  };
  const STATUS_LABEL = { pending: 'Pending', accepted: 'Accepted', preparing: 'Preparing', out: 'Out for delivery', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };

  function renderRecentOrders() {
    const mine = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]');
    const wrap = $('#trackRecent');
    wrap.innerHTML = mine.length
      ? '<span style="color:var(--mut);font-size:13px;align-self:center">Your orders:</span> ' +
        mine.map(id => `<button class="tr-chip" data-id="${esc(id)}">${esc(id)}</button>`).join('')
      : '';
    wrap.querySelectorAll('.tr-chip').forEach(c => c.onclick = () => { $('#trackInput').value = c.dataset.id; renderTrack(c.dataset.id); });
  }

  function renderTrack(id) {
    const box = $('#trackResult');
    const order = db.orders.find(o => o.id.toUpperCase() === String(id || '').trim().toUpperCase());
    if (!id) { box.innerHTML = ''; return; }
    if (!order) {
      box.innerHTML = `<div class="tr-card" style="text-align:center;color:var(--mut)">❌ No order found with ID <b style="color:var(--gold2)">${esc(id)}</b>.<br>Please check the ID and try again.</div>`;
      return;
    }
    if (order.status === 'cancelled') {
      box.innerHTML = `<div class="tr-card"><div class="tr-head"><div><b>${esc(order.id)}</b><br><span style="color:var(--mut);font-size:13px">${new Date(order.createdAt).toLocaleString()}</span></div>
        <span class="status-pill st-cancelled">Cancelled</span></div>
        <p style="color:var(--mut)">This order was cancelled. Please call ${esc(db.settings.phone)} for help.</p></div>`;
      return;
    }
    const flow = FLOW[order.type] || FLOW.delivery;
    const idx = flow.findIndex(f => f[0] === order.status);
    const typeIcon = { delivery: '🛵 Delivery', pickup: '🥡 Takeaway', dinein: '🍽️ Dine-in' }[order.type] || order.type;
    box.innerHTML = `<div class="tr-card">
      <div class="tr-head">
        <div><b>${esc(order.id)}</b><br>
          <span style="color:var(--mut);font-size:13px">${typeIcon} · ${new Date(order.createdAt).toLocaleString()} · <span class="live-badge">LIVE</span></span></div>
        <span class="status-pill st-${order.status === 'out' ? 'out' : order.status}">${STATUS_LABEL[order.status] || order.status}</span>
      </div>
      <div class="tr-items">
        ${order.items.map(i => `<div><span>${i.qty} × ${esc(i.name)}${i.label ? ' (' + esc(i.label) + ')' : ''}</span><span>${fmtRs(i.price * i.qty)}</span></div>`).join('')}
        ${order.deliveryFee ? `<div><span>Delivery fee</span><span>${fmtRs(order.deliveryFee)}</span></div>` : ''}
        <div class="tr-total"><span>Total</span><span>${fmtRs(order.total)}</span></div>
      </div>
      <div class="timeline">
        ${flow.map((f, i) => {
          const cls = i < idx ? 'done' : i === idx ? 'active' : 'future';
          const t = (order.timeline || []).find(x => x.status === f[0]);
          return `<div class="tl-step ${cls} ${i < idx ? 'done' : ''}">
            <div class="tl-dot">✓</div>
            <div><b>${f[1]}</b><span>${f[2]}${t ? ' · ' + new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span></div>
          </div>`;
        }).join('')}
      </div></div>`;
  }
  $('#trackBtn').onclick = () => renderTrack($('#trackInput').value);
  $('#trackInput').addEventListener('keydown', e => { if (e.key === 'Enter') renderTrack(e.target.value); });

  /* ---------- real-time sync ---------- */
  function refreshAll() {
    db = DB.get();
    applySettings();
    renderGroupChips();
    renderMenu();
    renderRooms();
    renderCart();
    if ($('#trackInput').value) renderTrack($('#trackInput').value);
  }
  window.addEventListener('storage', e => { if (e.key === AFC_KEY) { DB.load(); refreshAll(); } });
  window.addEventListener('afc:change', refreshAll);

  /* ---------- misc UI ---------- */
  $('#menuSearch').addEventListener('input', e => { menuState.q = e.target.value; renderMenu(); });
  $('#vegOnly').onchange = e => { menuState.veg = e.target.checked; renderMenu(); };
  $('#hamburger').onclick = () => $('#navLinks').classList.toggle('open');
  $$('#navLinks a').forEach(a => a.onclick = () => $('#navLinks').classList.remove('open'));

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* init */
  applySettings();
  renderGroupChips();
  renderMenu();
  renderRooms();
  renderCart();
  setMinDates();
  renderRecentOrders();
  updateCheckoutTotal();
})();
