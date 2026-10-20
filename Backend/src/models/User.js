const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    instagram: { type: String, required: true, trim: true, maxlength: 80 },
    followers: { type: Number, required: true, min: 0 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
