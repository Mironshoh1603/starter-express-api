const User = require('../models/userModel');
const catchErrorAsync = require('../utility/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utility/appError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mail = require('../utility/mail');

const saveTokenCookie = (req, res, token) => {
  res.cookie('jwt', token, {
    maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600 * 1000,
    httpOnly: true,
    secure: req.protocol === 'https' ? true : false,
  });
};

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = catchErrorAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    photo: req.body.photo,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeDate: req.body.passwordChangeDate,
  });

  const token = createToken(newUser._id);
  saveTokenCookie(req, res, token);

  res.status(200).json({
    status: 'success',
    token: token,
    data: newUser,
  });
});

const signin = catchErrorAsync(async (req, res, next) => {

  // 1) Email bilan password borligini tekshirish

  const { email, password } = { ...req.body };

  if (!email || !password) {
    return next(new AppError('Email yoki passwordni kiriting! Xato!!!', 401));
  }

  // 2) Shunaqa odam bormi yuqmi shuni tekshirish
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(
      new AppError('Bunday user mavjud emas. Iltimos royxatdan uting!', 404)
    );
  }

  // 3) password tugri yokin notugriligini tekshirish
  const tekshirHashga = async (oddiyPassword, hashPassword) => {
    const tekshir = await bcrypt.compare(oddiyPassword, hashPassword);
    return tekshir;
  };

  if (!(await tekshirHashga(password, user.password))) {
    return next(
      new AppError(
        'Sizning parol yoki loginingiz xato! Iltimos qayta urinib kuring!',
        401
      )
    );
  }
  // 4) JWT token yasab berish
  const token = createToken(user._id);

  saveTokenCookie(req, res, token);

  // 5) Response qaytarish
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

const protect = catchErrorAsync(async (req, res, next) => {
  // 1) Token bor yuqligini headerdan tekshirish
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('Siz tizimga kirishingiz shart!'));
  }
  // 2) Token ni tekshirish Serverniki bilan clientnikini solishtirish

  const tekshir = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(tekshir.id);

  if (!user) {
    return next(
      new AppError('Bunday user mavjud emas.iltimos tizimga qayta kiring!', 401)
    );
  }

  if (!tekshir) {
    return next(
      new AppError('Bunday token mavjud emas. Iltimos qayta tizimga kiring!')
    );
  }

  // 3) Token ichidan idni olib databasedagi userni topamiz.

  // 4)Agar parol uzgargan bulsa tokeni amalqilmasligini taminlash

  if (user.passwordChangeDate) {
    // console.log(tekshir.iat);
    if (tekshir.iat < user.passwordChangeDate.getTime() / 1000) {
      return next(
        new AppError("Sizning Tokenningiz vaqti o'tgan yaroqsiz", 401)
      );
    }
  }
  req.user = user;

  next();
});

const role = (roles) => {
  return catchErrorAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Siz Bunday huquqqa ega emassiz!', 401));
    }
    next();
  });
};
const checkVerifyCode = catchErrorAsync(async (req, res, next) => {
  const code = req.body.code;
  const verifyCode = crypto.createHash('sha256').update(code).digest('hex');
  const user = await User.findOne({
    resetVerifyHash: verifyCode,
    resetVerifyTime: { $gt: Date.now() },
  });
  console.log();
  if (!user) {
    return next(new AppError('Bazada bunday email mavjud emas', 401));
  }
  const userToken = createToken(user.id);
  saveTokenCookie(req, res, userToken);

  res.status(201).json({
    status: 'Succes',
    token: userToken,
    message: 'Siz muvafaqiyatli kirdingiz!',
  });
  next();
});

const resetpassword = catchErrorAsync(async (req, res, next) => {
  console.log('errorcha');
  // 1 token olamiz
  const token = req.params.token;
  const hashToken = crypto.createHash('sha256').update(token).digest('hex');
  // 2 tokenni tekshiramiz turgiligi va muddatini
  const user = await User.findOne({
    resetTokenHash: hashToken,
    resetTokenTime: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Bazada bunday email mavjud emas', 401));
  }
  console.log(!req.body.password || !req.body.passwordConfirm);
  if (!req.body.password || !req.body.passwordConfirm) {
    return next(new AppError('Passwordlarni berish majburiy', 401));
  }
  if (!(req.body.password === req.body.passwordConfirm)) {
    return next(new AppError('Passwordlarni bir biriga mos emas!', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetTokenHash = undefined;
  user.resetTokenTime = undefined;
  user.passwordChangeDate = Date.now();

  await user.save();
  const userToken = createToken(user.id);
  saveTokenCookie(req, res, userToken);

  res.status(201).json({
    status: 'Succes',
    token: userToken,
    message: 'Sizning parolingiz yangilandi',
  });
  next();
  // 3 yangi parolni saqlaymiz
  // JWT yuboramiz
});

const forgotpassword = catchErrorAsync(async (req, res, next) => {
  // 1)email kiritganlikni tekshirish
  if (!req.body.email) {
    return next(new AppError('emailni kiritishingiz kerak!', 401));
  }
  // 2)shu email orqali databasedan tekshirish
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Bazada bunday email mavjud emas', 401));
  }
  // 3)reset token yaratish

  const token = user.hashTokenMethod();
  await user.save({ validateBeforeSave: false });
  // 4)reset Token xabarini jo'natish to email
  const resetLink = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${token}`;
  const subject = 'Yangisi';
  const html = `<h1>Siz paswordni yangilash uchun quyidagi tugmaninbosing ${resetLink}</h1>`;
  const to = req.body.email;
  await mail({ subject, html, to });
  res.status(200).json({
    status: 200,
    message: 'your token has been sent to email',
  });
  next();
  return;
});
const login = catchErrorAsync(async (req, res, next) => {
  const { email, password } = { ...req.body };
  if (!email || !password) {
    return next(new AppError('Email yoki passwordni kiriting! Xato!!!', 401));
  }

  // 2) Shunaqa odam bormi yuqmi shuni tekshirish
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(
      new AppError('Bunday user mavjud emas. Iltimos royxatdan uting!', 404)
    );
  }

  // 3) password tugri yokin notugriligini tekshirish
  const tekshirHashga = async (oddiyPassword, hashPassword) => {
    const tekshir = await bcrypt.compare(oddiyPassword, hashPassword);
    return tekshir;
  };

  if (!(await tekshirHashga(password, user.password))) {
    return next(
      new AppError(
        'Sizning parol yoki loginingiz xato! Iltimos qayta urinib kuring!',
        401
      )
    );
  }

  const resetCode = user.hashVerifyMethod();
  await user.save({ validateBeforeSave: false });
  const subject = 'Sizning vertifikatsiya kodingiz';
  const html = `<h1>Siz verifikatsiyakodingiz   <span>${resetCode}</span></h1>`;

  const to = email;
  await mail({ subject, html, to });
  res.status(200).json({
    status: 200,
    message: 'your code has been sent to email',
  });

  next();
  return;
});

module.exports = {
  signup,
  signin,
  protect,
  role,
  resetpassword,
  forgotpassword,
  login,
  checkVerifyCode,
  createToken,
};
