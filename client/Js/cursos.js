document.addEventListener('DOMContentLoaded', () => {
    const cursosContainer = document.getElementById('cursos-container');
    const noResultsContainer = document.getElementById('no-results');
    const searchInput = document.getElementById('search-input');
    const creditsSelect = document.getElementById('credits-select');
    const hoursSelect = document.getElementById('hours-select');

    // Función para crear la tarjeta de un curso
    const createCursoCard = (curso) => {
        // Usamos una imagen por defecto si no hay una URL
        const imageUrl = curso.Imagen || 'https://via.placeholder.com/400x250.png?text=Asignatura';
        
        const card = `
            <div class="col">
                <div class="card h-100 shadow-sm course-card">
                    <img src="${imageUrl}" class="card-img-top" alt="${curso.NombreAsignatura}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${curso.NombreAsignatura}</h5>
                        <p class="card-text text-muted flex-grow-1">Código: ${curso.CodigoAsignatura}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="badge bg-primary">Créditos: ${curso.Creditos}</span>
                            <span class="fw-bold">Horas: ${curso.TotalHoras}</span>
                        </div>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <a href="/DetalleCurso.html?id=${curso.AsignaturaID}" target="_blank" class="btn btn-primary w-100">Ver Detalles</a>
                    </div>
                </div>
            </div>
        `;
        return card;
    };

    // Función para obtener y mostrar las asignaturas
    const fetchAndDisplayCursos = async () => {
        const searchTerm = searchInput.value;
        const creditsRange = creditsSelect.value;
        const hoursRange = hoursSelect.value;

        // Construimos la URL con los parámetros de filtro
        let url = '/api/asignaturas?';
        if (searchTerm) {
            url += `search=${encodeURIComponent(searchTerm)}&`;
        }
        if (creditsRange) {
            url += `creditos=${creditsRange}&`;
        }
        if (hoursRange) {
            url += `horas=${hoursRange}&`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa.');
            }
            const asignaturas = await response.json();

            cursosContainer.innerHTML = ''; // Limpiamos el contenedor

            if (asignaturas.length === 0) {
                noResultsContainer.style.display = 'block';
            } else {
                noResultsContainer.style.display = 'none';
                asignaturas.forEach(asignatura => {
                    cursosContainer.innerHTML += createCursoCard(asignatura);
                });
            }
        } catch (error) {
            console.error('Error al obtener los cursos:', error);
            cursosContainer.innerHTML = '<p class="text-danger">No se pudieron cargar los cursos. Inténtalo de nuevo más tarde.</p>';
        }
    };

    // Usamos 'input' para el buscador para que filtre mientras se escribe
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        // Esperamos 300ms después de que el usuario deja de escribir para buscar
        searchTimeout = setTimeout(fetchAndDisplayCursos, 300);
    });
    creditsSelect.addEventListener('change', fetchAndDisplayCursos);
    hoursSelect.addEventListener('change', fetchAndDisplayCursos);

    // Carga inicial de los cursos
    fetchAndDisplayCursos();
});