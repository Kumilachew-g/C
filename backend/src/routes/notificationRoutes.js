const express = require('express');
const auth = require('../middleware/auth');
const { listNotifications, markAllAsRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(auth);

router.get('/', listNotifications);
router.post('/read-all', markAllAsRead);

module.exports = router;


