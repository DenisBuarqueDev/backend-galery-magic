const express = require("express");
const { createPreference, handleWebhook  } = require("../controllers/paymentController");

const router = express.Router();

router.post("/create", createPreference);
router.post("/webhook", handleWebhook);

module.exports = router;
