import { useState } from 'react'

export default function AIAssistant({ sales, products }) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const askAI = async (customPrompt) => {
    setLoading(true)
    const promptToSend = customPrompt || query
    try {
      const res = await fetch('http://localhost:5000/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          salesData: sales,
          productsData: products,
        }),
      })
      const data = await res.json()
      setResponse(data.answer)
    } catch (err) {
      setResponse('AI Connection Error. Check Backend Server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <h3 style={{ margin: 0, color: '#0369a1' }}>RetailPro Smart AI Assistant</h3>
      </div>

      {/* Action Buttons for quick insights */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button 
          onClick={() => askAI('Analyze sales and predict which products will run out of stock soon.')}
          style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          📈 Stock Demand Prediction
        </button>
        <button 
          onClick={() => askAI('Give me business advice to increase profits today based on recent sales.')}
          style={{ padding: '6px 12px', background: '#0369a1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          💡 Business Advice & Insights
        </button>
      </div>

      {/* Chat Query Box */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Ask AI e.g. 'Aaj sabse jyada kya bika?' or 'What is total revenue?'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #7dd3fc' }}
        />
        <button 
          onClick={() => askAI()}
          disabled={loading}
          style={{ padding: '8px 16px', background: '#0c4a6e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>

      {/* AI Output Box */}
      {response && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e0f2fe', fontSize: '14px', whiteSpace: 'pre-line' }}>
          <strong>AI Insights:</strong>
          <p style={{ marginTop: '4px', margin: 0 }}>{response}</p>
        </div>
      )}
    </div>
  )
}