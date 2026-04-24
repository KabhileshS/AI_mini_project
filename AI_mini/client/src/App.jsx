import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import { Wallet } from 'lucide-react';
import './index.css';

function App() {
  const [extractedData, setExtractedData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataSaved = () => {
    setExtractedData(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container animate-fade-in">
      <header className="flex items-center gap-4 mb-8">
        <div style={{ background: 'var(--accent-color)', padding: '12px', borderRadius: '12px', boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
          <Wallet size={32} color="white" />
        </div>
        <div>
          <h1 style={{ marginBottom: 0, fontSize: '2rem' }}>AI Expense Tracker</h1>
          <p className="text-secondary" style={{ marginTop: '4px' }}>Smart financial management with Llama 3 & Gemini</p>
        </div>
      </header>

      <main>
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="flex-col" style={{ display: 'flex', gap: '1.5rem' }}>
            <section className="glass-panel animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>1. Upload Statement</h2>
              <FileUpload onExtracted={setExtractedData} />
            </section>

            {extractedData && (
              <section className="glass-panel animate-slide-up" style={{animationDelay: '0.2s', border: '1px solid var(--accent-color)', boxShadow: '0 0 20px rgba(59,130,246,0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>2. Review and Edit</h2>
                <DataTable 
                  data={extractedData} 
                  onSave={handleDataSaved} 
                  onCancel={() => setExtractedData(null)} 
                />
              </section>
            )}
          </div>

          <div className="flex-col" style={{ display: 'flex' }}>
            <section className="glass-panel animate-slide-up" style={{animationDelay: '0.3s', flex: 1, display: 'flex', flexDirection: 'column'}}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>Chat with AI Assistant</h2>
              <Chatbot />
            </section>
          </div>
        </div>

        <section className="glass-panel animate-slide-up" style={{animationDelay: '0.4s'}}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '16px' }}>Spending Dashboard</h2>
          <Dashboard refreshTrigger={refreshTrigger} currentData={extractedData} />
        </section>
      </main>
    </div>
  );
}

export default App;
