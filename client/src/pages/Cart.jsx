import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const cartStyles = `
  .cart-item-card {
    background: #ffffff;
    border: 1px solid rgba(196,199,199,0.3);
    transition: all 0.3s ease;
  }
  .cart-item-card:hover {
    border-color: #715a3e;
  }
  .checkout-sidebar {
    background: #ffffff;
    border: 1px solid rgba(196,199,199,0.4);
    position: sticky;
    top: 100px;
  }
  .checkbox-custom {
    accent-color: #715a3e;
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  .qty-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(196,199,199,0.5);
    background: #ffffff;
    transition: all 0.2s ease;
  }
  .qty-btn:hover:not(:disabled) {
    background: #715a3e;
    color: #ffffff;
    border-color: #715a3e;
  }
  .form-input {
    border: 1px solid rgba(196,199,199,0.5);
    padding: 10px 14px;
    width: 100%;
    background: transparent;
    transition: border-color 0.3s ease;
  }
  .form-input:focus {
    outline: none;
    border-color: #715a3e;
  }
`;

const Cart = () => {
  const { token, user, logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]); // Array of itemIds
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
  });
  const [userAddresses, setUserAddresses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);


  // Trạng thái thanh toán từ URL
  const paymentStatus = searchParams.get('status');
  const orderCode = searchParams.get('orderCode');

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const res = await api('/cart');
      setCart(res.data || { items: [] });
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const res = await api('/payment/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  // Fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      const res = await api('/auth/addresses');
      const list = res.data || [];
      setUserAddresses(list);
      
      // Prefill with default address
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr) {
        setShippingAddress({
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          address: defaultAddr.address,
        });
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
      fetchOrders();
      fetchUserAddresses();
    }
  }, [token]);


  // Xử lý xác nhận trạng thái thanh toán từ PayOS Redirect
  useEffect(() => {
    const confirmPayment = async () => {
      if (paymentStatus && orderCode) {
        try {
          await api('/payment/confirm-payment', {
            method: 'POST',
            body: {
              orderCode: Number(orderCode),
              status: paymentStatus,
            },
          });
          // Xóa query params để không lặp lại
          setSearchParams({});
          fetchCart();
          fetchOrders();
          alert(paymentStatus === 'success' ? 'Thanh toán đơn hàng thành công!' : 'Thanh toán đơn hàng đã bị hủy.');
        } catch (err) {
          console.error('Error confirming payment:', err);
        }
      }
    };
    confirmPayment();
  }, [paymentStatus, orderCode]);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 text-center">
        <span className="material-symbols-outlined text-6xl text-outline mb-4">shopping_cart_checkout</span>
        <h2 className="font-display-lg text-2xl mb-2 text-primary uppercase">Giỏ hàng của bạn</h2>
        <p className="text-on-surface-variant mb-6">Vui lòng đăng nhập để xem và quản lý giỏ hàng của bạn.</p>
        <Link to="/login" className="bg-primary text-on-primary px-8 py-3 hover:bg-secondary transition-colors font-label-caps uppercase tracking-wider">
          Đăng Nhập Ngay
        </Link>
      </div>
    );
  }

  // Nhóm các mặt hàng theo curator/owner
  const groupedItems = {};
  if (cart && cart.items) {
    cart.items.forEach((cartItem) => {
      if (!cartItem.item) return;
      const ownerId = cartItem.item.owner?._id || 'unknown';
      const ownerName = cartItem.item.owner?.companyName || cartItem.item.owner?.fullName || 'Lumina Curator';
      if (!groupedItems[ownerId]) {
        groupedItems[ownerId] = {
          ownerName,
          items: [],
        };
      }
      groupedItems[ownerId].items.push(cartItem);
    });
  }

  // Checkbox: Chọn toàn bộ giỏ
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = cart.items.map((i) => i.item._id);
      setSelectedItems(allIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Checkbox: Chọn toàn bộ sản phẩm của 1 store
  const handleSelectStore = (storeItems, checked) => {
    const storeItemIds = storeItems.map((i) => i.item._id);
    if (checked) {
      setSelectedItems((prev) => [...new Set([...prev, ...storeItemIds])]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => !storeItemIds.includes(id)));
    }
  };

  // Checkbox: Chọn 1 sản phẩm
  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // Cập nhật số lượng
  const handleQuantityChange = async (itemId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    try {
      await api('/cart/update', {
        method: 'POST',
        body: { itemId, quantity: newQty },
      });
      fetchCart();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật số lượng');
    }
  };

  // Xóa sản phẩm
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Bạn muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
    try {
      await api('/cart/remove', {
        method: 'POST',
        body: { itemId },
      });
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      fetchCart();
    } catch (err) {
      alert(err.message || 'Lỗi xóa sản phẩm');
    }
  };

  // Tính toán tổng tiền cho các sản phẩm đã chọn
  let totalSelectedAmount = 0;
  const selectedCheckoutItems = [];
  if (cart && cart.items) {
    cart.items.forEach((cartItem) => {
      if (selectedItems.includes(cartItem.item._id)) {
        totalSelectedAmount += cartItem.item.price * cartItem.quantity;
        selectedCheckoutItems.push({
          itemId: cartItem.item._id,
          quantity: cartItem.quantity,
        });
      }
    });
  }

  // Xử lý submit thanh toán
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (selectedCheckoutItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api('/payment/create-payment-link', {
        method: 'POST',
        body: {
          items: selectedCheckoutItems,
          shippingAddress,
        },
      });

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        alert('Không tạo được liên kết thanh toán.');
      }
    } catch (err) {
      alert(err.message || 'Lỗi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen pt-28 pb-16">
      <style dangerouslySetInnerHTML={{ __html: cartStyles }} />

      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-variant py-4">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/"><span className="font-display-lg text-lg md:text-xl font-bold tracking-[0.25em] text-primary">LUMINA</span></Link>
            <div className="hidden md:flex gap-8">
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps" to="/">Home</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps" to="/stores">Curators</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowOrders(!showOrders)} className="font-label-caps text-label-caps text-secondary hover:text-primary transition-colors">
              {showOrders ? 'Xem Giỏ Hàng' : 'Đơn Hàng Đã Mua'}
            </button>
            <button onClick={logout} className="font-label-caps text-label-caps border border-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-all uppercase">Logout</button>
          </div>
        </nav>
      </header>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mb-8">
          <h1 className="font-display-lg text-3xl font-light text-primary uppercase tracking-wide">
            {showOrders ? 'Lịch sử mua hàng' : 'Giỏ hàng của bạn'}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {showOrders ? 'Theo dõi trạng thái đơn hàng của bạn qua cổng PayOS' : 'Chọn sản phẩm và tiến hành thanh toán giống Shopee Flow.'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="font-light tracking-widest uppercase text-on-surface-variant">Đang tải thông tin...</p>
          </div>
        ) : showOrders ? (
          /* DANH SÁCH ĐƠN HÀNG */
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-outline-variant/60 rounded-sm">
                <span className="material-symbols-outlined text-5xl text-outline mb-2">receipt_long</span>
                <p className="text-on-surface-variant">Bạn chưa có đơn hàng nào.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white border border-outline-variant/30 p-6 rounded-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                    <div>
                      <span className="font-bold text-primary">Mã Đơn Hàng: #{order.orderCode}</span>
                      <span className="text-xs text-on-surface-variant ml-4">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  <div className="divide-y divide-outline-variant/10">
                    {order.items.map((item) => (
                      <div key={item._id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-primary">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">Số lượng: {item.quantity} x ${item.price?.toLocaleString()}</p>
                        </div>
                        <span className="font-bold text-primary">${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant/20 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-on-surface-variant">Người nhận: <strong>{order.shippingAddress?.fullName}</strong> - {order.shippingAddress?.phone}</p>
                      <p className="text-xs text-on-surface-variant">Địa chỉ: {order.shippingAddress?.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">Tổng số tiền</p>
                      <p className="font-bold text-xl text-primary">${order.totalAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* TRANG GIỎ HÀNG CHÍNH (Shopee Flow) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Danh sách sản phẩm bên trái */}
            <div className="lg:col-span-8 space-y-6">
              {cart.items.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed border-outline-variant/60 rounded-sm">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3 block">shopping_cart</span>
                  <p className="text-on-surface-variant mb-6">Giỏ hàng của bạn đang trống.</p>
                  <Link to="/" className="bg-primary text-on-primary px-6 py-2.5 hover:bg-secondary transition-colors uppercase font-label-caps text-xs">
                    Tiếp tục mua sắm
                  </Link>
                </div>
              ) : (
                <>
                  {/* Select All Bar */}
                  <div className="bg-white border border-outline-variant/30 p-4 flex items-center gap-3 rounded-sm">
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      onChange={handleSelectAll}
                      checked={selectedItems.length === cart.items.length && cart.items.length > 0}
                    />
                    <span className="font-label-caps text-xs tracking-wider uppercase text-primary">
                      Chọn tất cả ({cart.items.length} sản phẩm)
                    </span>
                  </div>

                  {/* Group items by Shop */}
                  {Object.keys(groupedItems).map((ownerId) => {
                    const shopData = groupedItems[ownerId];
                    const shopItemIds = shopData.items.map((i) => i.item._id);
                    const isAllShopSelected = shopItemIds.every((id) => selectedItems.includes(id));

                    return (
                      <div key={ownerId} className="bg-white border border-outline-variant/30 rounded-sm overflow-hidden">
                        {/* Shop Header */}
                        <div className="bg-surface-container/30 px-5 py-3.5 border-b border-outline-variant/20 flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="checkbox-custom"
                            onChange={(e) => handleSelectStore(shopData.items, e.target.checked)}
                            checked={isAllShopSelected}
                          />
                          <span className="material-symbols-outlined text-[18px] text-secondary">store</span>
                          <span className="font-semibold text-primary text-sm">{shopData.ownerName}</span>
                        </div>

                        {/* Shop Items */}
                        <div className="divide-y divide-outline-variant/20">
                          {shopData.items.map((cartItem) => {
                            const { item, quantity } = cartItem;
                            if (!item) return null;

                            return (
                              <div key={item._id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    className="checkbox-custom"
                                    onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                                    checked={selectedItems.includes(item._id)}
                                  />
                                  <div className="w-16 h-16 bg-surface-container/60 flex-shrink-0 rounded-sm overflow-hidden border border-outline-variant/20">
                                    <span className="material-symbols-outlined text-3xl text-outline w-full h-full flex items-center justify-center bg-gray-100">
                                      image
                                    </span>
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-primary text-sm truncate">{item.name}</h4>
                                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{item.description || 'Premium curator piece.'}</p>
                                  <p className="text-sm font-semibold text-primary mt-1.5">${item.price?.toLocaleString()}</p>
                                </div>

                                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                                  {/* Tăng giảm số lượng */}
                                  <div className="flex items-center border border-outline-variant/35">
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(item._id, quantity, -1)}
                                      disabled={quantity <= 1}
                                      className="qty-btn"
                                    >
                                      -
                                    </button>
                                    <span className="w-10 text-center text-xs font-semibold text-primary">{quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleQuantityChange(item._id, quantity, 1)}
                                      className="qty-btn"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item._id)}
                                    className="text-on-surface-variant hover:text-error transition-colors p-1"
                                    title="Xóa sản phẩm"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Sidebar thông tin thanh toán bên phải */}
            <div className="lg:col-span-4 space-y-6">
              <div className="checkout-sidebar p-6 rounded-sm space-y-6">
                <div>
                  <h3 className="font-label-caps text-xs tracking-wider uppercase text-primary border-b border-outline-variant/30 pb-3 font-bold mb-4">
                    Thông tin giao hàng
                  </h3>
                  <form className="space-y-4" onSubmit={handleCheckout}>
                    {userAddresses.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-primary uppercase block mb-1">Chọn địa chỉ đã lưu</label>
                        <select
                          className="form-input text-sm cursor-pointer"
                          onChange={(e) => {
                            const selected = userAddresses.find((a) => a._id === e.target.value);
                            if (selected) {
                              setShippingAddress({
                                fullName: selected.fullName,
                                phone: selected.phone,
                                address: selected.address,
                              });
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>-- Chọn địa chỉ --</option>
                          {userAddresses.map((addr) => (
                            <option key={addr._id} value={addr._id}>
                              {addr.fullName} - {addr.phone} ({addr.address.slice(0, 25)}...)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>

                      <label className="text-xs font-semibold text-primary uppercase block mb-1">Họ và tên người nhận</label>
                      <input
                        type="text"
                        required
                        className="form-input text-sm"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-primary uppercase block mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        className="form-input text-sm"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        placeholder="09XXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-primary uppercase block mb-1">Địa chỉ giao hàng</label>
                      <textarea
                        required
                        rows="3"
                        className="form-input text-sm"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                        placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện..."
                      />
                    </div>




                    <div className="border-t border-outline-variant/30 pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-on-surface-variant font-medium">Đã chọn ({selectedItems.length}) sản phẩm:</span>
                        <span className="font-bold text-lg text-primary">${totalSelectedAmount.toLocaleString()}</span>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || selectedCheckoutItems.length === 0}
                        className="w-full bg-primary text-on-primary py-3 hover:bg-secondary disabled:bg-gray-300 disabled:text-gray-500 transition-colors font-label-caps uppercase tracking-wider text-xs font-bold"
                      >
                        {submitting ? 'Đang xử lý...' : 'Thanh toán'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
