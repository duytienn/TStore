const ProductCategory = require("../../models/product-category.model");

const configSystem = require("../../config/system");

const createTreeHelper = require("../../helpers/createTree");


// [GET] admin/products-category
module.exports.index = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await ProductCategory.find(find);

    const newRecords = createTreeHelper.tree(records);

    res.render("admin/pages/products-category/index", {
        pageTitle: "Danh mục sản phẩm",
        records: newRecords
    })
}

// [GET] admin/products-category/create
module.exports.create = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await ProductCategory.find(find);

    const newRecords = createTreeHelper.tree(records);


    res.render("admin/pages/products-category/create", {
        pageTitle: "Tạo mới sản phẩm",
        records: newRecords
    })
}

// [POST] admin/products-category/create
module.exports.createPost = async (req, res) => {
    try {
        if (req.body.position == "") {
            const count = await ProductCategory.countDocuments();
            req.body.position = count + 1;
        } else {
            req.body.position = parseInt(req.body.position);
        }

        const record = new ProductCategory(req.body);
        record.save();
        res.redirect(`${configSystem.prefixAdmin}/products-category`);
    } catch (error) {
        res.redirect(`${configSystem.prefixAdmin}/products-category`);
    }
}

// [GET] admin/products-category/edit/:id

module.exports.edit = async (req, res) => {
    try {
        const id = req.params.id;

        const data = await ProductCategory.findOne({
            _id: id,
            deleted: false
        });

        const find = {
            deleted: false
        };

        const records = await ProductCategory.find(find);

        const newRecords = createTreeHelper.tree(records);


        res.render("admin/pages/products-category/edit", {
            pageTitle: "Chỉnh sửa danh mục sản phẩm",
            data: data,
            records: newRecords
        })
    } catch (error) {
        res.redirect("back");
    }
}

// [PATCH] admin/products-category/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        req.body.position = parseInt(req.body.position);

        console.log(req.body);
        console.log(id);

        await ProductCategory.updateOne({ _id: id }, req.body);
        res.redirect("back");
        req.flash('success', 'Bạn đã thay đổi thành công');

    } catch (error) {
        req.flash('error', 'Cập nhật không thành công !');
        res.redirect("back");
    }

}