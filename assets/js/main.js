/* Vitrinexo — main.js */
(function () {
  'use strict';

  // ── Badge de notificaciones ──────────────────────────────────────────────────

  const badge = document.getElementById('vx-notif-badge');
  if (badge && typeof vx_data !== 'undefined' && vx_data.user_id) {
    fetch(vx_data.api_url + 'notificaciones/unread-count', {
      headers: { 'X-WP-Nonce': vx_data.nonce },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.count > 0) {
          badge.classList.remove('d-none');
          badge.dataset.count = json.count;
        } else {
          badge.classList.add('d-none');
        }
      })
      .catch(() => {});
  }

  // ── Favoritos (cards del directorio) ─────────────────────────────────────────

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.vx-fav-btn');
    if (!btn) return;
    if (!vx_data || !vx_data.user_id) {
      window.location.href = vx_data.api_url.replace('/wp-json/vitrinexo/v1/', '') + '/login/';
      return;
    }

    const userId = btn.dataset.userId;
    const activo = btn.dataset.activo === '1';
    const method = activo ? 'DELETE' : 'POST';

    fetch(vx_data.api_url + 'favoritos/' + userId, {
      method,
      headers: { 'X-WP-Nonce': vx_data.nonce },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          btn.dataset.activo = activo ? '0' : '1';
          const icon = btn.querySelector('i');
          if (icon) {
            icon.classList.toggle('ti-heart', activo);
            icon.classList.toggle('ti-heart-filled', !activo);
          }
          btn.classList.toggle('vx-fav-btn--active', !activo);
        }
      })
      .catch(() => {});
  });

  // ── Modal conectar — rellenar datos del receptor ─────────────────────────────

  const modalConectar = document.getElementById('modalConectar');
  if (modalConectar) {
    modalConectar.addEventListener('show.bs.modal', function (event) {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const nombre  = trigger.dataset.receptorNombre  || '';
      const empresa = trigger.dataset.receptorEmpresa || '';
      const id      = trigger.dataset.userId           || trigger.dataset.receptorId || '';

      const elNombre  = modalConectar.querySelector('#modal-receptor-nombre');
      const elEmpresa = modalConectar.querySelector('#modal-receptor-empresa');
      const elId      = modalConectar.querySelector('#modal-receptor-id');
      const elSuccess = modalConectar.querySelector('#modal-receptor-nombre-success');

      if (elNombre)  elNombre.textContent  = nombre  || 'esta persona';
      if (elEmpresa) elEmpresa.textContent = empresa;
      if (elId)      elId.value            = id;
      if (elSuccess) elSuccess.textContent = nombre  || 'La persona';

      // Reset form/success state
      const form = document.getElementById('form-conectar');
      const succ = document.getElementById('modal-success');
      if (form) form.style.display = '';
      if (succ) succ.style.display = 'none';
    });

    // Empresa selector checkboxes
    modalConectar.querySelectorAll('.modal-empresa-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        const card     = opt.querySelector('.modal-empresa-card');
        const check    = opt.querySelector('.modal-empresa-check');
        const checkbox = opt.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        card.classList.toggle('modal-empresa-card--selected', checkbox.checked);
        if (checkbox.checked) {
          check.classList.remove('ti-circle');
          check.classList.add('ti-circle-check');
        } else {
          check.classList.remove('ti-circle-check');
          check.classList.add('ti-circle');
        }
      });
    });
  }

  // ── Modal conectar — envío del formulario ─────────────────────────────────────

  const formConectar = document.getElementById('form-conectar');
  if (formConectar) {
    formConectar.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn      = document.getElementById('btn-enviar-conexion');
      const errDiv   = document.getElementById('form-conectar-error');
      const successEl = document.getElementById('modal-success');

      btn.disabled    = true;
      btn.textContent = 'Enviando...';
      if (errDiv) { errDiv.classList.add('d-none'); errDiv.textContent = ''; }

      const receptorId = formConectar.querySelector('[name="receptor_id"]')?.value;
      const pitch      = formConectar.querySelector('[name="pitch"]')?.value;
      const empresaBoxes = formConectar.querySelectorAll('[name="empresas[]"]:checked');
      const empresas   = Array.from(empresaBoxes).map(cb => cb.value);

      try {
        const res  = await fetch(vx_data.api_url + 'conexiones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': vx_data.nonce,
          },
          body: JSON.stringify({ receptor_id: parseInt(receptorId, 10), pitch, empresas }),
        });
        const json = await res.json();

        if (json.success) {
          formConectar.style.display = 'none';
          if (successEl) successEl.style.display = '';
        } else {
          const msgs = {
            no_autoconexion:     'No puedes conectarte contigo mismo.',
            pitch_muy_corto:     'El mensaje debe tener al menos 20 caracteres.',
            conexion_pendiente:  'Ya tienes una solicitud pendiente con esta persona.',
          };
          if (errDiv) {
            errDiv.textContent = msgs[json.error] || 'Error al enviar la solicitud.';
            errDiv.classList.remove('d-none');
          }
          btn.disabled    = false;
          btn.textContent = 'Enviar solicitud de conexión';
        }
      } catch {
        if (errDiv) {
          errDiv.textContent = 'Error de conexión. Intenta más tarde.';
          errDiv.classList.remove('d-none');
        }
        btn.disabled    = false;
        btn.textContent = 'Enviar solicitud de conexión';
      }
    });
  }

  // ── 4Dinner — botón de interés ───────────────────────────────────────────────

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.vx-dinner-interes-btn');
    if (!btn) return;
    if (!vx_data || !vx_data.user_id) return;

    const dinnerId = btn.dataset.dinnerId;
    const activo   = btn.dataset.activo === '1';
    const method   = activo ? 'DELETE' : 'POST';

    btn.disabled = true;

    fetch(vx_data.api_url + 'dinners/' + dinnerId + '/interes', {
      method,
      headers: { 'X-WP-Nonce': vx_data.nonce },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          btn.dataset.activo = activo ? '0' : '1';
          btn.textContent    = activo ? 'Me interesa' : 'Quitar interés';
          btn.classList.toggle('vx-dinner-interes-btn--active', !activo);
        }
        btn.disabled = false;
      })
      .catch(() => { btn.disabled = false; });
  });

  // ── Solicitar verificación Senior ───────────────────────────────────────────

  const btnSenior = document.getElementById('vx-solicitar-senior');
  if (btnSenior) {
    btnSenior.addEventListener('click', async function () {
      btnSenior.disabled = true;
      btnSenior.textContent = 'Enviando solicitud...';
      try {
        const res  = await fetch(vx_data.api_url + 'comunidades/solicitar-senior', {
          method: 'POST',
          headers: { 'X-WP-Nonce': vx_data.nonce },
        });
        const json = await res.json();
        if (json.success) {
          btnSenior.textContent = 'Solicitud enviada';
        } else {
          btnSenior.disabled = false;
          btnSenior.textContent = 'Solicitar verificación Senior';
        }
      } catch {
        btnSenior.disabled = false;
        btnSenior.textContent = 'Solicitar verificación Senior';
      }
    });
  }

  // ── Recuperar contraseña ──────────────────────────────────────────────────────

  const recuperarForm = document.getElementById('vx-recuperar-form');
  if (recuperarForm) {
    recuperarForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = recuperarForm.querySelector('[type="submit"]');
      const msg = document.getElementById('vx-recuperar-msg');
      btn.disabled = true;
      msg.classList.add('d-none');

      const email = recuperarForm.querySelector('[name="email"]').value;
      const ajaxUrl = vx_data.api_url.replace('/wp-json/vitrinexo/v1/', '/wp-admin/admin-ajax.php');
      const formData = new FormData();
      formData.append('action', 'vx_reset_password');
      formData.append('email', email);
      formData.append('nonce', vx_data.nonce);

      try {
        await fetch(ajaxUrl, { method: 'POST', body: formData });
        msg.textContent = 'Si existe una cuenta con ese correo, recibirás el enlace en breve.';
        msg.className = 'vx-alert vx-alert--success';
        msg.classList.remove('d-none');
      } catch {
        msg.textContent = 'Error de conexión. Intenta más tarde.';
        msg.className = 'vx-alert vx-alert--error';
        msg.classList.remove('d-none');
      }
      btn.disabled = false;
      btn.textContent = 'Enviar enlace';
    });
  }

  // ── Upload con progreso ───────────────────────────────────────────────────────
  // Función global reutilizable en todas las páginas con subida de imágenes.
  // Parámetros:
  //   file       — File object del input
  //   tipo       — 'foto' | 'logo' | 'banner'
  //   empresaId  — ID de empresa si aplica (null para foto de usuario)
  //   progressEl — elemento DOM del contenedor de barra de progreso (puede ser null)
  //   onSuccess  — callback(json) llamado con la respuesta si success
  //   onError    — callback(mensajeString) llamado en error o validación fallida

  var VX_MAX_UPLOAD_MB    = 15;
  var VX_MAX_UPLOAD_BYTES = VX_MAX_UPLOAD_MB * 1024 * 1024;

  window.vxUploadXHR = function vxUploadXHR(file, tipo, empresaId, progressEl, onSuccess, onError) {
    if (!file) return;

    // ── Validación client-side de tamaño ──────────────────────────────────────
    if (file.size > VX_MAX_UPLOAD_BYTES) {
      var sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      if (onError) onError(
        'La imagen pesa ' + sizeMB + ' MB y supera el máximo de ' + VX_MAX_UPLOAD_MB + ' MB. '
        + 'Elige una imagen más pequeña o comprime el archivo antes de subir.'
      );
      return;
    }

    // ── Helpers de barra ──────────────────────────────────────────────────────
    var fill  = progressEl ? progressEl.querySelector('.vx-progress-fill')  : null;
    var label = progressEl ? progressEl.querySelector('.vx-progress-label') : null;

    function showProgress(pct, text) {
      if (!progressEl) return;
      progressEl.classList.remove('d-none');
      if (fill)  fill.style.width = pct + '%';
      if (label) label.textContent = text || ('Subiendo... ' + pct + '%');
    }
    function hideProgress() {
      if (progressEl) progressEl.classList.add('d-none');
    }

    showProgress(0, 'Preparando...');

    // ── XHR con progreso ─────────────────────────────────────────────────────
    var fd = new FormData();
    fd.append('file', file);
    fd.append('tipo', tipo);
    if (empresaId) fd.append('contexto', String(empresaId));

    var xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var pct = Math.round((e.loaded / e.total) * 100);
        showProgress(pct, 'Subiendo... ' + pct + '%');
      }
    });

    xhr.upload.addEventListener('load', function() {
      showProgress(100, 'Procesando...');
    });

    xhr.addEventListener('load', function() {
      hideProgress();
      try {
        var json = JSON.parse(xhr.responseText);
        if (json.success) {
          if (onSuccess) onSuccess(json);
        } else {
          var msgs = {
            archivo_muy_grande: 'La imagen supera el límite de ' + VX_MAX_UPLOAD_MB + ' MB.',
            formato_invalido:   'Formato no permitido. Usa JPG, PNG o WebP.',
            tipo_invalido:      'Tipo de upload no válido.',
          };
          if (onError) onError(msgs[json.error] || json.error || 'Error al subir la imagen.');
        }
      } catch(e) {
        if (onError) onError('Error inesperado del servidor.');
      }
    });

    xhr.addEventListener('error', function() {
      hideProgress();
      if (onError) onError('Error de red. Comprueba tu conexión e intenta de nuevo.');
    });

    xhr.addEventListener('abort', function() {
      hideProgress();
    });

    if (!window.vx_data || !window.vx_data.api_url) {
      if (onError) onError('Error de configuración: vx_data no disponible.');
      return;
    }

    xhr.open('POST', vx_data.api_url + 'upload');
    xhr.setRequestHeader('X-WP-Nonce', vx_data.nonce);
    xhr.send(fd);
  };

  // ── Validador de URLs de LinkedIn ────────────────────────────────────────────
  // Aplica a todos los inputs con clase .vx-linkedin-input en cualquier página.

  // Exponer globalmente para uso en shortcodes inline (onboarding, editor)
  window.vxIsLinkedinUrl = function vxIsLinkedinUrl(value) {
    if (!value || value.trim() === '') return true; // vacío = válido (campo opcional)
    var v = value.trim().toLowerCase();
    // Normalizar: añadir https:// si no tiene protocolo para el test
    if (!v.startsWith('http://') && !v.startsWith('https://')) {
      v = 'https://' + v;
    }
    try {
      var url = new URL(v);
      var host = url.hostname.replace(/^www\./, '');
      return host === 'linkedin.com' || host.endsWith('.linkedin.com');
    } catch (e) {
      return false; // URL inválida
    }
  }

  function vxIsLinkedinUrl(value) { return window.vxIsLinkedinUrl(value); } // alias interno

  function vxLinkedinFeedback(input, valid) {
    // Borrar feedback anterior
    var existing = input.parentElement.querySelector('.vx-linkedin-error');
    if (existing) existing.remove();

    if (!valid) {
      input.style.borderColor = 'var(--color-pink-500)';
      var msg = document.createElement('span');
      msg.className = 'vx-linkedin-error form-hint';
      msg.style.cssText = 'color:var(--color-pink-600);display:flex;align-items:center;gap:4px;margin-top:4px';
      msg.innerHTML = '<i class="ti ti-alert-circle" style="font-size:13px"></i> Ingresa una URL de LinkedIn válida (ej: linkedin.com/in/tu-nombre o linkedin.com/company/empresa)';
      // Insertar después del input o de su contenedor padre inmediato
      var container = input.closest('.input-group-vx') || input;
      container.insertAdjacentElement('afterend', msg);
    } else {
      // Restablecer color del borde
      input.style.borderColor = '';
      // Si el campo tiene un valor válido y no vacío, mostrar un check sutil
      if (input.value.trim()) {
        input.style.borderColor = 'var(--color-green-500)';
      }
    }
  }

  // Inicializar validación en todos los campos LinkedIn actuales y futuros
  function vxInitLinkedinValidation() {
    document.querySelectorAll('.vx-linkedin-input').forEach(function (input) {
      if (input.dataset.linkedinValidated) return;
      input.dataset.linkedinValidated = '1';

      // Validar al perder el foco
      input.addEventListener('blur', function () {
        vxLinkedinFeedback(input, vxIsLinkedinUrl(input.value));
      });

      // Quitar error mientras escribe
      input.addEventListener('input', function () {
        var existing = input.parentElement.querySelector('.vx-linkedin-error');
        if (existing) existing.remove();
        input.style.borderColor = '';
      });

      // Validar valor inicial si ya tiene contenido
      if (input.value.trim()) {
        vxLinkedinFeedback(input, vxIsLinkedinUrl(input.value));
      }
    });
  }

  vxInitLinkedinValidation();

  // Re-inicializar cuando se muestran nuevos elementos (ej: formulario empresa que se expande)
  document.addEventListener('click', function (e) {
    // Pequeño delay para que el DOM se actualice antes de buscar nuevos inputs
    setTimeout(vxInitLinkedinValidation, 50);
  });

})();
