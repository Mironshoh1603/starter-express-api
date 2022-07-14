const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'You must enter reviews!'],
  },
  rating: {
    type: Number,
    max: 5,
    min: 1,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'users',
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'tours',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Review = mongoose.model('reviews', reviewSchema);

module.exports = Review;
