const express = require('express');
const router = express.Router();
const controller = require('../controllers/Controller');


//estas son las APIS
router
    .post('/LoginUser', controller.loginUser)
    .post('/register', controller.register)

module.exports = router;