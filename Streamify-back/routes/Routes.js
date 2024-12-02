const express = require('express');
const router = express.Router();
const controller = require('../controllers/Controller');
const multer = require('multer');
const { authenticateToken } = require('../middleware/Auth'); // Añade esta línea

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // asegúrate de que este directorio exista
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop())
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // límite de 1GB
});

// Estas son las APIS
router
    .post('/LoginUser', controller.loginUser)
    .post('/register', controller.register)
    .post('/UploadVideo', authenticateToken, upload.single('video'), controller.UploadVideo)
    .get('/UserVideos', authenticateToken, controller.getUserVideos)

module.exports = router;