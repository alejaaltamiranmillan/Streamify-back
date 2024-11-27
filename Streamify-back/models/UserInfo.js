const mongoose = require('mongoose');

const UserInfoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    birthdate: { type: Date, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true,
    versionKey: false, 
  }
);

module.exports = mongoose.model('UserInfo', UserInfoSchema);