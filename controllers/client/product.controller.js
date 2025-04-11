const Product = require("../../models/product.model");
const ProductCategory = require("../../models/product-category.model");
const Comment = require("../../models/comment.model");
const User = require("../../models/users.model");
const productHelper = require("../../helpers/product");
const productCategoryHelper = require("../../helpers/productCategory");
const formSelectHelper = require("../../helpers/formSelect");
const commentSocket = require("../../sockets/client/comment.socket");
// [GET] products
module.exports.index = async (req, res) => {
    // sort-select
    let sort = formSelectHelper(req);
    const products = await Product.find({
        status: "active",
        deleted: false
    }).sort(sort);

    const newProducts = productHelper.priceNewProducts(products);


    res.render("client/pages/product/index", {
        pageTitle: "Danh sách sản phẩm",
        products: newProducts
    });
};

// [GET] products/detail/:slugProduct
module.exports.detailProduct = async (req, res) => {
    const slugProduct = req.params.slugProduct;
    // socket comment product
    commentSocket(req, res);
    // end socket comment product

    const comments = await Comment.find({
        slugProduct: slugProduct,
        deleted: false
    }).sort({ createdAt: -1 });

    for (const comment of comments) {
        const infoUser = await User.findOne({
            _id: comment.user_id,
        }).select("fullName");
        comment.infoUser = infoUser;
    }

    const find = {
        deleted: false,
        slug: req.params.slugProduct,
        status: "active"
    }

    const product = await Product.findOne(find);


    if (product.products_category_id) {
        const category = await ProductCategory.findOne({
            _id: product.products_category_id,
            status: "active",
            deleted: false
        });

        product.category = category.title;
    };

    product.newPrice = productHelper.priceNewProduct(product);

    res.render("client/pages/product/detail", {
        pageTitle: product.title,
        product: product,
        comments: comments
    })
}

// [GET] products/:slugCategory
module.exports.category = async (req, res) => {
    //sort -select
    let sort = formSelectHelper(req);

    const category = await ProductCategory.findOne({
        slug: req.params.slugCategory,
        deleted: false,
        status: "active"
    });

    const listSubCategory = await productCategoryHelper.getSubCategory(category.id);

    const listSubCategoryId = listSubCategory.map(item => item.id);

    const products = await Product.find({
        products_category_id: { $in: [category.id, ...listSubCategoryId] },
        deleted: false
    }).sort(sort);

    const newProducts = productHelper.priceNewProducts(products);


    res.render("client/pages/product/index", {
        pageTitle: category.title,
        products: newProducts
    });
}