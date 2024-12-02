const mongoose = require('mongoose');
const { S3Client, PutObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

// Configuración del cliente S3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
  });

// Función para verificar la conexión con S3
async function checkS3Connection() {
  try {
    const command = new ListBucketsCommand({});
    await s3.send(command);
    console.log('Conexión exitosa con S3');
  } catch (error) {
    console.error('Error al conectar con S3:', error);
  }
}

// Llamar a la función de verificación
checkS3Connection();

// Esquema de Video
const videoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Método para subir el archivo a S3
videoSchema.statics.uploadToS3 = async function(file) {
  const stream = fs.createReadStream(file.path);
  const fileKey = `videos/${Date.now()}-${file.originalname}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: stream,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    const result = await s3.send(command);
    
    // Construir la URL del video
    const videoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    
    // Eliminar el archivo temporal
    fs.unlinkSync(file.path);
    
    console.log('Archivo subido exitosamente a S3');
    return { url: videoUrl, key: fileKey };
  } catch (error) {
    console.error("Error al subir el archivo a S3:", error);
    throw error;
  }
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;

