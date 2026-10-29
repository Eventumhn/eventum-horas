/* Eventum Horas — botón "Activar notificaciones".
   Pide permiso, suscribe este celular y se lo pasa a la app para que el servidor pueda avisar
   (solicitud aprobada o rechazada; al administrador, solicitudes nuevas). */
(function () {
  'use strict';
  var VAPID = 'BECZNZ3_uKF9c0XsWn5-tyVuu5N1NEbMZl0MkSr_04JyiUPXSAtqksMzubc6xe5spd1yHhHaO5MzR3Ax_FCh8Qg';
  var K_LISTO = 'ehNotiListo';
  var soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var instalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var fuente = null, origen = null, subActual = null;

  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var css = document.createElement('style');
  css.textContent =
    '#notiBtn{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:6;display:none;align-items:center;gap:8px;' +
    'font:700 15px system-ui,-apple-system,sans-serif;color:#fff;border:0;border-radius:999px;padding:12px 18px;background:linear-gradient(135deg,#5b3e99,#9d87c0);box-shadow:0 10px 28px rgba(0,0,0,.45);cursor:pointer;white-space:nowrap}' +
    '#notiBtn.ver{display:flex}#notiBtn svg{flex:0 0 auto}' +
    '#notiMsg{position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:7;background:rgba(28,24,52,.97);border:1px solid rgba(157,135,192,.5);color:#ece7f7;border-radius:16px;padding:12px 14px;font:500 14px/1.4 system-ui,-apple-system,sans-serif;display:none;box-shadow:0 10px 30px rgba(0,0,0,.5)}' +
    '#notiMsg.ver{display:block}#notiMsg b{color:#fff}';
  document.head.appendChild(css);
  var btn = document.createElement('button'); btn.type = 'button'; btn.id = 'notiBtn';
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Activar notificaciones';
  document.body.appendChild(btn);
  var msg = document.createElement('div'); msg.id = 'notiMsg'; document.body.appendChild(msg);
  function mensaje(html, ms) { msg.innerHTML = html; msg.classList.add('ver'); btn.classList.remove('ver'); clearTimeout(mensaje.t); mensaje.t = setTimeout(function () { msg.classList.remove('ver'); pintar(); }, ms || 7000); }

  function b64ToU8(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function enviar() {
    if (fuente && subActual) { try { fuente.postMessage({ tipo: 'notiSub', sub: subActual.toJSON() }, origen); } catch (e) {} }
  }
  function pintar() {
    if (msg.classList.contains('ver')) return;
    var mostrar = false;
    if (soporta) mostrar = Notification.permission !== 'denied' && !(Notification.permission === 'granted' && subActual);
    else if (esIOS && !instalada) mostrar = leer('ehNotiIosVisto') !== '1';
    btn.classList.toggle('ver', !!mostrar && !!fuente);
    btn.style.bottom = document.querySelector('#aviso.ver') ? 'calc(118px + env(safe-area-inset-bottom,0px))' : '';
  }
  setInterval(pintar, 2000);

  btn.onclick = function () {
    if (!soporta) {
      guardar('ehNotiIosVisto', '1');
      mensaje(esIOS ? '<b>Para recibir notificaciones en iPhone</b><br>Primero instala la app: toca <b>Compartir</b> y luego <b>"Agregar a inicio"</b>. Ábrela desde el ícono y toca otra vez "Activar notificaciones".'
                    : '<b>Este navegador no permite notificaciones.</b><br>Usa Chrome en Android o instala la app.', 12000);
      return;
    }
    btn.disabled = true;
    Promise.resolve(Notification.requestPermission()).then(function (p) {
      if (p !== 'granted') { btn.disabled = false; mensaje('<b>No se activaron.</b><br>Si cambias de opinión, permite las notificaciones de esta app en los ajustes del celular.', 9000); return; }
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.getSubscription().then(function (s) {
          return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID) });
        });
      }).then(function (s) {
        subActual = s; guardar(K_LISTO, '1'); btn.disabled = false; enviar();
        mensaje('<b>Listo.</b> Entra con tu nombre y PIN (o como administrador) para terminar de activarlas. Te llegará una notificación de confirmación.', 9000);
      });
    }).catch(function () { btn.disabled = false; mensaje('<b>No se pudieron activar.</b> Inténtalo otra vez con internet.', 8000); });
  };

  window.addEventListener('message', function (ev) {
    if (!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/i.test(ev.origin)) return;
    var d = ev.data || {};
    if (d.tipo === 'offHola') {
      fuente = ev.source; origen = ev.origin;
      if (soporta && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); })
          .then(function (s) { subActual = s; enviar(); pintar(); }).catch(function () { pintar(); });
      } else pintar();
    } else if (d.tipo === 'notiOk' && !d.ok && d.msg) {
      mensaje('<b>No se pudieron activar:</b> ' + String(d.msg).replace(/[<>&]/g, ''), 9000);
    }
  });
})();
