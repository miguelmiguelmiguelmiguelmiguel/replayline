const jsonPath = 'data.json';
const contenedor = document.getElementById('frases-container');

// Variables globales para la paginación
let todasLasFrases = [];
let paginaActual = 1;
const tarjetasPorPagina = 25; // Define 5x5 = 25

// --- FUNCIONES PARA LA PÁGINA PRINCIPAL (index.html) ---

function crearElementoFrase(item, index) {
    const div = document.createElement('div');
    div.className = 'frase';
    div.id = `frase-${index + 1}`;

    // Usamos item.frase aquí, ya que es el dato que se muestra en la tarjeta
    div.innerHTML = `
        <h3>${item.nombre || 'Desconocido'}</h3>
        <p>"${item.frase || 'Frase no disponible'}"</p>
        <a href="frase.html?id=${index + 1}">Ver vídeo</a> 
    `;

    return div;
}

// Muestra las tarjetas para la página actual
function mostrarPagina() {
    if (!contenedor) return;

    // Calcular los índices de inicio y fin
    const inicio = (paginaActual - 1) * tarjetasPorPagina;
    const fin = inicio + tarjetasPorPagina;

    // Obtener las frases de la página actual
    const frasesDePagina = todasLasFrases.slice(inicio, fin);

    // Limpiar el contenedor y añadir las nuevas tarjetas
    contenedor.innerHTML = '';
    frasesDePagina.forEach((item, i) => 
        contenedor.appendChild(crearElementoFrase(item, inicio + i))
    );

    // Actualizar los controles de paginación
    actualizarControlesPaginacion();
}

// Actualiza el estado de los botones y el texto informativo
function actualizarControlesPaginacion() {
    const totalPaginas = Math.ceil(todasLasFrases.length / tarjetasPorPagina);
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    if (pageInfo) {
        pageInfo.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    }

    if (prevBtn) {
        prevBtn.disabled = paginaActual === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = paginaActual === totalPaginas || totalPaginas === 0;
    }
}


async function cargarFrases() {
    if (!contenedor) return; // Asegurar que solo se ejecuta si estamos en index.html

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const frases = await response.json();
        if (!Array.isArray(frases)) throw new Error("El JSON no contiene una lista válida");

        // 1. Guardar todas las frases globalmente
        todasLasFrases = frases; 
        
        // 2. Mostrar la primera página
        mostrarPagina();

        // 3. Añadir Event Listeners para la paginación
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (paginaActual > 1) {
                    paginaActual--;
                    mostrarPagina();
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Mover al inicio
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPaginas = Math.ceil(todasLasFrases.length / tarjetasPorPagina);
                if (paginaActual < totalPaginas) {
                    paginaActual++;
                    mostrarPagina();
                    window.scrollTo({ top: 0, behavior: 'smooth' }); // Mover al inicio
                }
            });
        }

    } catch (error) {
        console.error('Error al cargar frases en index:', error);
        contenedor.innerHTML = `<p style="color:#ff2200;">Error cargando las frases.</p>`;
    }
}

// ---------------------------------------------------------------- //

// --- FUNCIONES PARA LA PÁGINA INDIVIDUAL (frase.html) ---

function getFraseIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id')); 
    return isNaN(id) ? null : id; 
}

function convertToEmbedUrl(youtubeUrl) {
    if (!youtubeUrl) return '';
    const videoIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|embed\/|v\/)([^&?#]+)/);
    
    if (videoIdMatch && videoIdMatch[1]) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&rel=0`; 
    }
    return '';
}

async function cargarFraseIndividual() {
    const id = getFraseIdFromUrl();

    if (!id) {
        const tituloJuego = document.getElementById('titulo-juego');
        if (tituloJuego) tituloJuego.textContent = 'Error: ID no encontrado.';
        const textoFrase = document.getElementById('texto-frase');
        if (textoFrase) textoFrase.textContent = 'Por favor, acceda desde un enlace de la página principal.';
        return;
    }

    try {
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const frases = await response.json();

        const item = frases[id - 1]; 

        if (item) {
            const tituloJuego = document.getElementById('titulo-juego');
            const textoFrase = document.getElementById('texto-frase');
            const videoFrame = document.getElementById('video-frame');

            if (tituloJuego) tituloJuego.textContent = item.nombre || 'Juego Desconocido';
            
            // Lógica para usar 'descripcion' (o 'frase' como fallback)
            const textoMostrar = item.descripcion || item.frase || 'Descripción no disponible';
            if (textoFrase) textoFrase.textContent = `"${textoMostrar}"`;
            
            if (videoFrame) videoFrame.src = convertToEmbedUrl(item.url);
        } else {
            const tituloJuego = document.getElementById('titulo-juego');
            if (tituloJuego) tituloJuego.textContent = 'Error: Frase no encontrada.';
            const textoFrase = document.getElementById('texto-frase');
            if (textoFrase) textoFrase.textContent = `No se encontró ninguna frase con el ID ${id}.`;
        }

    } catch (error) {
        console.error('Error al cargar la frase individual:', error);
        const tituloJuego = document.getElementById('titulo-juego');
        if (tituloJuego) tituloJuego.textContent = 'Error de Carga.';
    }
}

// ---------------------------------------------------------------- //

// --- LÓGICA DE EJECUCIÓN BASADA EN LA PÁGINA ---

document.addEventListener('DOMContentLoaded', () => {
    
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        // Ejecuta la carga con paginación para la página principal
        cargarFrases();
    } else if (currentPage === 'frase.html') {
        // Ejecuta la carga individual del video
        cargarFraseIndividual();
    }
});