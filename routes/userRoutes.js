const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/signin').post(authController.signin);
router
  .route('/deleteUserData')
  .patch(authController.protect, userController.deleteUserData);
router
  .route('/updateUserData')
  .patch(authController.protect, userController.updateUserData);
router.route('/login').post(authController.login);
router.route('/verify/').get(authController.checkVerifyCode);
router.route('/fotgotpassword').post(authController.forgotpassword);
router.route('/resetpassword/:token').post(authController.resetpassword);
router
  .route('/updatePassword')
  .patch(authController.protect, userController.updateUserPassword);
router
  .route('/')
  .get(authController.protect, userController.getAllUsers)
  .post(authController.protect, userController.addUser);
router
  .route('/:id')
  .get(authController.protect, userController.getUserById)
  .patch(authController.protect, userController.updateUser)
  .delete(
    authController.protect,
    authController.role(['admin', 'team-lead']),
    userController.deleteUser
  );

module.exports = router;
