FROM node:22

WORKDIR /app

# Instalar CDS globalmente
RUN npm install -g @sap/cds-dk

# Copia los archivos de dependencias
COPY package*.json ./

# Instala dependencias del proyecto
RUN npm install

# Copia todo el proyecto
COPY . .

EXPOSE 3033
CMD ["npm", "start"]
