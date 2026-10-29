/* Eventum Horas — funciones SIN INTERNET.
   Sin conexión se puede: marcar entrada/salida, ver la programación (la última que se cargó), comentar eventos,
   pedir días libres y solicitar viáticos. Todo se guarda en el celular y se envía solo cuando vuelve el internet
   y se abre la app. El servidor revisa el PIN y las reglas de siempre. */
(function () {
  'use strict';
  var K_COLA = 'ehOffCola', K_NOM = 'ehOffNombres', K_PROG = 'ehOffProg';
  var MAX_COLA = 30;

  function leer(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function cola() { return leer(K_COLA, []); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hora(ts) { var d = new Date(ts), h = d.getHours(), m = ('0' + d.getMinutes()).slice(-2); return ((h % 12) || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function hoyTxt(ts) { var d = new Date(ts); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  // ---------- Estilos ----------
  var css = document.createElement('style');
  css.textContent =
    '#off{position:fixed;inset:0;z-index:20;background:radial-gradient(90% 60% at 20% 0%,rgba(238,75,34,.28),transparent 60%),radial-gradient(90% 60% at 90% 100%,rgba(91,62,153,.45),transparent 60%),#0b0a14;color:#f5f3fb;overflow:auto;-webkit-overflow-scrolling:touch;font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#off[hidden]{display:none}' +
    '#off .w{max-width:460px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top,0px)) 16px calc(28px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:14px}' +
    '#off .eb{font:800 12px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#f39c1f;margin:0}' +
    '#off h2{margin:0;font:800 26px/1.15 system-ui}' +
    '#off .mu{color:#aaa4c4;font-size:14px;margin:0}' +
    '#off .band{background:rgba(243,156,31,.14);border:1px solid rgba(243,156,31,.45);border-radius:14px;padding:10px 12px;font-size:14px;color:#ffd9a8}' +
    '#off .it{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:rgba(28,24,52,.9);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;color:#fff;font:600 16px system-ui;cursor:pointer}' +
    '#off .it small{display:block;color:#aaa4c4;font-weight:400;font-size:13px}' +
    '#off .av{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font:800 14px system-ui;background:linear-gradient(135deg,#ee4b22,#f07022);flex:0 0 auto}' +
    '#off .btn{width:100%;border:0;border-radius:16px;padding:16px;font:800 17px system-ui;color:#fff;background:linear-gradient(135deg,#ee4b22,#f07022);cursor:pointer}' +
    '#off .btn[disabled]{opacity:.45}' +
    '#off .sec{background:rgba(255,255,255,.1)}' +
    '#off .lnk{background:none;border:0;color:#aaa4c4;font:600 15px system-ui;padding:8px;cursor:pointer}' +
    '#off .tg{display:flex;gap:10px}' +
    '#off .tg button{flex:1;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font:800 16px system-ui;padding:14px;cursor:pointer}' +
    '#off .tg button[aria-pressed="true"]{background:linear-gradient(135deg,#5b3e99,#9d87c0);border-color:transparent}' +
    '#off label{display:flex;flex-direction:column;gap:6px;font-size:14px;color:#ddd6f0}' +
    '#off input[type=text],#off input[type=password]{font:600 17px system-ui;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff}' +
    '#off .ph{display:flex;align-items:center;gap:12px}' +
    '#off .ph img{width:64px;height:64px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.2)}' +
    '#off .err{color:#ffb199;font-size:14px;min-height:1em;margin:0}' +
    '#off .ok{font-size:56px;text-align:center}' +
    '#offPend{position:fixed;left:12px;right:12px;top:calc(10px + env(safe-area-inset-top,0px));z-index:15;background:rgba(28,24,52,.96);border:1px solid rgba(243,156,31,.5);color:#ffd9a8;border-radius:14px;padding:10px 14px;font:600 14px system-ui;display:none;box-shadow:0 10px 30px rgba(0,0,0,.45)}' +
    '#offPend.ver{display:block}' +
    '#off input[type=date],#off input[type=time],#off input[type=number],#off select,#off textarea{font:600 16px system-ui;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;color-scheme:dark}' +
    '#off textarea{min-height:90px;resize:vertical}' +
    '#off .dos{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '#off .card{background:rgba(28,24,52,.9);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:6px}' +
    '#off .card b{font-size:17px}' +
    '#off .ev{border-left:4px solid #41d69a}' +
    '#off .chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '#off .chips button{border-radius:99px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font:700 14px system-ui;padding:9px 14px;cursor:pointer}' +
    '#off .chips button[aria-pressed="true"]{background:linear-gradient(135deg,#5b3e99,#9d87c0);border-color:transparent}' +
    '#off input,#off textarea,#off select{box-sizing:border-box;min-width:0;width:100%}' +
    '#off .pj{display:grid;grid-template-columns:1fr 96px 40px;gap:8px;align-items:center;margin-bottom:8px}' +
    '#off .x{background:rgba(255,255,255,.08);border:0;color:#fff;border-radius:10px;height:44px;font-size:20px;cursor:pointer}' +
    '#offBtn{margin-top:10px;font:700 15px system-ui;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:12px 18px;background:rgba(255,255,255,.08);cursor:pointer}';
  document.head.appendChild(css);

  var off = document.createElement('div'); off.id = 'off'; off.hidden = true; document.body.appendChild(off);
  var pend = document.createElement('div'); pend.id = 'offPend'; document.body.appendChild(pend);

  function aviso(txt, ms) {
    pend.textContent = txt; pend.classList.add('ver');
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { pend.classList.remove('ver'); pintarPendientes(); }, ms || 6000);
  }
  function pintarPendientes() {
    var n = cola().length;
    if (n && !pend.classList.contains('ver')) { pend.textContent = n === 1 ? '1 envío sin conexión pendiente' : n + ' envíos sin conexión pendientes'; pend.classList.add('ver'); }
    if (!n && !aviso.t) pend.classList.remove('ver');
  }

  // ---------- Pantallas ----------
  function cerrar() { off.hidden = true; off.innerHTML = ''; }

  function pantallaNombres() {
    var lista = leer(K_NOM, []);
    var h = '<div class="w"><p class="eb">Sin internet</p><h2>Usar sin conexión</h2>' +
      '<div class="band">Lo que hagas aquí se guarda en este celular y se envía solo cuando vuelvas a tener internet y abras la app.</div>';
    if (!lista.length) {
      h += '<p class="mu">Para usar esta opción, abre la app una vez con internet en este celular.</p>';
    } else {
      h += '<p class="mu">Toca tu nombre.</p>';
      lista.forEach(function (c, i) {
        var ini = String(c.nombre).split(' ').map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase();
        h += '<button class="it" data-i="' + i + '"><span class="av">' + esc(ini) + '</span><span>' + esc(c.nombre) + '<small>' + esc(c.puesto || '') + '</small></span></button>';
      });
    }
    h += '<button class="lnk" id="offVolver">Volver a intentar con internet</button></div>';
    off.innerHTML = h; off.hidden = false; off.scrollTop = 0;
    off.querySelectorAll('.it').forEach(function (b) { b.onclick = function () { pantallaMenu(lista[Number(b.dataset.i)].nombre); }; });
    document.getElementById('offVolver').onclick = function () { cerrar(); if (window.abrir) window.abrir(); };
  }

  function pantallaMarcar(nombre) {
    var ultimo = null;
    cola().forEach(function (it) { if (it.nombre === nombre && hoyTxt(it.ts) === hoyTxt(Date.now())) ultimo = it.tipo; });
    var f = { tipo: ultimo === 'entrada' ? 'salida' : 'entrada', foto: '', ubic: null };
    off.innerHTML = '<div class="w"><p class="eb">Sin internet</p><h2>' + esc(nombre) + '</h2>' +
      '<label>Tu PIN<input type="password" id="offPin" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 números"></label>' +
      '<div class="tg"><button id="offE">Entrada</button><button id="offS">Salida</button></div>' +
      '<label>Evento, lugar o actividad<input type="text" id="offEv" maxlength="200" placeholder="Opcional"></label>' +
      '<div class="ph"><button class="btn sec" id="offFotoB" style="flex:1">Tomar foto</button><img id="offImg" alt="" hidden></div>' +
      '<input type="file" id="offFile" accept="image/*" capture="user" hidden>' +
      '<p class="mu" id="offUbi">Buscando tu ubicación…</p>' +
      '<p class="err" id="offErr"></p>' +
      '<button class="btn" id="offOk" disabled>Guardar marcación</button>' +
      '<button class="lnk" id="offAtras">&#8249; Volver</button></div>';
    off.scrollTop = 0;
    var bE = document.getElementById('offE'), bS = document.getElementById('offS'), ok = document.getElementById('offOk'), err = document.getElementById('offErr');
    function tipo(t) { f.tipo = t; bE.setAttribute('aria-pressed', t === 'entrada'); bS.setAttribute('aria-pressed', t === 'salida'); }
    tipo(f.tipo);
    bE.onclick = function () { tipo('entrada'); }; bS.onclick = function () { tipo('salida'); };
    function listo() { ok.disabled = !(f.foto && f.ubic); }
    document.getElementById('offAtras').onclick = function () { pantallaMenu(nombre); };
    document.getElementById('offFotoB').onclick = function () { document.getElementById('offFile').click(); };
    document.getElementById('offFile').onchange = function (e) {
      var file = e.target.files && e.target.files[0]; if (!file) return;
      err.textContent = 'Preparando foto…';
      comprimir(file, function (dataUrl) {
        if (!dataUrl) { err.textContent = 'No se pudo leer la foto. Tómala otra vez.'; return; }
        f.foto = dataUrl; err.textContent = '';
        var img = document.getElementById('offImg'); img.src = dataUrl; img.hidden = false;
        document.getElementById('offFotoB').textContent = 'Cambiar foto';
        listo();
      });
    };
    function ubicar() {
      var el = document.getElementById('offUbi');
      if (!navigator.geolocation) { el.textContent = 'Este celular no permite ubicación.'; return; }
      el.textContent = 'Buscando tu ubicación… (activa el GPS)';
      navigator.geolocation.getCurrentPosition(function (p) {
        f.ubic = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy) };
        el.textContent = 'Ubicación lista (±' + f.ubic.acc + ' m)'; listo();
      }, function () {
        el.innerHTML = 'No se pudo obtener tu ubicación. Activa el GPS y permite la ubicación. <button class="lnk" id="offReubi" style="padding:0">Intentar de nuevo</button>';
        var r = document.getElementById('offReubi'); if (r) r.onclick = ubicar;
      }, { enableHighAccuracy: true, timeout: 45000, maximumAge: 60000 });
    }
    ubicar();
    ok.onclick = function () {
      var pin = String(document.getElementById('offPin').value || '').trim();
      if (!/^\d{4}$/.test(pin)) { err.textContent = 'Escribe tu PIN de 4 números.'; return; }
      var q = cola();
      if (q.length >= MAX_COLA) { err.textContent = 'Hay demasiadas marcaciones guardadas. Conéctate a internet para enviarlas.'; return; }
      var it = { k: 'marca', id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), nombre: nombre, pin: pin, tipo: f.tipo, ts: Date.now(),
                 evento: String(document.getElementById('offEv').value || '').trim().slice(0, 200), foto: f.foto, ubic: f.ubic };
      q.push(it);
      if (!escribir(K_COLA, q)) { err.textContent = 'El celular no tiene espacio para guardar la foto. Libera espacio e inténtalo otra vez.'; return; }
      off.innerHTML = '<div class="w" style="text-align:center;padding-top:18vh"><div class="ok">&#10003;</div><p class="eb">Guardada sin conexión</p>' +
        '<h2>' + (f.tipo === 'entrada' ? 'Entrada' : 'Salida') + ' ' + hora(it.ts) + '</h2>' +
        '<p class="mu">Se enviará sola cuando tengas internet y abras la app. Si el PIN no es correcto, no se aceptará.</p>' +
        '<button class="btn sec" id="offFin" style="margin-top:12px">Listo</button></div>';
      document.getElementById('offFin').onclick = function () { pantallaMenu(nombre); };
      pintarPendientes();
    };
  }


  // ---------- Menú y demás funciones sin conexión ----------
  function nuevoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function guardarEnCola(it, err) {
    var q = cola();
    if (q.length >= MAX_COLA) { err.textContent = 'Hay demasiados envíos guardados. Conéctate a internet para enviarlos.'; return false; }
    q.push(it);
    if (!escribir(K_COLA, q)) { err.textContent = 'El celular no tiene espacio para guardar esto. Libera espacio e inténtalo otra vez.'; return false; }
    pintarPendientes(); return true;
  }
  function listoGuardado(nombre, titulo, detalle) {
    off.innerHTML = '<div class="w" style="text-align:center;padding-top:18vh"><div class="ok">&#10003;</div><p class="eb">Guardado sin conexión</p>' +
      '<h2>' + esc(titulo) + '</h2><p class="mu">' + esc(detalle || 'Se enviará solo cuando tengas internet y abras la app. Si el PIN no es correcto, no se aceptará.') + '</p>' +
      '<button class="btn sec" id="offFin" style="margin-top:12px">Listo</button></div>';
    off.scrollTop = 0;
    document.getElementById('offFin').onclick = function () { pantallaMenu(nombre); };
  }
  function pinOk(err) {
    var pin = String((document.getElementById('offPin') || {}).value || '').trim();
    if (!/^\d{4}$/.test(pin)) { err.textContent = 'Escribe tu PIN de 4 números.'; return ''; }
    return pin;
  }
  var CAMPO_PIN = '<label>Tu PIN<input type="password" id="offPin" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 números"></label>';
  function hoyISO() { return hoyTxt(Date.now()); }
  function progDe(nombre) { var p = leer(K_PROG, {}); return p[nombre] || null; }

  function pantallaMenu(nombre) {
    var p = progDe(nombre), mios = cola().filter(function (x) { return x.nombre === nombre; }).length;
    off.innerHTML = '<div class="w"><p class="eb">Sin internet</p><h2>' + esc(nombre) + '</h2>' +
      (mios ? '<div class="band">Tienes ' + mios + (mios === 1 ? ' envío guardado' : ' envíos guardados') + ' esperando internet.</div>' : '') +
      '<button class="it" id="mM"><span class="av">&#9201;</span><span>Marcar entrada o salida<small>Con foto y ubicación</small></span></button>' +
      '<button class="it" id="mP"><span class="av">&#128197;</span><span>Programación de eventos<small>' + (p ? 'La última que se cargó · ' + fechaHora(p.ts) : 'Ábrela una vez con internet para verla aquí') + '</small></span></button>' +
      '<button class="it" id="mA"><span class="av">&#127796;</span><span>Pedir día libre<small>Compensatorio, vacaciones, incapacidad o permiso</small></span></button>' +
      '<button class="it" id="mV"><span class="av">&#9992;</span><span>Solicitar viático<small>Alimentación y peajes de tu viaje</small></span></button>' +
      '<button class="lnk" id="mC">Cambiar de persona</button><button class="lnk" id="offVolver">Volver a intentar con internet</button></div>';
    off.hidden = false; off.scrollTop = 0;
    document.getElementById('mM').onclick = function () { pantallaMarcar(nombre); };
    document.getElementById('mP').onclick = function () { if (progDe(nombre)) pantallaProg(nombre); };
    document.getElementById('mA').onclick = function () { pantallaAus(nombre); };
    document.getElementById('mV').onclick = function () { pantallaVia(nombre); };
    document.getElementById('mC').onclick = pantallaNombres;
    document.getElementById('offVolver').onclick = function () { cerrar(); if (window.abrir) window.abrir(); };
  }
  function fechaHora(ts) { var d = new Date(ts); return d.getDate() + '/' + (d.getMonth() + 1) + ' ' + hora(ts); }

  function pantallaProg(nombre) {
    var p = progDe(nombre); if (!p) { pantallaMenu(nombre); return; }
    var hoy = hoyISO(), ev = (p.eventos || []).slice();
    ev.sort(function (a, b) { return String(a.ini).localeCompare(String(b.ini)); });
    var h = '<div class="w"><p class="eb">Sin internet</p><h2>Programación</h2><p class="mu">La última que se cargó: ' + esc(fechaHora(p.ts)) + '. Puede haber cambios que todavía no ves.</p>';
    if (!ev.length) h += '<p class="mu">No hay eventos guardados.</p>';
    ev.forEach(function (e, i) {
      h += '<button class="it ev" data-i="' + i + '" style="border-left-color:' + esc(e.color || '#41d69a') + '"><span>' + esc(e.titulo) +
        '<small>' + esc(e.fechaTxt || '') + (e.hora ? ' · ' + esc(e.hora) : '') + ' · ' + esc(e.ciudad || '') + (e.estado ? ' · ' + esc(e.estado) : '') + (e.mio ? ' · Asignado' : '') + '</small></span></button>';
    });
    h += '<button class="lnk" id="pV">&#8249; Volver</button></div>';
    off.innerHTML = h; off.scrollTop = 0;
    off.querySelectorAll('.ev').forEach(function (b) { b.onclick = function () { pantallaEv(nombre, ev[Number(b.dataset.i)]); }; });
    document.getElementById('pV').onclick = function () { pantallaMenu(nombre); };
  }

  function pantallaEv(nombre, e) {
    var foto = '';
    off.innerHTML = '<div class="w"><p class="eb">Evento · sin internet</p><h2>' + esc(e.titulo) + '</h2>' +
      '<div class="card"><span>' + esc(e.fechaTxt || '') + (e.hora ? ' · ' + esc(e.hora) : '') + '</span>' + (e.lugar ? '<span>' + esc(e.lugar) + '</span>' : '') +
      '<span class="mu">' + esc(e.ciudad || '') + (e.estado ? ' · ' + esc(e.estado) : '') + '</span>' +
      (e.notas ? '<p class="mu" style="white-space:pre-wrap">' + esc(e.notas) + '</p>' : '') + '</div>' +
      '<div class="card"><b>Comentar</b>' + CAMPO_PIN +
      '<label>Comentario<textarea id="cT" maxlength="1000" placeholder="Escribe un comentario para el equipo..."></textarea></label>' +
      '<div class="ph"><button class="btn sec" id="cFB" style="flex:1">Agregar foto</button><img id="cImg" alt="" hidden></div>' +
      '<input type="file" id="cF" accept="image/*" hidden><p class="err" id="cE"></p>' +
      '<button class="btn" id="cOk">Guardar comentario</button></div>' +
      '<button class="lnk" id="eV">&#8249; Volver a la programación</button></div>';
    off.scrollTop = 0;
    var err = document.getElementById('cE');
    document.getElementById('eV').onclick = function () { pantallaProg(nombre); };
    document.getElementById('cFB').onclick = function () { document.getElementById('cF').click(); };
    document.getElementById('cF').onchange = function (ev) {
      var f = ev.target.files && ev.target.files[0]; if (!f) return;
      comprimir(f, function (d) { if (!d) { err.textContent = 'No se pudo leer la foto.'; return; } foto = d; var im = document.getElementById('cImg'); im.src = d; im.hidden = false; document.getElementById('cFB').textContent = 'Cambiar foto'; });
    };
    document.getElementById('cOk').onclick = function () {
      var pin = pinOk(err); if (!pin) return;
      var t = String(document.getElementById('cT').value || '').trim();
      if (!t && !foto) { err.textContent = 'Escribe un comentario o agrega una foto.'; return; }
      if (guardarEnCola({ k: 'com', id: nuevoId(), nombre: nombre, pin: pin, ts: Date.now(), clave: e.key, titulo: e.titulo, texto: t.slice(0, 1000), foto: foto }, err))
        listoGuardado(nombre, 'Comentario en ' + e.titulo);
    };
  }

  function pantallaAus(nombre) {
    var tipos = ['Compensatorio', 'Vacaciones', 'Incapacidad', 'Permiso'], tipo = '';
    off.innerHTML = '<div class="w"><p class="eb">Sin internet</p><h2>Pedir día libre</h2>' + CAMPO_PIN +
      '<div class="chips" id="aT">' + tipos.map(function (t) { return '<button data-t="' + t + '" aria-pressed="false">' + t + '</button>'; }).join('') + '</div>' +
      '<div class="dos"><label>Desde<input type="date" id="aD" value="' + hoyISO() + '"></label><label>Hasta<input type="date" id="aH" value="' + hoyISO() + '"></label></div>' +
      '<label>Nota (opcional)<textarea id="aN" maxlength="300"></textarea></label><p class="err" id="aE"></p>' +
      '<button class="btn" id="aOk">Guardar solicitud</button><button class="lnk" id="aV">&#8249; Volver</button></div>';
    off.scrollTop = 0;
    var err = document.getElementById('aE');
    off.querySelectorAll('#aT button').forEach(function (b) { b.onclick = function () { tipo = b.dataset.t; off.querySelectorAll('#aT button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
    document.getElementById('aD').onchange = function () { var h = document.getElementById('aH'); if (h.value < this.value) h.value = this.value; };
    document.getElementById('aV').onclick = function () { pantallaMenu(nombre); };
    document.getElementById('aOk').onclick = function () {
      var pin = pinOk(err); if (!pin) return;
      if (!tipo) { err.textContent = 'Elige el tipo de día libre.'; return; }
      var d = document.getElementById('aD').value, h = document.getElementById('aH').value || d;
      if (!d) { err.textContent = 'Elige la fecha.'; return; }
      if (guardarEnCola({ k: 'aus', id: nuevoId(), nombre: nombre, pin: pin, ts: Date.now(), tipo: tipo, desde: d, hasta: h, nota: String(document.getElementById('aN').value || '').trim().slice(0, 300) }, err))
        listoGuardado(nombre, tipo + ' pedido', 'Se enviará cuando tengas internet. El administrador lo aprobará como siempre.');
    };
  }

  function pantallaVia(nombre) {
    off.innerHTML = '<div class="w"><p class="eb">Sin internet</p><h2>Solicitar viático</h2>' + CAMPO_PIN +
      '<label>Destino<input type="text" id="vD" maxlength="150" placeholder="Ciudad o lugar"></label>' +
      '<label>Objetivo del viaje<textarea id="vO" maxlength="400" placeholder="Evento, montaje, cliente..."></textarea></label>' +
      '<div class="dos"><label>Fecha de salida<input type="date" id="vFS" value="' + hoyISO() + '"></label><label>Hora de salida<input type="time" id="vHS" value="06:00"></label></div>' +
      '<div class="dos"><label>Fecha de regreso<input type="date" id="vFR" value="' + hoyISO() + '"></label><label>Hora de regreso<input type="time" id="vHR" value="18:00"></label></div>' +
      '<div class="card"><b>Peajes</b><div id="vPj"></div><button class="btn sec" id="vPjM">+ Agregar peaje</button></div>' +
      '<div class="dos"><label>Otros gastos (L)<input type="number" id="vOM" min="0" step="0.01" inputmode="decimal"></label><label>Detalle<input type="text" id="vOD" maxlength="150"></label></div>' +
      '<p class="mu">La alimentación se calcula sola con tus horas de salida y regreso.</p><p class="err" id="vE"></p>' +
      '<button class="btn" id="vOk">Guardar solicitud</button><button class="lnk" id="vV">&#8249; Volver</button></div>';
    off.scrollTop = 0;
    var err = document.getElementById('vE'), pj = document.getElementById('vPj');
    function filaPeaje() {
      var d = document.createElement('div'); d.className = 'pj';
      d.innerHTML = '<input type="text" placeholder="Lugar" maxlength="80"><input type="number" placeholder="L" min="0" step="0.01" inputmode="decimal"><button class="x" aria-label="Quitar">&times;</button>';
      d.querySelector('.x').onclick = function () { d.remove(); };
      pj.appendChild(d);
    }
    document.getElementById('vPjM').onclick = filaPeaje;
    document.getElementById('vFS').onchange = function () { var r = document.getElementById('vFR'); if (r.value < this.value) r.value = this.value; };
    document.getElementById('vV').onclick = function () { pantallaMenu(nombre); };
    document.getElementById('vOk').onclick = function () {
      var pin = pinOk(err); if (!pin) return;
      var g = function (id) { return String(document.getElementById(id).value || '').trim(); };
      var d = { destino: g('vD'), objetivo: g('vO'), fechaSalida: g('vFS'), horaSalida: g('vHS'), fechaRegreso: g('vFR'), horaRegreso: g('vHR'),
        peajes: Array.prototype.map.call(pj.querySelectorAll('.pj'), function (f) { var i = f.querySelectorAll('input'); return { lugar: i[0].value, monto: i[1].value }; }),
        otros: { monto: g('vOM'), desc: g('vOD') } };
      if (!d.destino) { err.textContent = 'Escribe el destino del viaje.'; return; }
      if (!d.objetivo) { err.textContent = 'Escribe el objetivo del viaje.'; return; }
      if (!d.fechaSalida || !d.fechaRegreso || !d.horaSalida || !d.horaRegreso) { err.textContent = 'Completa la fecha y hora de salida y de regreso.'; return; }
      if (d.fechaRegreso + d.horaRegreso < d.fechaSalida + d.horaSalida) { err.textContent = 'El regreso no puede ser antes de la salida.'; return; }
      if (guardarEnCola({ k: 'via', id: nuevoId(), nombre: nombre, pin: pin, ts: Date.now(), d: d }, err))
        listoGuardado(nombre, 'Viático a ' + d.destino, 'Se enviará cuando tengas internet y seguirá la aprobación de siempre.');
    };
  }

  function comprimir(file, cb) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      try {
        var max = 900, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', 0.7));
      } catch (e) { cb(''); }
    };
    img.onerror = function () { cb(''); };
    img.src = url;
  }

  // ---------- Envío cuando vuelve el internet ----------
  var enviando = {};
  window.addEventListener('message', function (ev) {
    if (!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/i.test(ev.origin)) return;
    var d = ev.data || {};
    if (d.tipo === 'offProg' && d.nombre && d.eventos) {
      var pg = leer(K_PROG, {}); pg[d.nombre] = { ts: d.ts || Date.now(), eventos: d.eventos }; escribir(K_PROG, pg); return;
    }
    if (d.tipo === 'offHola') {
      if (d.nombres && d.nombres.length) escribir(K_NOM, d.nombres);
      var q = cola().filter(function (it) { return !enviando[it.id]; });
      if (q.length) {
        q.forEach(function (it) { enviando[it.id] = true; });
        try { ev.source.postMessage({ tipo: 'offCola', items: q }, ev.origin); } catch (e) { q.forEach(function (it) { delete enviando[it.id]; }); }
      }
    } else if (d.tipo === 'offRes' && d.r) {
      var r = d.r; delete enviando[r.id];
      var q2 = cola(), it = null;
      q2.forEach(function (x) { if (x.id === r.id) it = x; });
      if (!it) return;
      if (r.ok || r.definitivo) {
        escribir(K_COLA, q2.filter(function (x) { return x.id !== r.id; }));
        var quien = it.nombre.split(' ')[0], que = it.k === 'com' ? 'comentario en ' + (it.titulo || 'un evento') : it.k === 'aus' ? 'solicitud de ' + String(it.tipo || 'día libre').toLowerCase() : it.k === 'via' ? 'viático a ' + ((it.d && it.d.destino) || '') : 'marcación (' + it.tipo + ' ' + hora(it.ts) + ')';
        aviso(r.ok ? 'Enviado sin conexión: ' + que + ' de ' + quien : 'No se aceptó el ' + que + ' de ' + quien + ': ' + (r.msg || ''), r.ok ? 6000 : 12000);
      }
    }
  });

  // ---------- Cuándo mostrar la opción ----------
  var lento = document.getElementById('lento');
  if (lento) {
    var b = document.createElement('button'); b.type = 'button'; b.id = 'offBtn'; b.textContent = 'No tengo internet: usar sin conexión';
    b.onclick = pantallaNombres; lento.appendChild(document.createElement('br')); lento.appendChild(b);
  }
  if (!navigator.onLine) pantallaNombres();
  window.addEventListener('offline', function () { if (off.hidden) pantallaNombres(); });
  window.addEventListener('online', function () {
    if (!off.hidden && !off.querySelector('input,textarea')) { cerrar(); if (window.abrir) window.abrir(); }
    else if (off.hidden && window.abrir) window.abrir();
  });
  pintarPendientes();
})();
