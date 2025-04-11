const ctx = document.querySelector(".prog-chart");

new Chart(ctx, {
  type: "bar",
  data: {
    labels: [
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
      "T7",
      "T8",
      "T9",
      "T10",
      "T11",
      "T12",
    ],
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: [
          6000000, 10000000, 8000000, 14000000, 6000000, 7000000, 4000000,
          8000000, 15000000, 18000000, 14000000, 9000000,
        ],
        borderColor: "#0891b2",
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          display: true,
        },
        border: {
          display: false,
          dash: [5, 5],
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad",
    },
  },
});

// Lấy tất cả các thẻ div có class "product"
const productDivs = document.querySelectorAll(".product");

// Tạo mảng chứa dữ liệu sản phẩm
const products = [];

// Duyệt qua các thẻ div
for (let i = 0; i < productDivs.length; i++) {
  // Kiểm tra nếu thẻ hiện tại có thuộc tính data-product
  if (productDivs[i].hasAttribute("data-product")) {
    const productSold = productDivs[i].getAttribute("data-product"); // Lấy số lượng bán
    const productTitleDiv = productDivs[i].nextElementSibling; // Thẻ tiếp theo
    if (productTitleDiv && productTitleDiv.hasAttribute("data-title")) {
      const productTitle = productTitleDiv.getAttribute("data-title"); // Lấy tên sản phẩm
      products.push({
        title: productTitle,
        sold: parseInt(productSold, 10), // Chuyển thành số
      });
    }
  }
}
const labels = products.map((product) => product.title);
const data = products.map((product) => product.sold);

// Plugin custom để thêm màu nền cho canvas
const customCanvasBackgroundColor = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = options.color || "#f0f8ff"; // Màu nền mặc định
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

// Đăng ký plugin
Chart.register(customCanvasBackgroundColor);

// Khởi tạo biểu đồ Doughnut với plugin
const ctx2 = document.querySelector(".prog-chart2");
new Chart(ctx2, {
  type: "doughnut", // Loại biểu đồ Doughnut
  data: {
    labels: labels,
    datasets: [
      {
        label: "Số lượng sản phẩm đã bán",
        data: data,
        backgroundColor: [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(255, 205, 86)",
          "rgb(153, 102, 255)",
        ],
        hoverOffset: 4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top", // Hiển thị chú thích ở trên biểu đồ
      },
      customCanvasBackgroundColor: {
        color: "#f0f8ff", // Màu nền cho canvas
      },
    },
  },
});
