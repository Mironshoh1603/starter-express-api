const express = require('express');
const app = require('../app');
const tourController = require('./../controllers/tourController');
const authcontroller = require('../controllers/authController');
const router = express.Router();

router.use(
  '/the-best-3-tours',
  (req, res, next) => {
    req.query.sort = '-price';
    req.query.limit = 3;
    next();
  },
  tourController.getAllTours
);

router.route('/stats').get(tourController.tourStats);
router.route('/report/:year').get(tourController.tourReportYear);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authcontroller.protect, tourController.addTour);
router
  .route('/:id')
  .get(authcontroller.protect, tourController.getTourById)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
