const express = require('express');
const auth = require('../middleware/auth');
const { 
  listNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount 
} = require('../controllers/notificationController');

const router = express.Router();

router.use(auth);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

module.exports = router;


