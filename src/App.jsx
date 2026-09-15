import { useState, useEffect } from 'react'
import AuthModal from './components/AuthModal'
import AIAssistant from './components/AIAssistant'
import CustomerKhata from './components/CustomerKhata'
import Reports from './components/Reports'
import logoImg from './assets/icon.png'
import './App.css'

function App() {
  // User State
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // Logout Functionality
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const [activePage, setActivePage] = useState('Dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Forms State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  // Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Grocery',
    price: '',
    stock: '',
  })

  // Multi-Item Billing / Cart State
  const [saleCustomer, setSaleCustomer] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [itemQty, setItemQty] = useState(1)

  // Database States
  const [products, setProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch Data from API Server
  useEffect(() => {
    if (user) {
      fetchProducts()
      fetchInvoices()
    }
  }, [user])

  // 1. Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const res = await fetch('http://localhost:5000/api/products', {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      })
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching products from server:', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch Invoices
  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await fetch('http://localhost:5000/api/invoices', {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        const formattedSales = data.map((inv) => ({
          id: inv._id ? `#ORD-${inv._id.slice(-4).toUpperCase()}` : '#ORD-1000',
          customer: inv.customerName || 'Walk-in Customer',
          items: inv.items ? `${inv.items.length} items` : '1 item',
          amount: inv.totalAmount || 0,
          status: 'Paid',
          date: inv.createdAt ? inv.createdAt.split('T')[0] : 'Today',
        }))
        setRecentSales(formattedSales)
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    }
  }

  const menuItems = [
    'Dashboard',
    'Products',
    'Inventory',
    'Sales',
    'Purchases',
    'Customers',
    'Suppliers',
    'Reports',
  ]

  const totalTodaySales = recentSales.reduce((acc, sale) => acc + Number(sale.amount), 0)

  const stats = [
    { title: "Today's Revenue", value: `₹${totalTodaySales.toLocaleString('en-IN')}`, change: '+12.5%', icon: '₹' },
    { title: 'Total Orders', value: `${recentSales.length}`, change: '+8.2%', icon: '🛒' },
    { title: 'Products', value: `${products.length}`, change: '+24', icon: '📦' },
    { title: 'Low Stock', value: `${products.filter((p) => p.stock <= 5).length}`, change: 'Needs attention', icon: '⚠️' },
  ]

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSales = recentSales.filter(
    (s) =>
      s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 3. Add Product API Call
  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return

    try {
      const token = localStorage.getItem('token')

      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(newProduct),
      })

      if (res.ok) {
        const addedProduct = await res.json()
        setProducts([...products, addedProduct])
        setNewProduct({ name: '', category: 'Grocery', price: '', stock: '' })
        setShowAddModal(false)
      }
    } catch (err) {
      console.error('Error adding product:', err)
    }
  }

  // AI Receipt Scanner
  const handleScanReceipt = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsScanning(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1]
      try {
        const res = await fetch('http://localhost:5000/api/ai/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        })
        const data = await res.json()
        if (data.result) {
          setNewProduct({
            name: data.result.name || '',
            category: data.result.category || 'Grocery',
            price: data.result.price || '',
            stock: data.result.stock || '',
          })
          alert('Receipt scanned successfully by Gemini AI!')
        }
      } catch (err) {
        alert('Receipt scanning failed. Please try again.')
      } finally {
        setIsScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // 🛒 MULTI-ITEM CART HANDLERS
  const handleAddToCart = () => {
    if (!selectedProductId) return
    const prod = products.find((p) => (p.id || p._id) === selectedProductId)
    if (!prod) return

    const qty = parseInt(itemQty, 10)
    if (qty <= 0) return

    // Live Stock Validation Check
    if (qty > prod.stock) {
      alert(`Only ${prod.stock} units available in stock!`)
      return
    }

    // Check if item already in cart
    const existingIndex = cartItems.findIndex((item) => item.productId === (prod.id || prod._id))
    if (existingIndex > -1) {
      const newCart = [...cartItems]
      const totalQty = newCart[existingIndex].quantity + qty
      if (totalQty > prod.stock) {
        alert(`Cannot add more than available stock (${prod.stock} units)!`)
        return
      }
      newCart[existingIndex].quantity = totalQty
      newCart[existingIndex].subtotal = totalQty * prod.price
      setCartItems(newCart)
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: prod.id || prod._id,
          name: prod.name,
          price: prod.price,
          quantity: qty,
          subtotal: prod.price * qty,
        },
      ])
    }

    setSelectedProductId('')
    setItemQty(1)
  }

  const handleRemoveFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const cartTotalAmount = cartItems.reduce((acc, item) => acc + item.subtotal, 0)

  // 4. Create Sale API Call (With Multi-Items & Stock Deduction)
  const handleCreateSale = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) {
      alert('Please add at least one item to the cart!')
      return
    }

    const salePayload = {
      customerName: saleCustomer || 'Walk-in Customer',
      items: cartItems,
      totalAmount: cartTotalAmount,
      paymentMethod: 'Cash',
    }

    try {
      const token = localStorage.getItem('token')

      const res = await fetch('http://localhost:5000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(salePayload),
      })

      if (res.ok) {
        alert('Bill Created & Stock Deducted Successfully! ✅')
        fetchProducts() // Refreshes Live Stock
        fetchInvoices() // Refreshes Recent Sales List
        setSaleCustomer('')
        setCartItems([])
        setShowSaleModal(false)
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Failed to complete sale.')
      }
    } catch (err) {
      console.error('Error completing sale:', err)
      alert('Error connecting to backend server.')
    }
  }

  // Delete Product Handler
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      })
      if (res.ok) {
        setProducts(products.filter((p) => (p.id || p._id) !== id))
      }
    } catch (err) {
      console.error('Error deleting product:', err)
    }
  }

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return (
          <>
            <div className="welcome">
              <div>
                <h3>Good afternoon, {user?.ownerName || 'Admin'} 👋</h3>
                <p>Here is what's happening with your store today.</p>
              </div>
              <button className="primary-button" onClick={() => setShowSaleModal(true)}>
                + New Sale
              </button>
            </div>

            <div className="stats-grid">
              {stats.map((stat) => (
                <div className="stat-card" key={stat.title}>
                  <div className="stat-top">
                    <div className="stat-icon">{stat.icon}</div>
                    <span className="stat-change">{stat.change}</span>
                  </div>
                  <p>{stat.title}</p>
                  <h4>{stat.value}</h4>
                </div>
              ))}
            </div>

            {/* Smart AI Assistant Section */}
            <div style={{ margin: '20px 0' }}>
              <AIAssistant sales={recentSales} products={products} />
            </div>

            <div className="dashboard-grid">
              <section className="panel sales-panel">
                <div className="panel-header">
                  <div>
                    <h3>Recent Sales</h3>
                    <p>Latest transactions from MongoDB</p>
                  </div>
                  <button className="view-button" onClick={() => setActivePage('Sales')}>
                    View All
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="order-id">{sale.id}</td>
                          <td>{sale.customer}</td>
                          <td>{sale.items}</td>
                          <td className="amount">₹{sale.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel stock-panel">
                <div className="panel-header">
                  <div>
                    <h3>Low Stock</h3>
                    <p>Products that need restocking</p>
                  </div>
                </div>

                <div className="stock-list">
                  {products
                    .filter((p) => p.stock <= 5)
                    .map((product) => (
                      <div className="stock-item" key={product.id || product._id}>
                        <div className="product-icon">📦</div>
                        <div className="product-info">
                          <strong>{product.name}</strong>
                          <span>Only {product.stock} units left</span>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </>
        )

      case 'Products':
        return (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Product Catalog</h3>
                <p>Manage items, prices, and stock</p>
              </div>
              <button className="primary-button" onClick={() => setShowAddModal(true)}>
                + Add New Product
              </button>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <p style={{ padding: '20px', textAlign: 'center' }}>Loading products...</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prd) => (
                      <tr key={prd.id || prd._id}>
                        <td><strong>{prd.name}</strong></td>
                        <td>{prd.category}</td>
                        <td className="amount">₹{prd.price}</td>
                        <td>{prd.stock} units</td>
                        <td>
                          <span className={`status ${prd.stock <= 5 ? 'pending' : 'paid'}`}>
                            {prd.stock <= 5 ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteProduct(prd.id || prd._id)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )

      case 'Inventory':
        return (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Inventory Management</h3>
                <p>Track warehouse stock levels and reorder limits</p>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>In Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id || p._id}>
                      <td>{p.name}</td>
                      <td><strong>{p.stock} units</strong></td>
                      <td>
                        <span className={`status ${p.stock <= 5 ? 'pending' : 'paid'}`}>
                          {p.stock <= 5 ? 'Reorder Needed' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'Sales':
        return (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Sales & Billing History</h3>
                <p>All recorded invoices and POS entries</p>
              </div>
              <button className="primary-button" onClick={() => setShowSaleModal(true)}>
                + Create New Sale
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="order-id">{sale.id}</td>
                      <td>{sale.customer}</td>
                      <td>{sale.items}</td>
                      <td className="amount">₹{sale.amount.toLocaleString('en-IN')}</td>
                      <td>{sale.date}</td>
                      <td><span className="status paid">{sale.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'Customers':
        return <CustomerKhata />

      case 'Reports':
        return <Reports sales={recentSales} products={products} />

      default:
        return (
          <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
            <h3>{activePage} Module</h3>
          </div>
        )
    }
  }

  return (
    <div className="app">
      {/* 1. Login Modal */}
      {!user && <AuthModal onLoginSuccess={(userData) => setUser(userData)} />}

      {/* 2. Main App Screen */}
      {user && (
        <>
          <aside className="sidebar">
            <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
              <img 
                src={logoImg} 
                alt="GoKashi Logo" 
                style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'contain' }} 
              />
              <div>
                <h1 style={{ fontSize: '18px', margin: 0, fontWeight: '800', color: '#ea580c' }}>GoKashi</h1>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', letterSpacing: '0.5px' }}>
                  POS & BILLING
                </span>
              </div>
            </div>

            {/* Shop Profile Widget */}
            <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '8px', margin: '10px 0', border: '1px solid #ffedd5' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#c2410c' }}>🏪 {user.shopName || 'My Shop'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>👤 {user.ownerName || user.email}</p>
              <button 
                onClick={handleLogout} 
                style={{ marginTop: '8px', width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Logout
              </button>
            </div>

            <nav className="navigation">
              <p className="menu-title">MAIN MENU</p>
              {menuItems.map((item) => (
                <button
                  key={item}
                  className={`nav-item ${activePage === item ? 'active' : ''}`}
                  onClick={() => setActivePage(item)}
                >
                  <span className="nav-icon">▣</span>
                  {item}
                </button>
              ))}
            </nav>
          </aside>

          <main className="main-content">
            <header className="topbar">
              <div>
                <p className="breadcrumb">GoKashi / {activePage}</p>
                <h2>{activePage}</h2>
              </div>
              <div>
                <input
                  type="text"
                  placeholder={`Search ${activePage}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                  }}
                />
              </div>
            </header>

            <section className="content">{renderContent()}</section>
          </main>

          {/* Add Product Modal */}
          {showAddModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3>Add New Product</h3>

                <div style={{ background: '#f0fdf4', border: '1px dashed #22c55e', padding: '10px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                  <label style={{ cursor: 'pointer', color: '#15803d', fontWeight: 'bold' }}>
                    {isScanning ? '⏳ AI Scanning Image...' : '📷 Auto-Fill via AI Receipt Scan'}
                    <input type="file" accept="image/*" onChange={handleScanReceipt} style={{ display: 'none' }} disabled={isScanning} />
                  </label>
                </div>

                <form onSubmit={handleAddProduct}>
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rice 5kg"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      <option value="Grocery">Grocery</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₹)</label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity</label>
                      <input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="cancel-button" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Save Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 🛒 UPGRADED MULTI-ITEM BILLING MODAL */}
          {showSaleModal && (
            <div className="modal-overlay">
              <div className="modal-box" style={{ maxWidth: '600px', width: '90%' }}>
                <h3>New POS Bill</h3>
                
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={saleCustomer}
                    onChange={(e) => setSaleCustomer(e.target.value)}
                  />
                </div>

                {/* Item Selector Row */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    ADD PRODUCTS TO BILL
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map((p) => (
                        <option key={p.id || p._id} value={p.id || p._id} disabled={p.stock <= 0}>
                          {p.name} (₹{p.price} | Stock: {p.stock}) {p.stock <= 0 ? '- OUT OF STOCK' : ''}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      style={{ width: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="primary-button"
                      style={{ padding: '8px 14px' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Cart Table */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                        <th style={{ padding: '8px' }}>Qty</th>
                        <th style={{ padding: '8px' }}>Price</th>
                        <th style={{ padding: '8px' }}>Total</th>
                        <th style={{ padding: '8px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.length > 0 ? (
                        cartItems.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px' }}><strong>{item.name}</strong></td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>₹{item.price}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>₹{item.subtotal}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(index)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                            No items added to bill yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total & Submit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', padding: '12px', background: '#fff7ed', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                  <span style={{ fontWeight: 'bold', color: '#c2410c' }}>Grand Total Amount:</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c' }}>₹{cartTotalAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-button" onClick={() => { setShowSaleModal(false); setCartItems([]); }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCreateSale} className="primary-button">
                    Complete Sale & Deduct Stock
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App