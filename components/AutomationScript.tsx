
import React from 'react';
import { Terminal, Copy, Download, Code } from 'lucide-react';

const pythonCode = `import pandas as pd
import google.generativeai as genai
import time

# --- CONFIGURATION ---
# genai.configure(api_key="YOUR_GEMINI_API_KEY")

def analyze_all_suppliers(csv_path, output_path):
    print(f"--- Starting Full Spectrum Audit: {csv_path} ---")
    
    # 1. Read the CSV (Processes ALL rows)
    df = pd.read_csv(csv_path)
    
    results = []
    # Updated to gemini-3-flash-preview as per model guidelines
    model = genai.GenerativeModel('gemini-3-flash-preview', tools=[{'google_search_retrieval': {}}])

    for index, row in df.iterrows():
        ls_name = row.get('LS Supplier Name', 'Unknown')
        dbm_name = row.get('DBM Supplier Name', 'Unknown')
        
        print(f"[{index+1}/{len(df)}] Deep Researching: {ls_name} vs {dbm_name}")
        
        prompt = f"""
        PERFORM CORPORATE IDENTITY AUDIT:
        - LS Name: {ls_name}
        - DBM Name: {dbm_name}
        
        TASK:
        1. Find their specific industrial domains (e.g. Metal, Clothing, IT).
        2. Are they the same legal company?
        
        OUTPUT:
        MATCH: [Yes/No]
        DOMAIN_LS: [Sector]
        DOMAIN_DBM: [Sector]
        REASON: [Evidence found via Google Search]
        """
        
        try:
            response = model.generate_content(prompt)
            results.append({
                'LS Name': ls_name,
                'DBM Name': dbm_name,
                'Research Output': response.text
            })
            time.sleep(2) # Prevent rate limiting
        except Exception as e:
            results.append({'LS Name': ls_name, 'DBM Name': dbm_name, 'Research Output': f"Error: {e}"})

    # 2. Export deep audit report
    results_df = pd.DataFrame(results)
    results_df.to_csv(output_path, index=False)
    print(f"--- Audit Complete! Report: {output_path} ---")

if __name__ == "__main__":
    # analyze_all_suppliers('your_data.csv', 'audit_report.csv')
    pass
`;

const AutomationScript: React.FC = () => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode);
    alert('Code copied!');
  };

  const downloadScript = () => {
    const blob = new Blob([pythonCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deep_supplier_audit.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
      <div className="px-8 py-5 bg-slate-800/50 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3 text-slate-200">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <span className="font-mono text-sm font-bold tracking-tight">deep_supplier_audit.py</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={copyToClipboard} className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all">
            <Copy className="w-5 h-5" />
          </button>
          <button onClick={downloadScript} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 text-sm font-black transition-all shadow-lg active:scale-95">
            <Download className="w-4 h-4" /> Download Script
          </button>
        </div>
      </div>
      <div className="p-8">
        <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
          <Code className="w-5 h-5 text-indigo-400 mt-0.5" />
          <p className="text-sm text-indigo-200 leading-relaxed font-medium">
            This Python automation processes <strong>every row</strong> in your dataset, identifies industry sectors like <strong>Metal</strong> or <strong>Clothing</strong>, and outputs a deep research report.
          </p>
        </div>
        <pre className="text-blue-300 font-mono text-xs overflow-x-auto leading-relaxed custom-scrollbar max-h-[400px]">
          {pythonCode}
        </pre>
      </div>
    </div>
  );
};

export default AutomationScript;
