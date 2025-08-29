// vms-backend/src/api/routes/webhook.routes.js
const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.post('/teams-approval', webhookController.handleTeamsApproval);
router.post('/google-chat-approval', webhookController.handleGoogleChatApproval);

module.exports = router;