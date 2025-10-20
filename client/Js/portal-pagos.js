document.addEventListener('DOMContentLoaded', () => {
    const PRECIO_POR_CREDITO = 20000;
    const MONEDA = 'COP';

    const cantidadInput = document.getElementById('cantidad-creditos');
    const totalPagarDisplay = document.getElementById('total-a-pagar');
    const form = document.getElementById('form-comprar-creditos');
    const notificacionesContainer = document.getElementById('notificaciones-container');

    // Función para mostrar notificaciones
    const mostrarNotificacion = (mensaje, tipo = 'success') => {
        notificacionesContainer.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    };

    // Función para actualizar el total a pagar
    const actualizarTotal = () => {
        const cantidad = parseInt(cantidadInput.value) || 0;
        const total = cantidad * PRECIO_POR_CREDITO;
        totalPagarDisplay.textContent = `$${total.toLocaleString('es-CO')} ${MONEDA}`;
    };

    // Verificar si el usuario está logueado
    const sessionData = localStorage.getItem('app.session');
    if (!sessionData) {
        window.location.href = '/Login.html'; // Redirigir si no hay sesión
        return;
    }
    const session = JSON.parse(sessionData);

    // Event listener para el cambio en la cantidad
    cantidadInput.addEventListener('input', actualizarTotal);

    // Event listener para el envío del formulario
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const cantidad = parseInt(cantidadInput.value);
        if (!cantidad || cantidad < 1) {
            mostrarNotificacion('La cantidad de créditos debe ser al menos 1.', 'warning');
            return;
        }

        const usuario_id = session.user.id;

        try {
            // 1. Llamar a nuestro backend para crear una sesión de pago personalizada
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cantidad: cantidad,
                    usuario_id: usuario_id,
                }),
            });

            const sessionData = await response.json();

            if (!response.ok) throw new Error(sessionData.error || 'No se pudo iniciar el pago.');

            // 2. Redirigir al usuario a la URL de pago de Stripe que nos dio el backend
            window.location.href = sessionData.url;
        } catch (error) {
            mostrarNotificacion(error.message, 'danger');
        }
    });

    // Inicializar el total
    actualizarTotal();
});