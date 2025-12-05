# Usa la imagen oficial de Node 22
FROM node:22

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia solo los archivos de dependencias primero
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del proyecto
COPY . .

# Expón el puerto de la app
EXPOSE 3033

# Comando por defecto
CMD ["npm", "start"]
