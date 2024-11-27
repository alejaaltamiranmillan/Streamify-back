const mongoose = require("mongoose");
require("dotenv").config();

const connMongoDB = () => {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("DB Connected");
    })
    .catch((err) => {
      console.error("[db err]", err);
      setTimeout(connMongoDB, 200); // Intentar reconectar automáticamente
    });

  mongoose.connection.on("error", (err) => {
    console.error("[db err]", err);
    if (err.message && err.message.includes("ECONNREFUSED")) {
      connMongoDB(); // Intentar reconectar en caso de pérdida de conexión
    } else {
      throw err;
    }
  });
};

connMongoDB();

module.exports = connMongoDB;