const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

module.exports = { authenticateToken };