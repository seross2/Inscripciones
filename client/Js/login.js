const formLogin = document.getElementById('form-login');
const mensajeError = document.getElementById('mensaje-error');

formLogin.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita que el formulario se envíe de la forma tradicional
    mensajeError.textContent = '';

    const email = document.getElementById('floatingInput').value;
    const password = document.getElementById('floatingPassword').value;

    if (!email || !password) {
        mensajeError.textContent = 'Por favor, ingresa tu email y contraseña.';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión.');
        }

        // Guardamos la sesión en el almacenamiento local del navegador.
        // Esto es crucial para mantener al usuario logueado en futuras visitas.
        localStorage.setItem('app.session', JSON.stringify(data.session));

        alert('¡Bienvenido de nuevo!');
        window.location.href = '/'; // Redirige a la página principal

    } catch (error) {
        mensajeError.textContent = error.message;
        console.error('Error en el login:', error);
    }
});