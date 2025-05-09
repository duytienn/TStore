const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/chatgpt.controller");

router.get("/", controller.index);

router.post("/", controller.post);

module.exports = router;