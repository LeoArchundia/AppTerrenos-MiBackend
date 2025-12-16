#!/bin/bash
# Script para instalar dependencias de html-pdf (PhantomJS)

# 1. Instalar las librerías del sistema operativo requeridas por PhantomJS
apt-get update && apt-get install -y libfontconfig libfreetype6

# 2. Navegar al directorio de la aplicación
cd /home/site/wwwroot/backend-terrenos

# 3. Iniciar la aplicación Node.js
# Asegúrate de que este comando coincide con tu script 'start' en package.json
npm start