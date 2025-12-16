#!/bin/bash
# Script para instalar dependencias de html-pdf (PhantomJS)

# 1. Instalar las librerías del sistema operativo requeridas por PhantomJS
apt-get update && apt-get install -y libfontconfig libfreetype6

# 2. **FIX DE OPENSSL/html-pdf**
# Esto previene el error "libproviders.so: cannot open shared object file"
export OPENSSL_CONF=/dev/null 

# 3. Navegar al directorio de la aplicación
cd /home/site/wwwroot/backend-terrenos

# 4. Iniciar la aplicación Node.js
npm start