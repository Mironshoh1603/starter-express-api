const Review = require('../models/reviewModel');
const AppError = require('../utility/appError');
const catchAsyncError = require('../utility/catchAsync');

const getAllReviews = catchAsyncError(async (req, res, next) => {
  const review = await Review.find()
    .populate({
      path: 'user',
      select: 'name photo',
    })
    .populate({
      path: 'tour',
      select: 'name duration',
    });
  res.status(200).json({
    status: 'Succes',
    data: review,
  });
});

const AddReview = catchAsyncError(async (req, res, next) => {
  const data = await Review.create(req.body);

  res.status(200).json({
    status: 'Succes',
    data: data,
  });
});

module.exports = { AddReview, getAllReviews };
