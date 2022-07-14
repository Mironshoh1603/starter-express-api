const User = require('../models/userModel');
const catchErrorAsync = require('../utility/catchAsync');
const bcrypt = require('bcryptjs');
const AppError = require('../utility/appError');
const authController = require('./authController');

const getAllUsers = catchErrorAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    data: users,
  });
});

const addUser = (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'This route has not created yet!',
  });
};
const updateUser = (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'This route has not created yet!',
  });
};
const getUserById = (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'This route has not created yet!',
  });
};
const deleteUser = catchErrorAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(201).json({
    status: 'Succes',
    message: 'Choosen user has been deleted!',
  });
});

const updateUserPassword = catchErrorAsync(async (req, res, next) => {
  // 1 eski passwordni tekshirib ko'ramiz

  const user = await User.findById(req.user.id).select('+password');

  const tekshir = await bcrypt.compare(req.body.oldPassword, user.password);
  console.log('salom: ', tekshir);
  if (!tekshir) {
    return next(new AppError("Siz Parolingizni no'to'g'ri kiritdingiz", 404));
  }

  if (req.body.newPassword === user.password) {
    return next(new AppError('Siz yangi parolni boshqa kiriting:', 401));
  }
  if (req.body.newPassword !== req.body.newPasswordConfirm) {
    // 2 yangi pariolni saqlaymiz

    return next(new AppError("Siz iiki xil parol kiritib qo'ydingiz", 401));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  user.passwordChangeDate = Date.now();
  await user.save();

  //
  const token = authController.createToken(user._id);
  saveTokenCookie(res, userToken);
  res.status(200).json({
    status: 'Fail',
    token: token,
    message: "parol o'zgardi",
  });
});

const updateUserData = catchErrorAsync(async (req, res, next) => {
  // ma'lumotlarni yangilash
  const user = await User.findById(req.user.id);
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.photo = req.body.photo || user.photo;
  const newUser = await user.save({ validateBeforeSave: false });
  res.status(201).json({
    status: 'Succes',
    data: newUser,
  });
  next();
});

const deleteUserData = catchErrorAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('active password');

  const tekshir = bcrypt.compare(req.body.password, user.password);
  if (!tekshir) {
    return next(new AppError('Siz parolni xato kiritdingiz!', 401));
  }

  user.active = false;
  await user.save({ validateBeforeSave: false });
  res.status(204).json({
    status: 'Succes',
    data: null,
  });
});

// Security Best Prictice 

module.exports = {
  getAllUsers,
  updateUserData,
  deleteUserData,
  updateUserData,
  updateUserPassword,
  addUser,
  getUserById,
  updateUser,
  deleteUser,
};
