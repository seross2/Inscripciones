document.addEventListener('DOMContentLoaded', () => {
    const detalleContainer = document.getElementById('detalle-asignatura');
    const gruposContainer = document.getElementById('lista-grupos');
    const inscripcionModal = new bootstrap.Modal(document.getElementById('modal-inscripcion'));
    const inscripcionForm = document.getElementById('form-inscripcion');
    const inscripcionGrupoIdInput = document.getElementById('inscripcion-grupo-id');
    const inscripcionFormMensaje = document.getElementById('inscripcion-form-mensaje');
    const textoDescripcion = document.getElementById('texto-descripcion');
    const loginRequeridoModal = new bootstrap.Modal(document.getElementById('modal-login-requerido'));


    // Obtener el ID de la asignatura desde la URL
    const params = new URLSearchParams(window.location.search);
    const asignaturaId = params.get('id');

    if (!asignaturaId) {
        detalleContainer.innerHTML = '<p class="text-danger">No se especificó una asignatura.</p>';
        return;
    }

    // Cargar detalles de la asignatura y sus grupos
    const cargarDetalles = async () => {
        try {
            const response = await fetch(`/api/asignaturas/${asignaturaId}`);
            if (!response.ok) throw new Error('No se pudo cargar la información.');
            const { asignatura, grupos } = await response.json();

            // Usamos una imagen por defecto si no hay una en la base de datos
            const imageUrl = asignatura.Imagen || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop';

            // Mostrar detalles de la asignatura
            detalleContainer.innerHTML = `
                <div class="row g-5 align-items-center">
                    <div class="col-lg-6">
                        <div class="asignatura-header p-5 bg-white rounded-3 shadow-sm">
                            <h1 class="display-5 fw-bold">${asignatura.NombreAsignatura}</h1>
                            <p class="fs-4 text-muted">Código: ${asignatura.CodigoAsignatura}</p>
                            <hr class="my-4">
                            <p><strong>Créditos:</strong> ${asignatura.Creditos} | <strong>Horas Totales:</strong> ${asignatura.TotalHoras}</p>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <img src="${imageUrl}" class="img-fluid rounded shadow-lg" alt="Imagen de ${asignatura.NombreAsignatura}">
                    </div>
                </div>
            `;

            // Mostrar la descripción del curso
            textoDescripcion.textContent = asignatura.Descripcion_Curso || 'Este curso no tiene una descripción disponible.';

            // Mostrar grupos existentes
            gruposContainer.innerHTML = '';
            if (grupos.length > 0) {
                grupos.forEach(grupo => {
                    const inscritos = grupo.INSCRIPCIONES[0]?.count || 0;
                    const cuposDisponibles = grupo.Capacidad - inscritos;
                    const cuposTexto = `Disponibles: ${cuposDisponibles} / ${grupo.Capacidad}`;

                    const horariosHtml = grupo.HORARIOS.length > 0
                        ? `<ul class="horarios-list mt-2 text-muted">
                            ${grupo.HORARIOS.map(h => `<li><i class="bi bi-clock"></i> ${h.DiaSemana}: ${h.HoraInicio.substring(0,5)} - ${h.HoraFin.substring(0,5)} (Salón: ${h.Salon})</li>`).join('')}
                           </ul>`
                        : '<p class="text-muted small mt-2">Sin horarios asignados.</p>';

                    gruposContainer.innerHTML += `
                        <div class="col">
                            <div class="card h-100 shadow-sm grupo-card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">Grupo ${grupo.NumeroGrupo}</h5>
                                    <span class="badge bg-success">${grupo.PERIODOS_ACADEMICOS.NombrePeriodo || 'Sin Periodo'}</span>
                                </div>
                                <div class="card-body">
                                    <p class="mb-2 profesor-info">
                                        <i class="bi bi-person-fill"></i> <strong>Profesor:</strong> ${grupo.PROFESORES.Nombre} ${grupo.PROFESORES.Apellido}
                                        <span class="badge bg-info text-dark ms-2">${grupo.PROFESORES.Departamento}</span>
                                    </p>
                                    <p class="mb-2"><strong>Cupos:</strong> ${cuposTexto}</p>
                                    <hr>
                                    <h6 class="card-subtitle mb-2 text-muted">Horarios:</h6>
                                    ${horariosHtml}
                                </div>
                                <div class="card-footer bg-transparent border-0 text-center pb-3">
                                    <button class="btn btn-success btn-inscribir w-100" data-grupoid="${grupo.GrupoID}" ${cuposDisponibles <= 0 ? 'disabled' : ''}>
                                        ${cuposDisponibles <= 0 ? 'Grupo Lleno' : 'Inscribirse'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                gruposContainer.innerHTML = '<p class="text-muted">Aún no hay grupos para esta asignatura.</p>';
            }

        } catch (error) {
            console.error('Error:', error);
            detalleContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    };

    // --- Lógica de Inscripción ---

    // Añadir event listener al contenedor de grupos para delegar eventos
    gruposContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-inscribir')) {
            // Primero, verificar si el usuario ha iniciado sesión
            const sessionData = localStorage.getItem('app.session');

            if (!sessionData) {
                // Si no hay sesión, mostrar el modal de "login requerido"
                loginRequeridoModal.show();
                return; // Detener la ejecución
            }

            // Si hay sesión, proceder a abrir el modal y autocompletar
            const grupoId = event.target.getAttribute('data-grupoid');
            inscripcionGrupoIdInput.value = grupoId;

            try {
                const session = JSON.parse(sessionData);
                if (session && session.user) {
                    const nombreCompleto = session.user.nombre_usuario || '';
                    const partesNombre = nombreCompleto.split(' ');
                    document.getElementById('estudiante-nombre').value = partesNombre[0] || '';
                    document.getElementById('estudiante-apellido').value = partesNombre.slice(1).join(' ') || '';
                    document.getElementById('estudiante-email').value = session.user.email || '';
                }
            } catch (e) {
                console.error("Error al parsear sesión para autocompletar:", e);
            }

            inscripcionModal.show();
        }
    });

    // Manejar el envío del formulario de inscripción
    inscripcionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = inscripcionForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...`;

        inscripcionFormMensaje.innerHTML = '';

        const session = JSON.parse(localStorage.getItem('app.session'));
        const formData = {
            // Datos del formulario
            Nombre: document.getElementById('estudiante-nombre').value,
            Apellido: document.getElementById('estudiante-apellido').value,
            Email: document.getElementById('estudiante-email').value,
            Telefono: document.getElementById('estudiante-telefono').value,
            FechaNacimiento: document.getElementById('estudiante-fecha-nacimiento').value,
            GrupoID: parseInt(inscripcionGrupoIdInput.value),
            usuario_id: session.user.id // ID del usuario para descontar créditos
        };

        let response; // Definimos response fuera del try para acceder a él en el catch
        try {
            response = await fetch('/api/inscripciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (!response.ok) throw result; // Lanzamos el objeto de error completo

            inscripcionFormMensaje.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => {
                inscripcionModal.hide();
                inscripcionForm.reset();
                window.location.href = '/MisCursos.html'; // Redirigir a Mis Cursos para ver el cambio
            }, 2000);

        } catch (error) {
            let errorMessage = error.error || 'No se pudo completar la inscripción.';
            // Si el error es por créditos insuficientes (código 402), mostramos un mensaje especial.
            if (response && response.status === 402) {
                errorMessage = `${errorMessage} <br><strong><a href="/PortalPagos.html" class="alert-link">Haz clic aquí para comprar más créditos.</a></strong>`;
            }
            inscripcionFormMensaje.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Confirmar Inscripción';
        }
    });

    // Carga inicial
    cargarDetalles();
});