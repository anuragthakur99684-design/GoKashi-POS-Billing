function Reports({ sales = [], products = [] }) {
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.amount || 0), 0)
  const totalOrders = sales.length
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  const estimatedProfit = Math.round(totalRevenue * 0.25) // Estimated 25% margin

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Business Analytics & Reports</h3>
          <p>Sales performance and profit insights</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>TOTAL REVENUE</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#0f172a' }}>₹{totalRevenue.toLocaleString('en-IN')}</h2>
        </div>
        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '12px', color: '#16a34a' }}>ESTIMATED PROFIT (25%)</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#15803d' }}>₹{estimatedProfit.toLocaleString('en-IN')}</h2>
        </div>
        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '12px', color: '#2563eb' }}>AVG ORDER VALUE</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#1d4ed8' }}>₹{avgOrderValue.toLocaleString('en-IN')}</h2>
        </div>
        <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', border: '1px solid #ffedd5' }}>
          <span style={{ fontSize: '12px', color: '#ea580c' }}>TOTAL ITEMS IN CATALOG</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#c2410c' }}>{products.length}</h2>
        </div>
      </div>

      <h4 style={{ margin: '16px 0 10px 0' }}>Recent Transactions Summary</h4>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.id}</strong></td>
                  <td>{s.customer}</td>
                  <td>{s.date}</td>
                  <td className="amount">₹{Number(s.amount).toLocaleString('en-IN')}</td>
                  <td><span className="status paid">Completed</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>
                  No sales data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Reports