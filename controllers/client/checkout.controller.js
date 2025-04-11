const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const productHelper = require("../../helpers/product");
const totalPriceHelper = require("../../helpers/totalPrice");

//[GET] /checkout/cod
module.exports.cod = async (req, res) => {
  const cartId = req.cookies.cartId;

  const cart = await Cart.findOne({
    _id: cartId,
  });

  // tinh tong tien san pham trong mang products
  await totalPriceHelper(cart);

  // if (cart.products.length > 0) {
  //     for (const item of cart.products) {
  //         const productId = item.product_id;

  //         const productInfo = await Product.findOne({
  //             _id: productId
  //         });

  //         productInfo.newPrice = productHelper.priceNewProduct(productInfo);

  //         item.productInfo = productInfo;

  //         item.totalPrice = item.quantity * productInfo.newPrice;
  //     }
  // };
  //Tong tien ca gio hang
  cart.totalPrice = cart.products.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  res.render("client/pages/checkout/index", {
    pageTitle: "Đặt hàng",
    cart: cart,
  });
};

//[GET] /checkout/qr
module.exports.qr = async (req, res) => {
  const cartId = req.cookies.cartId;

  const cart = await Cart.findOne({
    _id: cartId,
  });

  // tinh tong tien san pham trong mang products
  await totalPriceHelper(cart);

  // if (cart.products.length > 0) {
  //     for (const item of cart.products) {
  //         const productId = item.product_id;

  //         const productInfo = await Product.findOne({
  //             _id: productId
  //         });

  //         productInfo.newPrice = productHelper.priceNewProduct(productInfo);

  //         item.productInfo = productInfo;

  //         item.totalPrice = item.quantity * productInfo.newPrice;
  //     }
  // };
  //Tong tien ca gio hang
  cart.totalPrice = cart.products.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  //qrBank
  let qrBank = {
    BANK_ID: process.env.BANK_ID,
    ACCOUNT_NO: process.env.ACCOUNT_NO,
    ACCOUNT_NAME: process.env.ACCOUNT_NAME,
  };

  res.render("client/pages/checkout/payqr", {
    pageTitle: "Đặt hàng",
    cart: cart,
    qrBank: qrBank,
  });
};

//[POST] /checkout/order
module.exports.order = async (req, res) => {
  const user_id = res.locals.user.id;
  const cartId = req.cookies.cartId;
  const userInfo = req.body;
  const cart = await Cart.findOne({
    _id: cartId,
  });

  let products = [];

  for (const item of cart.products) {
    const objectProducts = {
      product_id: item.product_id,
      price: 0,
      discountPercentage: 0,
      quantity: item.quantity,
    };
    const productInfo = await Product.findOne({
      _id: item.product_id,
    });
    objectProducts.price = productInfo.price;
    objectProducts.discountPercentage = productInfo.discountPercentage;

    products.push(objectProducts);
  }
  const objectOrder = {
    user_id: user_id,
    cart_id: cartId,
    userInfo: userInfo,
    products: products,
  };

  const order = new Order(objectOrder);
  await order.save();
  //Cap nhat lai gio hang sau khi dat hang thanh cong , xoa het products
  await Cart.updateOne({ _id: cartId }, { products: [] });

  res.redirect(`/checkout/success/${order.id}`);
};

//[POST] /checkout/orderqr
module.exports.orderQr = async (req, res) => {
  try {
    const totalPrice = parseInt(req.body.totalPrice);

    const response = await fetch(
      "https://script.googleusercontent.com/macros/echo?user_content_key=hQekJz-K4BQ_e4yrGSy4veQ6O8zYRRm3ZiHRMt-G4Q3kVfLJbTh_VUO6l1sMCkmHSC28kW6liFnsC4eJMkTCt-IWEcKm8zuwm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnEWhy2GlpYOO8u5r7HQq4vS8MV3SqRGS1uTUZy7tBsfSNihnXLhbLgJmU5rahB0qOxrl32g1aTLLMJKkRagXXSE4fJVTYqg3JQ&lib=M7qplnMK8pE6UXY01tGAbDruMUXUij3bf"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const dataTotalPrice = data.data[data.data.length - 1]["Giá trị"];

    if (totalPrice == dataTotalPrice) {
      const user_id = res.locals.user.id;
      const cartId = req.cookies.cartId;
      const userInfo = req.body;
      const cart = await Cart.findOne({
        _id: cartId,
      });

      let products = [];

      for (const item of cart.products) {
        const objectProducts = {
          product_id: item.product_id,
          price: 0,
          discountPercentage: 0,
          quantity: item.quantity,
        };
        const productInfo = await Product.findOne({
          _id: item.product_id,
        });
        objectProducts.price = productInfo.price;
        objectProducts.discountPercentage = productInfo.discountPercentage;

        products.push(objectProducts);
      }
      const objectOrder = {
        user_id: user_id,
        cart_id: cartId,
        userInfo: userInfo,
        products: products,
      };

      const order = new Order(objectOrder);
      await order.save();
      //Cap nhat lai gio hang sau khi dat hang thanh cong , xoa het products
      await Cart.updateOne({ _id: cartId }, { products: [] });

      res.redirect(`/checkout/success/${order.id}`);
    } else {
      req.flash("error", "Kiểm tra lại giao dịch của bạn !");
      res.redirect("back");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

//[GET] /checkout/success/:id
module.exports.success = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
  });

  for (const product of order.products) {
    const productInfo = await Product.findOne({
      _id: product.product_id,
    }).select("title thumbnail");

    product.productInfo = productInfo;

    product.newPrice = productHelper.priceNewProduct(product);

    product.totalPrice = product.quantity * product.newPrice;
  }

  //Tong tien
  order.totalPrice = order.products.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  res.render("client/pages/checkout/success", {
    pageTitle: "Đặt hàng thành công",
    order: order,
  });
};
