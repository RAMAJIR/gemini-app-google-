
import React, { useState } from 'react';
import { Database, ShieldCheck, Play, Info } from 'lucide-react';

interface SnowflakeFormProps {
  onConnect: (config: any) => void;
  isLoading: boolean;
}

const SnowflakeForm: React.FC<SnowflakeFormProps> = ({ onConnect, isLoading }) => {
  const [config, setConfig] = useState({
    account: '',
    user: '',
    password: '',
    warehouse: '',
    database: '',
    schema: '',
    table: 'SUPPLIER_AUDIT'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(config);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 border border-slate-200 rounded-3xl bg-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 rounded-2xl">
          <Database className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Snowflake DB Connector</h3>
          <p className="text-sm text-slate-500 font-medium">Connect directly to your Snowplex instance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Account URL</label>
          <input 
            type="text" 
            name="account"
            required
            placeholder="xy12345.us-east-1"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Username</label>
          <input 
            type="text" 
            name="user"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
          <input 
            type="password" 
            name="password"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Warehouse</label>
          <input 
            type="text" 
            name="warehouse"
            placeholder="COMPUTE_WH"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Database/Schema</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              name="database"
              placeholder="DB"
              className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              onChange={handleChange}
            />
            <input 
              type="text" 
              name="schema"
              placeholder="PUBLIC"
              className="w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Table</label>
          <input 
            type="text" 
            name="table"
            value={config.table}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-mono"
            onChange={handleChange}
          />
        </div>

        <div className="md:col-span-2 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Note: Browser-based connections to Snowflake require a secure CORS-enabled endpoint or a middle-tier proxy. For direct automation, use the <strong>Python Tool</strong> provided in the top menu.
          </p>
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className="md:col-span-2 flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:bg-slate-300 disabled:shadow-none active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Establishing Connection...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Initialize DB Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SnowflakeForm;
