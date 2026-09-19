const express = require('express');
const {
  getOverview,
  listUsers,
  setUserActiveStatus,
  setShopApproval,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/overview', getOverview);
router.get('/users', listUsers);
router.patch('/users/:id/status', setUserActiveStatus);
router.patch('/shops/:id/approval', setShopApproval);

module.exports = router;

