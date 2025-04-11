
const express = require("express");
const multer  = require('multer');

const upload = multer();
const router = express.Router();

const controller = require("../../controllers/admin/products.controller");
const validates = require("../../validates/admin/products.validates");
const uploadCloud = require("../../middlewares/admin/uploadCloud.middlewares");

router.get("/", controller.index);

router.patch("/change-status/:status/:id", controller.changeStatus);

router.patch("/change-multi", controller.changeMulti);

router.delete("/delete/:id", controller.deleteItem);

router.get("/create", controller.createItem);

router.post(
    "/create", 
    upload.single('thumbnail'),
    uploadCloud.upload,
    validates.createPostValidate,
    controller.createPost
);

router.get("/edit/:id", controller.editGetItem);

router.patch(
    "/edit/:id",
    upload.single('thumbnail'),
    uploadCloud.upload,
    validates.createPostValidate,
    controller.editPatchItem);

router.get("/detail/:id", controller.detailItem);

module.exports = router;