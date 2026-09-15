import { useState } from 'react'

function CustomerKhata() {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Ramesh Kumar', phone: '9876543210', totalDue: 450, lastTx: '12/09/2026' },
    { id: 2, name: 'Suresh Sharma', phone: '9123456789', totalDue: 1200, lastTx: '14/09/2026' },
    { id: 3, name: 'Anil Verma', phone: '9988776655', totalDue: 0, lastTx: '10/09/2026' },
  ])

  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [payAmount, setPayAmount] = useState('')

  const handleCollectPayment = (e) => {
    e.preventDefault()
    if (!selectedCustomer || !payAmount) return

    const amt = parseFloat(payAmount)
    setCustomers(
      customers.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, totalDue: Math.max(0, c.totalDue - amt) }
          : c
      )
    )

    alert(`₹${amt} collected successfully from ${selectedCustomer.name}!`)
    setSelectedCustomer(null)
    setPayAmount('')
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  const totalDues = customers.reduce((acc, c) => acc + c.totalDue, 0)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Customer Udhaar Ledger (Khata)</h3>
          <p>Track pending dues and collect payments</p>
        </div>
        <input
          type="text"
          placeholder="Search customer or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#e11d48', fontWeight: 'bold' }}>
            TOTAL MARKET DUES (UDHAAR)
          </span>
          <h2 style={{ margin: '8px 0 0 0', color: '#be123c' }}>
            ₹{totalDues.toLocaleString('en-IN')}
          </h2>
        </div>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>
            TOTAL CUSTOMERS WITH DUES
          </span>
          <h2 style={{ margin: '8px 0 0 0', color: '#15803d' }}>
            {customers.filter((c) => c.totalDue > 0).length}
          </h2>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Total Due (Udhaar)</th>
              <th>Last Transaction</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((cust) => (
              <tr key={cust.id}>
                <td>
                  <strong>{cust.name}</strong>
                </td>
                <td>{cust.phone}</td>
                <td>
                  <span
                    style={{
                      color: cust.totalDue > 0 ? '#e11d48' : '#16a34a',
                      fontWeight: 'bold',
                    }}
                  >
                    ₹{cust.totalDue.toLocaleString('en-IN')}
                  </span>
                </td>
                <td>{cust.lastTx}</td>
                <td>
                  {cust.totalDue > 0 ? (
                    <button
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      💵 Collect Payment
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Settled ✅</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Collect Payment Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Collect Payment</h3>
            <p style={{ margin: '4px 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Customer: <strong>{selectedCustomer.name}</strong> (Pending: ₹{selectedCustomer.totalDue})
            </p>
            <form onSubmit={handleCollectPayment}>
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input
                  type="number"
                  max={selectedCustomer.totalDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerKhata