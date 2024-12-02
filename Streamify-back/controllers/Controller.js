const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { S3Client } = require("@aws-sdk/client-s3");
const User = require('../models/User');
const UserInfo = require('../models/UserInfo');
const Video = require('../models/Videos');

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
    try {
        // Obtener el encabezado de autorización
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Extrae el token del encabezado "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({ message: 'No se proporcionó token de autorización' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Añadir el usuario a la solicitud
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        console.error('Error de autenticación:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, proporciona correo y contraseña' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Usuario no existe.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Contraseña incorrecta.' });
        }

        const userInfo = await UserInfo.findOne({ user_id: user._id }).select('name');

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user._id,
                name: userInfo ? userInfo.name : null,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Error en loginUser:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
}

const register = async (req, res) => {
    try {
        const { name, birthdate, email, password = 'user' } = req.body;

        if (!name || !birthdate || !email || !password ) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword
        });

        await newUser.save();

        const newUserInfo = new UserInfo({
            user_id: newUser._id,
            name,
            birthdate
        });

        await newUserInfo.save();

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: newUser._id,
                name: newUserInfo.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Error detallado en registro:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Error de validación', details: error.errors });
        }
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
});

const UploadVideo = async (req, res) => {
    try {
        const { name, description } = req.body;
        const file = req.file;

        if (!name || !description || !file) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        // Verificar que req.user esté definido (ahora manejado por el middleware de autenticación)
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'No autorizado. Usuario no autenticado.' });
        }

        // Subir el archivo a S3
        const { url, key } = await Video.uploadToS3(file);

        // Crear nuevo documento de video
        const newVideo = new Video({
            name,
            description,
            url,
            uploadedBy: req.user._id,
        });

        await newVideo.save();

        res.status(201).json({
            message: 'Video subido exitosamente',
            video: {
                id: newVideo._id,
                name: newVideo.name,
                description: newVideo.description,
                url: newVideo.url,
            },
        });
    } catch (error) {
        console.error('Error en uploadVideo:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

const getUserVideos = async (req, res) => {
    try {
      const userId = req.user._id; // Asumiendo que tienes autenticación y req.user está disponible
      const videos = await Video.find({ uploadedBy: userId });
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener los videos del usuario", error });
    }
  };

module.exports = {
    loginUser,
    register,
    UploadVideo,
    authenticateToken,
    getUserVideos  
};