// 1. Inicializar el mapa (Centrado en tus terrenos de Hidalgo)
const map = L.map('map').setView([20.5183, -99.9074], 18); 

// 2. Agregar la capa de calles (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// 3. Función para definir los colores según el estado
function getColor(status) {
    switch(status) {
        case 'Disponible': return '#2ecc71'; // Verde
        case 'Apartado':   return '#f1c40f'; // Amarillo
        case 'Vendido':    return '#e74c3c'; // Rojo
        default:           return '#95a5a6'; // Gris
    }
}

// 4. Función Principal: Cargar terrenos desde tu API (Backend)
async function cargarTerrenos() {
    try {
        const response = await fetch('/api/terrenos');
        const terrenos = await response.json();

        // Recorre cada terreno recibido
        terrenos.forEach(terreno => {
            if (!terreno.GeoJsonData) return; // Saltar si no hay datos

            try {
                // *** 1. LIMPIEZA DE CADENA ***
                let cleanGeoData = terreno.GeoJsonData.replace(/[\n\t\r]/g, '').trim(); 
                
                // *** 2. PARSEO CRÍTICO ***
                const geoData = JSON.parse(cleanGeoData);

                // Dibuja el polígono en el mapa
                L.geoJSON(geoData, {
                    style: {
                        color: 'white', 
                        weight: 2,
                        fillColor: getColor(terreno.Status), 
                        fillOpacity: 0.6
                    },
                    // CONFIGURACIÓN DEL POPUP CORREGIDA
                    onEachFeature: function (feature, layer) {
                        // Formateo seguro del precio (MXN)
                        const formattedPrice = terreno.Price.toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            minimumFractionDigits: 2
                        });
                        
                        layer.bindPopup(`
                            <div style="text-align: center;">
                                <h3>Lote: ${terreno.Code}</h3>
                                <p><strong>Estado:</strong> ${terreno.Status}</p>
                                <p><strong>Precio:</strong> ${formattedPrice}</p>
                                <p><strong>Tamaño:</strong> ${terreno.Size} m²</p>
                                <button onclick="seleccionarTerreno(${terreno.LandId}, '${terreno.Status}', ${terreno.Price}, '${terreno.Code}', ${terreno.Size})" 
                                    style="background: #007bff; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">
                                    ${terreno.Status === 'Disponible' ? '🛒 Apartar Ahora' : '🔒 Ver Detalles'}
                                </button>
                            </div>
                        `);
                        
                        // Efecto visual al pasar el mouse
                        layer.on('mouseover', function () { this.setStyle({ fillOpacity: 0.9 }); });
                        layer.on('mouseout', function () { this.setStyle({ fillOpacity: 0.6 }); });
                    }
                }).addTo(map);

            } catch (e) {
                // Si el error ocurre, lo reportamos, pero el programa continúa
                console.error(`Error al parsear GeoJSON para ${terreno.Code} (LandId: ${terreno.LandId}):`, e.message);
                console.error("GeoJSON defectuoso:", terreno.GeoJsonData);
            }
        });

    } catch (error) {
        console.error("Error cargando el mapa:", error);
    }
}

// 5. Función que se ejecuta al dar clic en el botón del Popup
// Ahora acepta LandId, Status, Price, Code y Size.
function seleccionarTerreno(landId, status, price, code, size) { 

    // 1. Validación básica
    if (status !== 'Disponible') {
        alert("Este terreno no está disponible.");
        return;
    }

    // 2. Verificar si el usuario inició sesión
    const token = localStorage.getItem('token');

    if (!token) {
        if(confirm("Para apartar necesitas iniciar sesión. ¿Ir al Login?")) {
            window.location.href = '/login.html';
        }
        return;
    }

    // 3. Confirmación y Redirección al formulario
    if (confirm("¿Estás seguro que deseas apartar este terreno? Serás redirigido al formulario de registro y pago.")) {
        
        // 4. Redirección. Usamos encodeURIComponent para seguridad y quitamos saltos de línea.
        const encodedCode = encodeURIComponent(code);
        const encodedSize = encodeURIComponent(size);
        
        // Asegúrate de que esta línea esté construida correctamente.
        window.location.href = `/formulario_apartado.html?landId=${landId}&code=${encodedCode}&price=${price}&size=${encodedSize}`;
        
    }
}

// *** CORRECCIÓN DEL ERROR DE SINTAXIS (Ln 114) ***
// Aseguramos que la función seleccionarTerreno esté correctamente cerrada antes de la asignación.

window.seleccionarTerreno = seleccionarTerreno;

// 6. Ejecutar la carga al iniciar
cargarTerrenos();