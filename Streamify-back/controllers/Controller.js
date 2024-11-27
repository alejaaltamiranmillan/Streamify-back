const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserInfo = require('../models/UserInfo');

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

module.exports = {
    loginUser,
    register
};
