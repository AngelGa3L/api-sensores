Instala las dependencias:
   ```bash
   npm install
   ```
Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz con tu conexión de base de datos:
     ```
     DATABASE_URL="mysql://usuario:contraseña@localhost:3306/tu_basededatos"
     ```
Genera el cliente de Prisma y ejecuta las migraciones:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
Inicia el servidor:
   ```bash
   node app.js
   ```
