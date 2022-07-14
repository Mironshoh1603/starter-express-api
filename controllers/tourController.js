const Tour = require('./../models/tourModel');
const featureApi = require('./../utility/featureApi');
const catchAsyncError = require('./../utility/catchAsync');
const AppError = require('../utility/appError');

const getAllTours = catchAsyncError(async (req, res) => {
  const query = new featureApi(req.query, Tour)
    .filter()
    .sorting()
    .field()
    .pagination();

  const tours = query.databaseQuery;
  const data = await tours
    .find()
    .populate({
      path: 'guides',
      select: '-__v -passwordChangedDate -role',
    })
    .populate({
      path: 'reviews',
    });

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: data,
  });
});

// Add Tour
const addTour = catchAsyncError(async (req, res) => {
  const data = req.body;
  const tour = await Tour.create(data);
  res.status(201).json({
    status: 'success',
    data: tour,
  });
});

// Get Tour by Id
const getTourById = catchAsyncError(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate({
    path: 'guides',
    select: '-__v -passwordChangedDate -role',
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: tour,
  });
});

// Update Tour
const updateTour = catchAsyncError(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: tour,
  });
});

// Delete Tour
const deleteTour = catchAsyncError(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: tour,
  });
});

const tourStats = catchAsyncError(async (req, res) => {
  const data = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numberTours: { $sum: 1 },
        urtachaNarx: { $avg: '$price' },
        engArzonNarx: { $min: '$price' },
        engQimmatNarx: { $max: '$price' },
        urtachaReyting: { $avg: '$ratingsAverage' },
      },
    },
    { $sort: { urtachaNarx: -1 } },
    { $project: { _id: 0 } },
  ]);
  res.status(200).json({
    status: 'success',
    results: data.length,
    data: data,
  });
});

// Yilni tanlay (2021)
//

const tourReportYear = catchAsyncError(async (req, res) => {
  const data = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${req.params.year}-01-01`),
          $lte: new Date(`${req.params.year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        tourlarSoni: { $sum: 1 },
        tourNomi: { $push: '$name' },
      },
    },
    { $addFields: { qaysiOyligi: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { tourlarSoni: -1 } },
    { $limit: 2 },
  ]);
  res.status(200).json({
    status: 'success',
    results: data.length,
    data: data,
  });
});

module.exports = {
  getAllTours,
  addTour,
  getTourById,
  updateTour,
  deleteTour,
  tourStats,
  tourReportYear,
};
