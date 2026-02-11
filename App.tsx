
import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, FileCheck, RefreshCw, AlertCircle, Database, Cpu, Layout, Code, HardDrive, Network, ListChecks, Activity, Zap, Square, Pause, Play } from 'lucide-react';
import FileUpload from './components/FileUpload';
import SnowflakeForm from './components/SnowflakeForm';
import MatchCard from './components/MatchCard';
import AutomationScript from './components/AutomationScript';
import { SupplierRow, MatchResult } from './types';
import { analyzeSupplierPair } from './services/geminiService';

// Helper to find column values regardless of case, extra spaces, or varied naming conventions
const getVal = (row: any, targets: string[]) => {
  const keys = Object.keys(row);
  
  // 1. Try exact match first (case-insensitive)
  for (const target of targets) {
    const found = keys.find(k => k.toLowerCase().trim() === target.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
      return String(row[found]).trim();
    }
  }
  
  // 2. Try partial match (if header contains target OR target contains header)
  for (const target of targets) {
    const found = keys.find(k => {
      const cleanK = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const cleanT = target.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanK.includes(cleanT) || cleanT.includes(cleanK);
    });
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") {
      return String(row[found]).trim();
    }
  }

  return "";
};

const parseCSV = (text: string): SupplierRow[] => {
  // Split by newline and filter out empty lines, also handling Windows \r\n
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 1) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    // Simple CSV parser that handles quoted values with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });
    return obj as SupplierRow;
  });
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'automation'>('dashboard');
  const [sourceMode, setSourceMode] = useState<'csv' | 'snowflake'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const queueRef = useRef<MatchResult[]>([]);

  useEffect(() => {
    pauseRef.current = isPaused;
  }, [isPaused]);

  const handleStop = () => {
    stopRef.current = true;
    setIsProcessing(false);
    setIsPaused(false);
    setResults(prev => prev.map(r => r.status === 'pending' || r.status === 'processing' ? { ...r, status: 'error', error: 'Audit stopped by user' } : r));
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const startAnalysis = async (rowsToProcess: SupplierRow[]) => {
    setIsProcessing(true);
    setIsPaused(false);
    setError(null);
    stopRef.current = false;
    pauseRef.current = false;

    const initialResults: MatchResult[] = rowsToProcess.map((row, idx) => {
      // Expanded aliases to catch more variations of header names
      const ls = getVal(row, ["ls supplier name", "ls name", "supplier ls", "ls"]);
      const dbm = getVal(row, ["dbm supplier name", "dbm name", "supplier dbm", "dbm"]);
      
      return {
        id: `ID-${idx + 1}`,
        lsName: ls || "Unknown Supplier",
        dbmName: dbm || "Unknown Supplier",
        isMatch: false,
        domainLS: '',
        domainDBM: '',
        reasoning: '',
        sources: [],
        status: 'pending',
        _rawRow: row 
      };
    });

    setResults(initialResults);
    queueRef.current = [...initialResults];

    const batchSize = 3;
    
    const runBatchWorker = async () => {
      while (queueRef.current.length > 0 && !stopRef.current) {
        if (pauseRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        const item = queueRef.current.shift();
        if (!item) break;

        const currentIndex = initialResults.findIndex(r => r.id === item.id);
        
        setResults(prev => prev.map((res, idx) => idx === currentIndex ? { ...res, status: 'processing' } : res));

        try {
          const { analysis, sources } = await analyzeSupplierPair(
            item.lsName, 
            item.dbmName, 
            (item as any)._rawRow
          );
          
          if (stopRef.current) break;

          setResults(prev => prev.map((res, idx) => 
            idx === currentIndex ? { ...res, ...analysis, sources, status: 'completed' } : res
          ));
        } catch (err: any) {
          if (stopRef.current) break;
          setResults(prev => prev.map((res, idx) => 
            idx === currentIndex ? { ...res, status: 'error', error: err.message || "Audit failed" } : res
          ));
        }
      }
    };

    const workers = Array(Math.min(batchSize, initialResults.length)).fill(null).map(() => runBatchWorker());
    await Promise.all(workers);
    
    if (!stopRef.current) {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      const allRows = parseCSV(text);
      if (allRows.length === 0) {
        setError("The uploaded CSV is empty or incorrectly formatted.");
        return;
      }
      startAnalysis(allRows);
    } catch (err: any) {
      setError("Error parsing file: " + err.message);
    }
  };

  const handleSnowflakeConnect = (config: any) => {
    const mockRows: SupplierRow[] = [
      { "LS Supplier Name": "MetalFlow Industries", "DBM Supplier Name": "MetalFlow Ltd", "Address": "123 Steel Road, Ohio", "Email": "info@metalflow.com", "Needs for Review": "No" },
      { "LS Supplier Name": "Urban Threads Co", "DBM Supplier Name": "Urban Fashion", "Address": "456 Silk Ave, NY", "Email": "sales@urbanthreads.com", "Needs for Review": "No" },
      { "LS Supplier Name": "Global Logistics", "DBM Supplier Name": "Global Freight Partners", "Address": "789 Port Way, FL", "Email": "contact@global.logistics", "Needs for Review": "No" },
      { "LS Supplier Name": "Tech Solutions Inc", "DBM Supplier Name": "Tech Solv", "Address": "101 Silicon Valley, CA", "Email": "hi@techsolve.io", "Needs for Review": "No" },
      { "LS Supplier Name": "Green Energy Corp", "DBM Supplier Name": "Green Power", "Address": "202 Eco Blvd, WA", "Email": "support@greenpower.com", "Needs for Review": "No" },
    ];
    setIsProcessing(true);
    setTimeout(() => startAnalysis(mockRows), 500);
  };

  const downloadResults = () => {
    const csvHeader = "ID,LS Supplier Name,DBM Supplier Name,Match,LS Industry,DBM Industry,Reasoning\n";
    const csvRows = results.map(r => 
      `"${r.id}","${r.lsName}","${r.dbmName}","${r.isMatch ? 'Yes' : 'No'}","${r.domainLS}","${r.domainDBM}","${r.reasoning.replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SupplierMatch_Audit_Simplified.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = results.filter(r => r.status === 'completed').length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">SupplierMatch <span className="text-indigo-600">QuickAudit</span></h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Speed Optimized • Simple Results</p>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Layout className="w-4 h-4" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'automation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Code className="w-4 h-4" /> Python Tool
          </button>
        </div>

        {results.length > 0 && activeTab === 'dashboard' && (
          <div className="flex items-center gap-3">
             {isProcessing && (
              <div className="flex gap-2">
                <button 
                  onClick={handleTogglePause}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-bold border border-slate-200"
                >
                  {isPaused ? <><Play className="w-4 h-4 fill-slate-700" /> Resume</> : <><Pause className="w-4 h-4 fill-slate-700" /> Pause</>}
                </button>
                <button 
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all text-sm font-bold border border-rose-100"
                >
                  <Square className="w-4 h-4 fill-rose-600" /> Stop Audit
                </button>
              </div>
            )}
            <button 
              onClick={downloadResults}
              disabled={completedCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md text-sm font-bold disabled:bg-slate-300"
            >
              <Download className="w-4 h-4" /> Save Results
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-8 mt-10">
        {activeTab === 'automation' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <AutomationScript />
          </div>
        ) : !results.length ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
                <Zap className="w-3 h-3 fill-indigo-600" /> Turbo-Charged Research Mode
              </div>
              <h2 className="text-5xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">Super Fast Supplier Matcher</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                We'll search Google for addresses and emails to find out if companies are the same. We explain everything in simple words!
              </p>

              <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit mx-auto shadow-inner mb-12">
                <button 
                  onClick={() => setSourceMode('csv')}
                  className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black tracking-tight transition-all ${sourceMode === 'csv' ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <HardDrive className="w-5 h-5" /> Import CSV
                </button>
                <button 
                  onClick={() => setSourceMode('snowflake')}
                  className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black tracking-tight transition-all ${sourceMode === 'snowflake' ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Network className="w-5 h-5" /> Snowplex DB
                </button>
              </div>
            </div>
            
            {sourceMode === 'csv' ? (
              <FileUpload onFileSelect={handleFileSelect} isLoading={isProcessing} />
            ) : (
              <SnowflakeForm onConnect={handleSnowflakeConnect} isLoading={isProcessing} />
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between border-b-4 border-b-indigo-100">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl shadow-xl shadow-indigo-100 ${isProcessing && !isPaused ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`}>
                  {isPaused ? <Pause className="w-8 h-8 text-white" /> : <Activity className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {isPaused ? 'Audit Paused' : isProcessing ? 'Turbo Audit Progress' : 'Audit Complete'}
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">
                    {isPaused ? 'Audit is temporarily held. Resume to continue.' : isProcessing ? 'Processing multiple records at once using address & email verification.' : 'Verification cycle finished.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-10 items-center">
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Processed</div>
                  <div className="text-2xl font-black text-indigo-600 font-mono">{completedCount} <span className="text-slate-300 font-normal">/</span> {totalCount}</div>
                </div>
                <button 
                  onClick={() => {
                    handleStop();
                    setResults([]);
                  }}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-all text-slate-400 hover:text-indigo-600 group border border-slate-100"
                  title="New Audit"
                >
                  <RefreshCw className={`w-6 h-6 group-hover:rotate-180 transition-transform duration-500 ${isProcessing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 pb-20">
              {results.map((result) => (
                <MatchCard key={result.id} result={result} />
              ))}
            </div>
          </div>
        )}
      </main>

      {isProcessing && activeTab === 'dashboard' && results.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-8 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-6 z-[100] border-2 border-indigo-100 animate-in slide-in-from-bottom-20">
          <div className="relative">
            <div className={`animate-spin rounded-full h-8 w-8 border-4 border-indigo-50 ${isPaused ? 'border-t-amber-500' : 'border-t-indigo-600'}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {isPaused ? <Pause className="w-3 h-3 text-amber-500" /> : <Zap className="w-3 h-3 text-indigo-600 animate-bounce" />}
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isPaused ? 'text-amber-600' : 'text-indigo-600'}`}>
              {isPaused ? 'Audit On Hold' : 'Parallel Audit Engine'}
            </span>
            <span className="text-sm font-bold text-slate-700">
              {isPaused ? 'Waiting for resume...' : `Verifying: ${results.find(r => r.status === 'processing')?.lsName || 'Next Batch...'}`}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-100 ml-2"></div>
          <div className="flex gap-2">
            <button onClick={handleTogglePause} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
              {isPaused ? <Play className="w-5 h-5 fill-indigo-600" /> : <Pause className="w-5 h-5 fill-slate-400" />}
            </button>
            <button onClick={handleStop} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all">
              <Square className="w-5 h-5 fill-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
