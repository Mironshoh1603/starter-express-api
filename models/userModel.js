const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// 1.name, 2.email, 3.photo, 4.password, 5.passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name kiritishingiz shart!'],
    maxlength: 64,
    minlength: 1,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email kiritishingiz shart!'],
    unique: [true, 'Siz oldin foydalanilgan email kiritdingiz'],
    lowercase: true,
    validate: [validator.isEmail, 'Tugri email kiriting!'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'team-lead', 'admin', 'lead-guide'],
    default: 'user',
  },

  password: {
    type: String,
    required: [true, 'Siz passwordni kiritishingiz shart'],
    validate: [
      validator.isStrongPassword,
      'Siz kuchliroq parolni kiritishingiz kerak',
    ],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Siz passwordni kiritishingiz shart'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Siz bir xil password kiriting',
    },
  },
  passwordChangeDate: {
    type: Date,
    default: null,
  },
  resetTokenHash: {
    type: String,
  },
  resetTokenTime: {
    type: Date,
  },
  resetVerifyHash: {
    type: String,
  },
  resetVerifyTime: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const hashPassword = await bcrypt.hash(this.password, 12);
  this.password = hashPassword;
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.hashTokenMethod = function () {
  const token = crypto.randomBytes(32).toString('hex');

  const hashToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetTokenHash = hashToken;
  this.resetTokenTime = Date.now() + 10 * 60 * 1000;
  return token;
};
userSchema.methods.hashVerifyMethod = function () {
  const token = crypto.randomBytes(4).toString('hex');

  const hashToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetVerifyHash = hashToken;
  this.resetVerifyTime = Date.now() + 10 * 60 * 1000;
  return token;
};

const User = mongoose.model('users', userSchema);

module.exports = User;
