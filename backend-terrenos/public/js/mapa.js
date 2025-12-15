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
        // Pide los datos al servidor
        const response = await fetch('/api/terrenos');
        const terrenos = await response.json();

        // Recorre cada terreno recibido
        terrenos.forEach(terreno => {
            // Convierte el texto JSON de la BD a un objeto real
            const geoData = JSON.parse(terreno.GeoJsonData);

            // Dibuja el polígono en el mapa
            L.geoJSON(geoData, {
                style: {
                    color: 'white',               // Borde blanco
                    weight: 2,
                    fillColor: getColor(terreno.Status), // Relleno según estado
                    fillOpacity: 0.6
                },
                // Configura el Popup al hacer clic
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(`
                        <div style="text-align: center;">
                            <h3>Lote: ${terreno.Code}</h3>
                            <p><strong>Estado:</strong> ${terreno.Status}</p>
                            <p><strong>Precio:</strong> $${terreno.Price.toLocaleString()}</p>
                            <p><strong>Tamaño:</strong> ${terreno.Size} m²</p>
                            <button onclick="seleccionarTerreno(${terreno.LandId}, '${terreno.Status}')" 
                                style="background: #333; color: white; border: none; padding: 5px 10px; cursor: pointer;">
                                ${terreno.Status === 'Disponible' ? '🛒 Apartar Ahora' : '🔒 Ver Detalles'}
                            </button>
                        </div>
                    `);
                    
                    // Efecto visual al pasar el mouse
                    layer.on('mouseover', function () { this.setStyle({ fillOpacity: 0.9 }); });
                    layer.on('mouseout', function () { this.setStyle({ fillOpacity: 0.6 }); });
                }
            }).addTo(map);
        });

    } catch (error) {
        console.error("Error cargando el mapa:", error);
    }
}

// 5. Función que se ejecuta al dar clic en el botón del Popup
async function seleccionarTerreno(landId, status) {
    
    // 1. Validación básica: Si no está disponible, no hacemos nada
    if (status !== 'Disponible') {
        alert("Este terreno no está disponible.");
        return;
    }

    // 2. Verificar si el usuario inició sesión (¿Tiene Token?)
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Si no hay token, lo mandamos a iniciar sesión
        if(confirm("Para apartar necesitas iniciar sesión. ¿Ir al Login?")) {
            window.location.href = '/login.html';
        }
        return;
    }

    // 3. Confirmación del usuario
    if (!confirm("¿Estás seguro que deseas apartar este terreno?")) {
        return; // Si dice que no, cancelamos
    }

    // 4. ENVIAR LA ORDEN AL BACKEND (Aquí ocurre la magia)
    try {
        const response = await fetch('/api/reservas/apartar', {
            method: 'POST', // Es una orden de escritura
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- IMPORTANTE: Aquí va tu credencial
            },
            body: JSON.stringify({ 
                landId: landId // Solo enviamos el ID del terreno
                // No necesitamos enviar el email, el backend lo busca solo
            })
        });

        const data = await response.json();

        if (response.ok) {
            // SI TODO SALIÓ BIEN:
            alert("✅ ¡Felicidades! " + data.msg); // Muestra el mensaje del backend
            location.reload(); // Recarga la página para ver el terreno amarillo
        } else {
            // SI HUBO ERROR (Ej. ya lo ganó otro):
            alert("⚠️ Error: " + data.msg);
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor.");
    }
}

// 6. Ejecutar la carga al iniciar
cargarTerrenos();