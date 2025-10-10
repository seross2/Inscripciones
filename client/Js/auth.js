document.addEventListener('DOMContentLoaded', () => {
    try {
        const navMisCursos = document.getElementById('nav-mis-cursos');
        const navLoggedOut = document.getElementById('nav-logged-out');
        const navLoggedIn = document.getElementById('nav-logged-in');
        const userNameSpan = document.getElementById('user-name');
        const logoutButton = document.getElementById('logout-button');

        // Si alguno de los elementos principales no existe, no hacemos nada.
        if (!navLoggedOut || !navLoggedIn || !navMisCursos) {
            return;
        }

        // Intentar obtener la sesión del almacenamiento local
        const sessionData = localStorage.getItem('app.session');

        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);

                if (session && session.user && userNameSpan) {
                    // ESTADO: Usuario Logueado
                    navLoggedOut.classList.add('d-none'); // Ocultar botones de login/registro
                    navLoggedIn.classList.remove('d-none'); // Mostrar "Hola, [usuario]" y "Cerrar Sesión"
                    navMisCursos.classList.remove('d-none'); // Mostrar "Mis Cursos"
                    userNameSpan.textContent = session.user.nombre;
                } else {
                    // ESTADO: Sesión inválida o corrupta
                    throw new Error("La sesión guardada no es válida.");
                }
            } catch (error) {
                console.error('Error al parsear la sesión:', error);
                localStorage.removeItem('app.session'); // Limpiar sesión corrupta
                // ESTADO: No Logueado (por sesión corrupta)
                navLoggedOut.classList.remove('d-none');
                navLoggedIn.classList.add('d-none');
                navMisCursos.classList.add('d-none');
            }
        } else {
            // ESTADO: No Logueado (no hay sesión)
            navLoggedOut.classList.remove('d-none');
            navLoggedIn.classList.add('d-none');
            navMisCursos.classList.add('d-none');
        }

        // Añadir funcionalidad al botón de cerrar sesión
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('app.session'); // Eliminar la sesión
                window.location.href = '/'; // Redirigir a la página de inicio
            });
        }
    } catch (error) {
        console.error("Error en el script de autenticación:", error);
    }
});