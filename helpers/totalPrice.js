const Product = require("../models/product.model");
const productHelper = require("./product");

module.exports = async (cartOrOrder) => {
    if (cartOrOrder.products.length > 0) {
        for (const item of cartOrOrder.products) {
            const productId = item.product_id;

            const productInfo = await Product.findOne({
                _id: productId
            });

            productInfo.newPrice = productHelper.priceNewProduct(productInfo);

            item.productInfo = productInfo;

            item.totalPrice = item.quantity * productInfo.newPrice;
        }
    };
}