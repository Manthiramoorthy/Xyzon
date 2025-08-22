const express = require('express');
const { getTemplateController } = require('../controllers/templateController');
const router = express.Router();

router.get('/', getTemplateController);

module.exports = router;
