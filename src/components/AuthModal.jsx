import React, { useState } from 'react';

const AuthModal = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      // Direct relative API call (Works seamlessly on Vercel production & serverless routing)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Kuch galat hua');

      // Save Auth Token & User Info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h2 style={{ textAlign: 'center', color: '#ea580c', marginBottom: '8px' }}>GoKashi POS</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          {isLogin ? 'Apne account me Login karein' : 'Naya Dukaan Account Banayein'}
        </p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLogin && (
            <>
              <input type="text" name="shopName" placeholder="Dukaan ka Naam (Shop Name)" value={formData.shopName} onChange={handleChange} required style={inputStyle} />
              <input type="text" name="ownerName" placeholder="Aapka Naam (Owner Name)" value={formData.ownerName} onChange={handleChange} required style={inputStyle} />
              <input type="text" name="phone" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} required style={inputStyle} />
            </>
          )}

          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={inputStyle} />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={inputStyle} />

          <button type="submit" style={{ padding: '12px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            {isLogin ? 'Login Karein' : 'Register & Start Free Trial'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#475569' }}>
          {isLogin ? "Account nahi hai? " : "Pehle se account hai? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#ea580c', fontWeight: 'bold', cursor: 'pointer' }}>
            {isLogin ? 'Register Karein' : 'Login Karein'}
          </span>
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  fontSize: '14px'
};

export default AuthModal;