document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const cursosContainer = document.getElementById('cursos-container');

    async function cargarCursos() {
        try {
            const response = await fetch(`${API_URL}/asignaturas`);
            if (!response.ok) {
                throw new Error('No se pudieron cargar los cursos.');
            }

            const asignaturas = await response.json();
            cursosContainer.innerHTML = ''; // Limpiar el contenedor

            if (asignaturas.length === 0) {
                cursosContainer.innerHTML = '<p>No hay cursos disponibles en este momento.</p>';
                return;
            }

            asignaturas.forEach(curso => {
                const tarjeta = `
                    <div class="card" style="width: 18rem;">
                        <img src="${curso.Imagen || 'https://via.placeholder.com/300x200.png?text=Sin+Imagen'}" class="card-img-top" alt="Imagen de ${curso.NombreAsignatura}" style="height: 180px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${curso.NombreAsignatura}</h5>
                            <p class="card-text flex-grow-1">${curso.Descripcion_Curso || 'No hay descripción disponible.'}</p>
                            <div class="mt-auto">
                                <p class="card-text">
                                    <small class="text-muted">Créditos: ${curso.Creditos} | Horas: ${curso.TotalHoras}</small>
                                </p>
                                <a href="#" class="btn btn-primary w-100">Inscribirse Ahora</a>
                            </div>
                        </div>
                    </div>
                `;
                cursosContainer.innerHTML += tarjeta;
            });

        } catch (error) {
            console.error('Error al cargar cursos:', error);
            cursosContainer.innerHTML = '<p class="text-danger">Hubo un error al cargar los cursos. Inténtalo más tarde.</p>';
        }
    }

    cargarCursos();
});