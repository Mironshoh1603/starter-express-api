const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize'); //req bodyn himayalash uchun
var xss = require('xss-clean'); //html ichidagai viruslarni ushlaydi
var hpp = require('hpp'); //urldagi xatolarni ushlaydi sort=duration&sort=name

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utility/appError');
const ErrorController = require('./controllers/errorController');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  message: "Siz ko'p so'rov berib yubordingiz!",
  max: 20, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(helmet());

app.use('/api', limiter);

app.use(express.static(`${__dirname}/public`));

app.use(morgan('dev'));

app.use(express.static('public'));
app.use(express.static('dev-data'));

app.use((req, res, next) => {
  req.time = '12.04.2022';
  next();
});
// app.get('/', (req, res) => {
//   res.status(200).json({
//     message: 'This server is working!',
//     data: 'Bu yerda json chiqishi kerak edi',
//   });
// });

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', addTour);
// app.get('/api/v1/tours/:id', getTourById);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', function (req, res, next) {
  next(new AppError(`this url has not found: ${req.originalUrl}`, 404));
});

app.use(ErrorController);

module.exports = app;

// Overview of Error handling

// 1)Operation errors
//
// 1. Xato url berish
// 2. Inputga kiritilayotgan xato malumot
// 3. Serverga tugri ulanolmaslik (Sekin internet)
// 4. Database ulanolmaslik
// 5....

// 2)Programming Errors
//
// 1. property ni uqiyotganda undefined bulishi
// 2. await dan foydalanish async siz
// 3. req.body ni ishlatish req.query urniga
// 4....

// Global Error handling middleware
