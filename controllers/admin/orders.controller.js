const Order = require("../../models/order.model");
const Product = require("../../models/product.model");
const totalPriceHelper = require("../../helpers/totalPrice");

// [GET] /admin/orders
module.exports.index = async (req, res) => {
  const orders = await Order.find({
    deleted: false,
  });

  if (orders) {
    for (const order of orders) {
      await totalPriceHelper(order);
      order.totalPrice = order.products.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
    }
  }
  res.render("admin/pages/orders/index", {
    pageTile: "Đơn hàng",
    orders: orders,
  });
};
// [PATCH] /admin/orders/change-status/:status/:id
module.exports.patchStatus = async (req, res) => {
  try {
    const { status, id } = req.params;

    await Order.updateOne(
      { _id: id },
      {
        status: status,
      }
    );

    if (status === "success") {
      const order = await Order.findOne({
        _id: id,
      });
      const products = order.products;
      for (const product of products) {
        const productInOrder = await Product.findOne({
          _id: product.product_id,
        });
        const newStock = parseInt(productInOrder.stock - product.quantity);
        const newSold = parseInt(productInOrder.sold + product.quantity);
        await Product.updateOne(
          { _id: product.product_id },
          {
            stock: newStock,
            sold: newSold,
          }
        );
      }
    }

    req.flash("success", "Cập nhật trạng thái thành công!");
    res.redirect("back");
  } catch (error) {
    res.redirect("back");
  }
};
