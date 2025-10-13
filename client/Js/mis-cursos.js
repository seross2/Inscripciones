document.addEventListener('DOMContentLoaded', () => {
    const perfilContainer = document.getElementById('perfil-estudiante');
    const inscripcionesContainer = document.getElementById('lista-inscripciones');
    const noInscripcionesMsg = document.getElementById('no-inscripciones');
    const pagosContainer = document.getElementById('lista-pagos-container');
    const noPagosMsg = document.getElementById('no-pagos');

    const filtroNombre = document.getElementById('filtro-nombre-curso');
    const filtroPeriodo = document.getElementById('filtro-periodo');
    const filtroEstado = document.getElementById('filtro-estado');
    const notificacionesContainer = document.getElementById('notificaciones-container');
    const confirmacionModal = new bootstrap.Modal(document.getElementById('modal-confirmar-cancelacion'));
    const cancelarInscripcionIdInput = document.getElementById('cancelar-inscripcion-id');
    const btnConfirmarCancelacion = document.getElementById('btn-confirmar-cancelacion');
    const avatarModal = new bootstrap.Modal(document.getElementById('modal-avatar'));
    const formAvatarUpload = document.getElementById('form-avatar-upload');

    let todasLasInscripciones = [];
    let todosLosPagos = [];

    // Función para renderizar las inscripciones
    const renderInscripciones = (inscripciones) => {
        inscripcionesContainer.innerHTML = '';
        if (inscripciones.length === 0) {
            noInscripcionesMsg.style.display = 'block';
        } else {
            noInscripcionesMsg.style.display = 'none';
            inscripciones.forEach(insc => {
                const card = `
                    <div class="col">
                        <div class="card h-100 shadow-sm inscription-card">
                            <div class="card-body">
                                <h5 class="card-title">${insc.GRUPOS.ASIGNATURAS.NombreAsignatura}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">Grupo: ${insc.GRUPOS.NumeroGrupo}</h6>
                                <p class="card-text">
                                    <strong>Profesor:</strong> ${insc.GRUPOS.PROFESORES.Nombre} ${insc.GRUPOS.PROFESORES.Apellido}<br>
                                    <strong>Periodo:</strong> ${insc.GRUPOS.PERIODOS_ACADEMICOS.NombrePeriodo}<br>
                                    <strong>Estado:</strong> <span class="badge bg-info">${insc.EstadoInscripcion}</span>
                                </p>
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-outline-danger btn-cancelar" data-inscripcionid="${insc.InscripcionID}">Cancelar Inscripción</button>
                                </div>
                            </div>
                            <div class="card-footer text-muted">
                                Inscrito el: ${new Date(insc.FechaInscripcion).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                `;
                inscripcionesContainer.innerHTML += card;
            });
        }
    };

    // Función para renderizar los pagos
    const renderPagos = (pagos) => {
        pagosContainer.innerHTML = '';
        if (pagos.length === 0) {
            noPagosMsg.style.display = 'block';
        } else {
            noPagosMsg.style.display = 'none';
            const tabla = `
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>ID Pago</th>
                                <th>Referencia</th>
                                <th>Monto</th>
                                <th>Moneda</th>
                                <th>Método</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pagos.map(pago => `
                                <tr>
                                    <td>${pago.pago_id}</td>
                                    <td>${pago.referencia_externa}</td>
                                    <td>${pago.monto}</td>
                                    <td>${pago.moneda}</td>
                                    <td>${pago.metodo_pago}</td>
                                    <td><span class="badge bg-success">${pago.estado_pago}</span></td>
                                    <td>${new Date(pago.fecha_pago).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
            pagosContainer.innerHTML = tabla;
        }
    };

    // Función para aplicar filtros
    const aplicarFiltros = () => {
        const nombreQuery = filtroNombre.value.toLowerCase();
        const periodoId = filtroPeriodo.value;
        const estadoQuery = filtroEstado.value;

        const inscripcionesFiltradas = todasLasInscripciones.filter(insc => {
            const matchNombre = insc.GRUPOS.ASIGNATURAS.NombreAsignatura.toLowerCase().includes(nombreQuery);
            const matchPeriodo = !periodoId || insc.GRUPOS.PeriodoID.toString() === periodoId;
            const matchEstado = !estadoQuery || insc.EstadoInscripcion.toLowerCase() === estadoQuery;
            return matchNombre && matchPeriodo && matchEstado;
        });

        renderInscripciones(inscripcionesFiltradas);
    };

    // Cargar datos iniciales
    const cargarDatos = async () => {
        const sessionData = localStorage.getItem('app.session');
        if (!sessionData) {
            window.location.href = '/Login.html'; // Redirigir si no hay sesión
            return;
        }

        try {
            const session = JSON.parse(sessionData);
            const { email: userEmail, id: userId } = session.user;

            // Cargar inscripciones y perfil
            const [cursosResponse, pagosResponse] = await Promise.all([
                fetch(`/api/mis-cursos?email=${encodeURIComponent(userEmail)}`),
                fetch(`/api/pagos?email=${encodeURIComponent(userEmail)}`)
            ]);
            
            if (!cursosResponse.ok) throw new Error('No se pudieron cargar tus datos de cursos.');
            const { estudiante, inscripciones } = await cursosResponse.json();

            const avatarUrl = estudiante.Avatar || 'https://www.shutterstock.com/image-vector/user-login-authenticate-icon-human-600nw-1365533969.jpg';

            // Renderizar perfil
            perfilContainer.innerHTML = `
                <div class="card profile-card">
                    <div class="card-header">Perfil del Estudiante</div>
                    <div class="card-body d-flex align-items-center">
                        <div class="position-relative me-4">
                            <img id="profile-avatar-img" src="${avatarUrl}" class="rounded-circle" alt="Avatar" width="120" height="120" style="object-fit: cover;">
                            <button id="btn-edit-avatar" class="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0" title="Cambiar avatar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="card-title">${estudiante.Nombre || ''} ${estudiante.Apellido || estudiante.nombre_completo || ''}</h5>
                            <p class="card-text mb-1"><strong>Email:</strong> ${estudiante.Email || estudiante.email}</p>
                            <p class="card-text mb-1 small text-muted"><strong>Teléfono:</strong> ${estudiante.Telefono || 'No disponible'}</p>
                            <p class="card-text mb-0 small text-muted"><strong>Nacimiento:</strong> ${estudiante.FechaNacimiento ? new Date(estudiante.FechaNacimiento).toLocaleDateString() : 'No disponible'}</p>
                        </div>
                        <div class="text-center">
                            <h3 class="fw-bold mb-0">${estudiante.Creditos || 0}</h3>
                            <small class="text-muted">CRÉDITOS</small>
                        </div>
                    </div>
                </div>
            `;

            // Añadir event listener al nuevo botón de editar avatar
            document.getElementById('btn-edit-avatar').addEventListener('click', () => {
                avatarModal.show();
            });

            // Guardar y renderizar inscripciones
            todasLasInscripciones = inscripciones;
            renderInscripciones(todasLasInscripciones);

            // Cargar opciones de filtro de periodo
            const periodos = [...new Set(inscripciones.map(i => i.GRUPOS.PeriodoID))];
            const periodosData = inscripciones.map(i => i.GRUPOS.PERIODOS_ACADEMICOS);
            periodos.forEach(id => {
                const periodo = periodosData.find(p => p.PeriodoID === id);
                if (periodo) {
                    filtroPeriodo.innerHTML += `<option value="${periodo.PeriodoID}">${periodo.NombrePeriodo}</option>`;
                }
            });

            // Cargar y renderizar pagos
            if (!pagosResponse.ok) throw new Error('No se pudieron cargar tus pagos.');
            todosLosPagos = await pagosResponse.json();
            renderPagos(todosLosPagos);


        } catch (error) {
            console.error('Error:', error);
            perfilContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // Event listeners para los filtros
    filtroNombre.addEventListener('input', aplicarFiltros);
    filtroPeriodo.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);

    // Función para mostrar notificaciones
    const mostrarNotificacion = (mensaje, tipo = 'success') => {
        notificacionesContainer.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        // La notificación se puede cerrar manualmente o desaparecerá si se muestra otra.
    };

    // Event listener para los botones de cancelar
    inscripcionesContainer.addEventListener('click', async (event) => {
        const target = event.target;

        if (target.classList.contains('btn-cancelar')) {
            const inscripcionId = event.target.getAttribute('data-inscripcionid');
            // Guardar el ID en el input oculto del modal y mostrarlo
            cancelarInscripcionIdInput.value = inscripcionId;
            confirmacionModal.show();
        }
    });

    // Event listener para el botón de confirmación final en el modal
    btnConfirmarCancelacion.addEventListener('click', async () => {
        const inscripcionId = cancelarInscripcionIdInput.value;
        if (!inscripcionId) return;

        try {
            const response = await fetch(`/api/inscripciones/${inscripcionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'No se pudo cancelar la inscripción.');
            }

            confirmacionModal.hide(); // Ocultar el modal de confirmación
            mostrarNotificacion(result.message, 'success');
            cargarDatos(); // Recargar todos los datos, incluyendo el perfil con los créditos actualizados.
        } catch (error) {
            confirmacionModal.hide();
            mostrarNotificacion(error.message, 'danger');
        }
    });

    // Event listener para el formulario de subida de avatar
    formAvatarUpload.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('avatar-file-input');
        const mensajeContainer = document.getElementById('avatar-upload-mensaje');
        const submitButton = formAvatarUpload.querySelector('button[type="submit"]');

        if (fileInput.files.length === 0) {
            mensajeContainer.innerHTML = `<div class="alert alert-warning">Por favor, selecciona un archivo.</div>`;
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Subiendo...`;

        const formData = new FormData();
        formData.append('avatar', fileInput.files[0]);
        const session = JSON.parse(localStorage.getItem('app.session'));
        formData.append('email', session.user.email);

        try {
            const response = await fetch('/api/avatar', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al subir la imagen.');

            const newAvatarUrl = result.avatarUrl;

            // 1. Actualizar la imagen del perfil grande en la página
            const profileImg = document.getElementById('profile-avatar-img');
            if (profileImg) {
                profileImg.src = newAvatarUrl;
            }

            // 2. Actualizar la imagen del avatar en la barra de navegación
            const navAvatar = document.getElementById('nav-user-avatar');
            if (navAvatar) {
                navAvatar.src = newAvatarUrl;
            }

            // 3. Actualizar la sesión en localStorage para que el cambio se mantenga en otras páginas
            const sessionData = localStorage.getItem('app.session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                session.user.avatar = newAvatarUrl;
                localStorage.setItem('app.session', JSON.stringify(session));
            }

            avatarModal.hide();
            mostrarNotificacion('Avatar actualizado con éxito.', 'success');

        } catch (error) {
            mensajeContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subir y Guardar';
        }
    });

    cargarDatos();
});