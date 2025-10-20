document.addEventListener('DOMContentLoaded', () => {
    try {
        const navMisCursos = document.getElementById('nav-mis-cursos');
        const navLoggedOut = document.getElementById('nav-logged-out');
        const navLoggedIn = document.getElementById('nav-logged-in');
        const navPortalPagos = document.getElementById('nav-portal-pagos');
        const userNameSpan = document.getElementById('user-name');
        const logoutButton = document.getElementById('logout-button');
        const navUserAvatar = document.getElementById('nav-user-avatar');
        const navGestionAdmin = document.getElementById('nav-gestion-admin');

        // Si alguno de los elementos principales no existe, no hacemos nada.
        if (!navLoggedOut || !navLoggedIn || !navMisCursos || !navPortalPagos || !navGestionAdmin) {
            return;
        }

        // Intentar obtener la sesión del almacenamiento local
        const sessionData = localStorage.getItem('app.session');

        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);

                if (session && session.user && userNameSpan && navUserAvatar) {
                    // ESTADO: Usuario Logueado
                    navLoggedOut.classList.add('d-none'); // Ocultar botones de login/registro
                    navLoggedIn.classList.remove('d-none'); // Mostrar "Hola, [usuario]" y "Cerrar Sesión"
                    navMisCursos.classList.remove('d-none'); // Mostrar "Mis Cursos"
                    navPortalPagos.classList.remove('d-none'); // Mostrar "Comprar Créditos"

                    // Si el usuario es Admin (rol_id: 2), mostrar el botón de Gestión
                    if (session.user.rol_id === 2) {
                        navGestionAdmin.classList.remove('d-none');
                        // Saludo especial solo si NO estamos en la página de gestión
                        if (window.location.pathname.includes('/GestionAdmin.html')) {
                            userNameSpan.textContent = session.user.nombre_usuario;
                        } else {
                            userNameSpan.parentElement.innerHTML = `Hola Dios, <strong id="user-name">${session.user.nombre_usuario}</strong>`;
                        }
                    } else {
                        userNameSpan.textContent = session.user.nombre_usuario;
                    }

                    // Asignar el avatar
                    const avatarDefault = 'https://www.shutterstock.com/image-vector/user-login-authenticate-icon-human-600nw-1365533969.jpg';
                    navUserAvatar.src = session.user.avatar || avatarDefault;
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
                navPortalPagos.classList.add('d-none');
                navGestionAdmin.classList.add('d-none');
            }
        } else {
            // ESTADO: No Logueado (no hay sesión)
            navLoggedOut.classList.remove('d-none');
            navLoggedIn.classList.add('d-none');
            navMisCursos.classList.add('d-none');
            navPortalPagos.classList.add('d-none');
            navGestionAdmin.classList.add('d-none');
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