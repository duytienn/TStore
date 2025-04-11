const Product = require("../../models/product.model");
const ProductCategory = require("../../models/product-category.model");
const Account = require("../../models/account.model");
const filterStatusHelper = require("../../helpers/filterStaus");
const formSearchHelper = require("../../helpers/formSearch");
const navigationHelper = require("../../helpers/navigation");
const configSystem = require("../../config/system");
const createTreeHelper = require("../../helpers/createTree");
// [GET] admin/products
module.exports.index = async (req, res) => {
  const filterStatus = filterStatusHelper(req.query);
  const formSearch = formSearchHelper(req.query);

  const find = {
    deleted: false,
  };
  if (req.query.status) {
    find.status = req.query.status;
  }

  if (formSearch.regex) {
    find.title = formSearch.regex;
  }

  //pagination
  const countPage = await Product.countDocuments(find);
  const objectPagination = navigationHelper(
    {
      currentPage: 1,
      limitProduct: 5,
    },
    req.query,
    countPage
  );
  //pagination

  //sort-select
  let sort = {};

  if (req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue;
  } else {
    sort.position = "desc";
  }

  //sort-select
  const products = await Product.find(find)
    .sort(sort)
    .limit(objectPagination.limitProduct)
    .skip(objectPagination.indexProduct);

  for (const product of products) {
    // Lay ra thong tin nguoi tao
    const user = await Account.findOne({
      _id: product.createdBy.account_id,
    });

    if (user) {
      product.accountFullName = user.fullName;
    }

    // Lay ra thong tin nguoi cap nhat gan nhat
    const updatedBy = product.updatedBy[product.updatedBy.length - 1];
    if (updatedBy) {
      const userUpdated = await Account.findOne({
        _id: updatedBy.account_id,
      });

      updatedBy.accountFullName = userUpdated.fullName;
    }
  }

  res.render("admin/pages/products/index", {
    pageTitle: "Danh sách sản phẩm",
    products: products,
    filterStatus: filterStatus,
    keyword: formSearch.keyword,
    objectPagination: objectPagination,
  });
};

// [PATH] admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  const status = req.params.status;
  const id = req.params.id;

  const updatedBy = {
    account_id: res.locals.user.id,
    updatedAt: new Date(),
  };

  await Product.updateOne(
    { _id: id },
    {
      status: status,
      $push: { updatedBy: updatedBy },
    }
  );

  req.flash("success", "Bạn đã cập nhật thành công");

  res.redirect("back");
};

// [PATH] admin/products/change/multi
module.exports.changeMulti = async (req, res) => {
  try {
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
    const updatedBy = {
      account_id: res.locals.user.id,
      updatedAt: new Date(),
    };
    switch (type) {
      case "active":
        await Product.updateMany(
          { _id: { $in: ids } },
          {
            status: "active",
            $push: { updatedBy: updatedBy },
          }
        );
        req.flash("success", "Bạn đã cập nhật thành công");
        break;
      case "inactive":
        await Product.updateMany(
          { _id: { $in: ids } },
          {
            status: "inactive",
            $push: { updatedBy: updatedBy },
          }
        );
        req.flash("success", "Bạn đã cập nhật thành công");
        break;
      case "delete-all":
        await Product.updateMany(
          { _id: { $in: ids } },
          {
            deleted: "true",
            deletedAt: new Date(),
            $push: { updatedBy: updatedBy },
          }
        );
        req.flash("success", "Bạn đã xóa thành công");
        break;
      case "change-position":
        for (const item of ids) {
          let [id, position] = item.split("-");
          position = parseInt(position);
          await Product.updateOne(
            { _id: id },
            {
              position: position,
              $push: { updatedBy: updatedBy },
            }
          );
        }
        req.flash("success", "Bạn đã thay đổi thành công");
        break;
      default:
        break;
    }
    res.redirect("back");
  } catch (error) {
    res.redirect(`${configSystem.prefixAdmin}/products`);
  }
};

// [DELTE] admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {
  const id = req.params.id;
  // await Product.deleteOne({_id: id});(Xoa cung , xoa vinh vien trong database);
  await Product.updateOne(
    { _id: id },
    {
      deleted: true,
      // deletedAt: new Date()
      deletedBy: {
        account_id: res.locals.user.id,
        deletedAt: new Date(),
      },
    }
  );
  req.flash("success", "Bạn đã xóa thành công");
  res.redirect("back");
};

// [GET] admin/products/create
module.exports.createItem = async (req, res) => {
  let find = {
    deleted: false,
  };

  const records = await ProductCategory.find(find);

  const newRecords = createTreeHelper.tree(records);

  res.render("admin/pages/products/create", {
    pageTitle: "Thêm mới sản phẩm",
    records: newRecords,
  });
};

// [POST] admin/products/create
module.exports.createPost = async (req, res) => {
  try {
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    req.body.sold = 0;

    if (req.body.position == "") {
      const count = await Product.countDocuments();
      req.body.position = count + 1;
    } else {
      req.body.position = parseInt(req.body.position);
    }

    req.body.createdBy = {
      account_id: res.locals.user.id,
    };

    const product = new Product(req.body);
    product.save();
    res.redirect(`${configSystem.prefixAdmin}/products`);
  } catch (error) {
    res.redirect(`${configSystem.prefixAdmin}/products`);
  }
};

// [GET] admin/products/edit/:id
module.exports.editGetItem = async (req, res) => {
  try {
    const id = req.params.id;
    const find = {
      deleted: false,
      _id: id,
    };

    const product = await Product.findOne(find);

    const records = await ProductCategory.find({ deleted: false });

    const newRecords = createTreeHelper.tree(records);
    res.render("admin/pages/products/edit", {
      pageTitle: "Trang chỉnh sửa sản phẩm",
      product: product,
      records: newRecords,
    });
  } catch (error) {
    res.redirect(`${configSystem.prefixAdmin}/products`);
  }
};

// [PATCH] admin/products/edit/:id
module.exports.editPatchItem = async (req, res) => {
  try {
    const id = req.params.id;
    req.body.price = parseInt(req.body.price);
    req.body.discountPercentage = parseInt(req.body.discountPercentage);
    req.body.stock = parseInt(req.body.stock);
    req.body.position = parseInt(req.body.position);

    const updatedBy = {
      account_id: res.locals.user.id,
      updatedAt: new Date(),
    };

    await Product.updateOne(
      { _id: id },
      {
        ...req.body,
        $push: { updatedBy: updatedBy },
      }
    );
    req.flash("success", "Bạn đã thay đổi thành công !");
    res.redirect("back");
  } catch (error) {
    req.flash("error", "Cập nhật không thành công !");
    res.redirect("back");
  }
};

// [GET] admin/products/detail/:id
module.exports.detailItem = async (req, res) => {
  try {
    const id = req.params.id;
    const find = {
      deleted: false,
      _id: id,
    };

    const product = await Product.findOne(find);

    res.render("admin/pages/products/detail", {
      pageTitle: product.title,
      product: product,
    });
  } catch (error) {
    res.redirect(`${configSystem.prefixAdmin}/products`);
  }
};
