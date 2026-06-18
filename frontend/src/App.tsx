import { useEffect, useState } from 'react'
import { Bill, LineItem } from './types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [latestExplanation, setLatestExplanation] = useState<string>('')
  const [disputeLetter, setDisputeLetter] = useState<string>('')

  useEffect(() => {
    fetchBills()
  }, [])

  async function fetchBills() {
    const response = await fetch(`${API_URL}/bills`)
    const data = await response.json()
    setBills(data)
    setSelectedBill(data[0] ?? null)
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.detail || 'Upload failed')
      }
      const bill = await response.json()
      setBills([bill, ...bills])
      setSelectedBill(bill)
      setLatestExplanation('Your bill has been uploaded and examined. Scroll below for a clear summary.')
      setDisputeLetter('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleLoadDemo() {
    setError('')
    try {
      const response = await fetch(`${API_URL}/demo/load-samples`, {
        method: 'POST',
      })
      if (!response.ok && response.status !== 409) {
        const body = await response.json()
        throw new Error(body.detail || 'Demo load failed')
      }
      await fetchBills()
      setLatestExplanation('Demo bills are ready. Select a bill to explore the explanation and dispute options.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleRunDemo() {
    setError('')
    try {
      const response = await fetch(`${API_URL}/demo/load-samples`, {
        method: 'POST',
      })
      if (!response.ok && response.status !== 409) {
        const body = await response.json()
        throw new Error(body.detail || 'Demo load failed')
      }

      const billsResponse = await fetch(`${API_URL}/bills`)
      if (!billsResponse.ok) {
        throw new Error('Unable to load demo bills')
      }
      const data = await billsResponse.json()
      setBills(data)
      const firstBill = data[0] ?? null
      setSelectedBill(firstBill)
      setLatestExplanation('Demo loaded. The first sample bill is selected and ready for review.')
      setDisputeLetter('')

      if (firstBill) {
        const disputeResponse = await fetch(`${API_URL}/bills/${firstBill.id}/dispute`)
        if (!disputeResponse.ok) {
          const body = await disputeResponse.json()
          throw new Error(body.detail || 'Unable to generate dispute letter')
        }
        const disputeData = await disputeResponse.json()
        setDisputeLetter(disputeData.letter)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleGenerateDispute() {
    if (!selectedBill) return
    setError('')
    try {
      const response = await fetch(`${API_URL}/bills/${selectedBill.id}/dispute`)
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.detail || 'Unable to generate dispute letter')
      }
      const data = await response.json()
      setDisputeLetter(data.letter)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDownloadSummary() {
    if (!selectedBill) return
    setError('')
    try {
      const response = await fetch(`${API_URL}/bills/${selectedBill.id}/summary-pdf`)
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.detail || 'Download failed')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedBill.title.replace(/\s+/g, '_')}_summary.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function renderLineItems(items: LineItem[]) {
    return items.map((item) => (
      <div key={item.id} className={`line-item ${item.flags ? 'flagged' : ''}`}>
        <div className="line-item-left">
          <strong>{item.description}</strong>
          <p>{item.explanation}</p>
        </div>
        <div className="line-item-right">
          <span>${item.amount.toFixed(2)}</span>
          <p>{item.flags}</p>
        </div>
      </div>
    ))
  }

  function renderSummary() {
    if (!selectedBill) return null
    return (
      <div className="summary-card">
        <h2>Bill Summary</h2>
        <p>{selectedBill.summary}</p>
        <p>
          Suspicion score: <strong>{selectedBill.suspicious_score.toFixed(2)}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header>
        <div>
          <h1>Explain My Bill</h1>
          <p>Upload a bill or invoice and get a clear explanation of every charge.
            Compare to history, spot unusual fees, and generate a dispute letter.</p>
        </div>
        <div className="upload-panel">
          <label className="upload-button">
            {uploading ? 'Uploading...' : 'Upload bill'}
            <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={handleUpload} />
          </label>
          <button className="upload-button secondary" onClick={handleLoadDemo}>
            Load demo bills
          </button>
          <button className="upload-button secondary" onClick={handleRunDemo}>
            Run demo
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      </header>

      <main>
        <aside className="history-panel">
          <h2>History</h2>
          <div className="history-list">
            {bills.map((bill) => (
              <button
                key={bill.id}
                className={bill.id === selectedBill?.id ? 'active' : ''}
                onClick={() => setSelectedBill(bill)}
              >
                <span>{bill.title}</span>
                <small>${bill.total_amount.toFixed(2)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="workspace">
          {selectedBill ? (
            <>
              <div className="top-panel">
                <div className="bill-detail-card">
                  <h2>{selectedBill.title}</h2>
                  <p>Category: {selectedBill.category}</p>
                  <p>Total: ${selectedBill.total_amount.toFixed(2)}</p>
                  <p>Uploaded: {new Date(selectedBill.created_at).toLocaleDateString()}</p>
                </div>
                {renderSummary()}
              </div>

              <div className="comparison-grid">
                <div className="original-view">
                  <h3>Original bill</h3>
                  <div className="placeholder">Original bill preview will appear here.</div>
                </div>
                <div className="analysis-view">
                  <div className="analysis-header">
                    <h3>Explanation</h3>
                    <div className="action-buttons">
                      <button onClick={handleGenerateDispute}>Generate dispute letter</button>
                      <button onClick={handleDownloadSummary}>Download summary</button>
                    </div>
                  </div>
                  <div className="explanation-text">
                    <p>{latestExplanation}</p>
                    {renderLineItems(selectedBill.line_items)}
                  </div>
                  {disputeLetter && (
                    <div className="dispute-letter">
                      <h4>Dispute letter</h4>
                      <pre>{disputeLetter}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="chart-panel">
                <h3>History comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={bills.map((bill) => ({
                    name: bill.title,
                    total: bill.total_amount,
                    suspicious: bill.suspicious_score * 100,
                  }))}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#4f46e5" name="Total" />
                    <Line type="monotone" dataKey="suspicious" stroke="#dc2626" name="Suspicion" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a bill or upload one to begin.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
