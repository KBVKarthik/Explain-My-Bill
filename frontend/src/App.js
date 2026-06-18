import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
function App() {
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [latestExplanation, setLatestExplanation] = useState('');
    const [disputeLetter, setDisputeLetter] = useState('');
    useEffect(() => {
        fetchBills();
    }, []);
    async function fetchBills() {
        const response = await fetch(`${API_URL}/bills`);
        const data = await response.json();
        setBills(data);
        setSelectedBill(data[0] ?? null);
    }
    async function handleUpload(event) {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const body = await response.json();
                throw new Error(body.detail || 'Upload failed');
            }
            const bill = await response.json();
            setBills([bill, ...bills]);
            setSelectedBill(bill);
            setLatestExplanation('Your bill has been uploaded and examined. Scroll below for a clear summary.');
            setDisputeLetter('');
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setUploading(false);
        }
    }
    async function handleLoadDemo() {
        setError('');
        try {
            const response = await fetch(`${API_URL}/demo/load-samples`, {
                method: 'POST',
            });
            if (!response.ok && response.status !== 409) {
                const body = await response.json();
                throw new Error(body.detail || 'Demo load failed');
            }
            await fetchBills();
            setLatestExplanation('Demo bills are ready. Select a bill to explore the explanation and dispute options.');
        }
        catch (err) {
            setError(err.message);
        }
    }
    async function handleRunDemo() {
        setError('');
        try {
            const response = await fetch(`${API_URL}/demo/load-samples`, {
                method: 'POST',
            });
            if (!response.ok && response.status !== 409) {
                const body = await response.json();
                throw new Error(body.detail || 'Demo load failed');
            }
            const billsResponse = await fetch(`${API_URL}/bills`);
            if (!billsResponse.ok) {
                throw new Error('Unable to load demo bills');
            }
            const data = await billsResponse.json();
            setBills(data);
            const firstBill = data[0] ?? null;
            setSelectedBill(firstBill);
            setLatestExplanation('Demo loaded. The first sample bill is selected and ready for review.');
            setDisputeLetter('');
            if (firstBill) {
                const disputeResponse = await fetch(`${API_URL}/bills/${firstBill.id}/dispute`);
                if (!disputeResponse.ok) {
                    const body = await disputeResponse.json();
                    throw new Error(body.detail || 'Unable to generate dispute letter');
                }
                const disputeData = await disputeResponse.json();
                setDisputeLetter(disputeData.letter);
            }
        }
        catch (err) {
            setError(err.message);
        }
    }
    async function handleGenerateDispute() {
        if (!selectedBill)
            return;
        setError('');
        try {
            const response = await fetch(`${API_URL}/bills/${selectedBill.id}/dispute`);
            if (!response.ok) {
                const body = await response.json();
                throw new Error(body.detail || 'Unable to generate dispute letter');
            }
            const data = await response.json();
            setDisputeLetter(data.letter);
        }
        catch (err) {
            setError(err.message);
        }
    }
    async function handleDownloadSummary() {
        if (!selectedBill)
            return;
        setError('');
        try {
            const response = await fetch(`${API_URL}/bills/${selectedBill.id}/summary-pdf`);
            if (!response.ok) {
                const body = await response.json();
                throw new Error(body.detail || 'Download failed');
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedBill.title.replace(/\s+/g, '_')}_summary.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            setError(err.message);
        }
    }
    function renderLineItems(items) {
        return items.map((item) => (_jsxs("div", { className: `line-item ${item.flags ? 'flagged' : ''}`, children: [_jsxs("div", { className: "line-item-left", children: [_jsx("strong", { children: item.description }), _jsx("p", { children: item.explanation })] }), _jsxs("div", { className: "line-item-right", children: [_jsxs("span", { children: ["$", item.amount.toFixed(2)] }), _jsx("p", { children: item.flags })] })] }, item.id)));
    }
    function renderSummary() {
        if (!selectedBill)
            return null;
        return (_jsxs("div", { className: "summary-card", children: [_jsx("h2", { children: "Bill Summary" }), _jsx("p", { children: selectedBill.summary }), _jsxs("p", { children: ["Suspicion score: ", _jsx("strong", { children: selectedBill.suspicious_score.toFixed(2) })] })] }));
    }
    return (_jsxs("div", { className: "page-shell", children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("h1", { children: "Explain My Bill" }), _jsx("p", { children: "Upload a bill or invoice and get a clear explanation of every charge. Compare to history, spot unusual fees, and generate a dispute letter." })] }), _jsxs("div", { className: "upload-panel", children: [_jsxs("label", { className: "upload-button", children: [uploading ? 'Uploading...' : 'Upload bill', _jsx("input", { type: "file", accept: "application/pdf,image/png,image/jpeg", onChange: handleUpload })] }), _jsx("button", { className: "upload-button secondary", onClick: handleLoadDemo, children: "Load demo bills" }), _jsx("button", { className: "upload-button secondary", onClick: handleRunDemo, children: "Run demo" }), error && _jsx("p", { className: "error-text", children: error })] })] }), _jsxs("main", { children: [_jsxs("aside", { className: "history-panel", children: [_jsx("h2", { children: "History" }), _jsx("div", { className: "history-list", children: bills.map((bill) => (_jsxs("button", { className: bill.id === selectedBill?.id ? 'active' : '', onClick: () => setSelectedBill(bill), children: [_jsx("span", { children: bill.title }), _jsxs("small", { children: ["$", bill.total_amount.toFixed(2)] })] }, bill.id))) })] }), _jsx("section", { className: "workspace", children: selectedBill ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "top-panel", children: [_jsxs("div", { className: "bill-detail-card", children: [_jsx("h2", { children: selectedBill.title }), _jsxs("p", { children: ["Category: ", selectedBill.category] }), _jsxs("p", { children: ["Total: $", selectedBill.total_amount.toFixed(2)] }), _jsxs("p", { children: ["Uploaded: ", new Date(selectedBill.created_at).toLocaleDateString()] })] }), renderSummary()] }), _jsxs("div", { className: "comparison-grid", children: [_jsxs("div", { className: "original-view", children: [_jsx("h3", { children: "Original bill" }), _jsx("div", { className: "placeholder", children: "Original bill preview will appear here." })] }), _jsxs("div", { className: "analysis-view", children: [_jsxs("div", { className: "analysis-header", children: [_jsx("h3", { children: "Explanation" }), _jsxs("div", { className: "action-buttons", children: [_jsx("button", { onClick: handleGenerateDispute, children: "Generate dispute letter" }), _jsx("button", { onClick: handleDownloadSummary, children: "Download summary" })] })] }), _jsxs("div", { className: "explanation-text", children: [_jsx("p", { children: latestExplanation }), renderLineItems(selectedBill.line_items)] }), disputeLetter && (_jsxs("div", { className: "dispute-letter", children: [_jsx("h4", { children: "Dispute letter" }), _jsx("pre", { children: disputeLetter })] }))] })] }), _jsxs("div", { className: "chart-panel", children: [_jsx("h3", { children: "History comparison" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(LineChart, { data: bills.map((bill) => ({
                                                    name: bill.title,
                                                    total: bill.total_amount,
                                                    suspicious: bill.suspicious_score * 100,
                                                })), children: [_jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "total", stroke: "#4f46e5", name: "Total" }), _jsx(Line, { type: "monotone", dataKey: "suspicious", stroke: "#dc2626", name: "Suspicion" })] }) })] })] })) : (_jsx("div", { className: "empty-state", children: _jsx("p", { children: "Select a bill or upload one to begin." }) })) })] })] }));
}
export default App;
