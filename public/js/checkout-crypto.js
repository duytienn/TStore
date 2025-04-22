// public/js/checkout-crypto.js
window.addEventListener('load', async () => {
  // thiết lập hằng số
  const RECIPIENT   = document.querySelector('strong').textContent && typeof window.USDT_RECIPIENT !== 'undefined'
                     ? window.USDT_RECIPIENT 
                     : '0xb1a5c0d80dAD939C345010dB3D7491c9CBF4f78C';
  const USDT_ADDRESS = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
  const USDT_ABI = [
    // minimal ERC20 ABI
    { "constant": false, "inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],
      "name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function" },
    { "constant": true, "inputs":[{"name":"_owner","type":"address"}],
      "name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function" },
    { "constant": true, "inputs":[], "name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function" }
  ];

  // init Web3 & MetaMask
  if (!window.ethereum) {
    return show('Vui lòng cài MetaMask', 'danger');
  }
  const web3 = new Web3(window.ethereum);
  let account;
  try {
    [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (e) {
    return show('Từ chối kết nối ví', 'danger');
  }
  const token = new web3.eth.Contract(USDT_ABI, USDT_ADDRESS);
  
  document.getElementById('sendCrypto').addEventListener('click', async () => {
    // Kiểm tra thông tin người dùng
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    
    if (!fullName || !phone || !address) {
      return show('Vui lòng nhập đầy đủ thông tin nhận hàng', 'danger');
    }
    
    // lấy số lượng USDT (đã hiển thị sẵn)
    const usdtAmount = parseFloat(document.querySelector('strong').textContent);
    if (isNaN(usdtAmount) || usdtAmount <= 0) {
      return show('Giá trị USDT không hợp lệ', 'danger');
    }
    // decimals
    const decimals = await token.methods.decimals().call();
    const value    = web3.utils.toBN(usdtAmount * (10 ** decimals));
    // gas
    const gasPrice = web3.utils.toWei(document.getElementById('gasPrice').value, 'gwei');
    const gasLimit = document.getElementById('gasLimit').value;
    show('Đang gửi giao dịch…', 'info');
    // gọi transfer
    token.methods.transfer(RECIPIENT, value.toString())
      .send({ from: account, gasPrice, gas: gasLimit })
      .on('transactionHash', hash => show(`Đã gửi TX: ${hash}`, 'success'))
      .on('receipt', async (r) => {
        show('Giao dịch thành công! Đang xử lý đơn hàng...', 'success');
        
        // Lấy thông tin form
        const formData = {
          fullName: document.getElementById('fullName').value,
          phone: document.getElementById('phone').value,
          address: document.getElementById('address').value
        };
        
        // Gửi request đặt hàng
        try {
          const response = await fetch('/checkout/order-crypto', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          });
          
          const result = await response.json();
          if (result.success) {
            window.location.href = `/checkout/success/${result.orderId}`;
          } else {
            show('Lỗi khi xử lý đơn hàng', 'danger');
          }
        } catch (error) {
          show('Lỗi: ' + error.message, 'danger');
        }
      })
      .on('error', err => show('Lỗi: '+err.message, 'danger'));
  });

  function show(msg, type) {
    const el = document.getElementById('cryptoStatus');
    el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }
});