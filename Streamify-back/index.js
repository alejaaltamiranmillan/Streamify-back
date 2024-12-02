const express = require('express');
const { urlencoded, json } = require('express');
const router = require('./routes/Routes.js'); 
const cors = require('cors');
const connMongoDB = require('./db/db.js'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a la base de datos
connMongoDB();

app.use(urlencoded({ extended: true }));
app.use(json());

// Configuración de CORS para permitir acceso desde los orígenes específicos
const corsOptions = {
  origin: ['http://localhost:5173', 'https://streamify-back.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Habilita el envío de cookies o credenciales
};

app.use(cors(corsOptions));

app.get('/', async (req, res) => {
  res.send("estoy vivooooooooo");
});

// Rutas
app.use('/v1', router); // Usar todas las rutas en router

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`);
});