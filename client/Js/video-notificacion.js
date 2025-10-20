document.addEventListener('DOMContentLoaded', () => {
    const videoNotification = document.getElementById('video-notification');
    const closeButton = document.getElementById('close-video-notification');
    const video = videoNotification ? videoNotification.querySelector('video') : null;

    // Si no existen los elementos, no hacemos nada.
    if (!videoNotification || !closeButton || !video) {
        return;
    }

    const CINCO_MINUTOS_EN_MS = 5 * 60 * 1000;

    // Función para mostrar la notificación y reproducir el video
    const mostrarNotificacion = () => {
        videoNotification.classList.add('show');
        // Intentamos reproducir el video. Si el navegador lo bloquea, el usuario puede usar los controles.
        video.play().catch(error => {
            console.warn("La reproducción automática del video fue bloqueada por el navegador.", error);
        });
    };

    // Función para ocultar la notificación, pausar el video y programar la siguiente aparición
    const ocultarYProgramar = () => {
        videoNotification.classList.remove('show');
        video.pause();

        // Programar para que vuelva a aparecer en 5 minutos
        setTimeout(mostrarNotificacion, CINCO_MINUTOS_EN_MS);
    };

    // 1. Mostrar la notificación por primera vez después de 5 segundos.
    setTimeout(() => {
        mostrarNotificacion();
    }, 5000);

    // 2. Cuando el usuario la cierra, la ocultamos y programamos la siguiente.
    closeButton.addEventListener('click', ocultarYProgramar);
});