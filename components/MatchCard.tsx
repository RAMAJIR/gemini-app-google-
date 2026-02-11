
import React from 'react';
import { CheckCircle2, XCircle, Info, ExternalLink, Globe, Factory, ShoppingBag, Landmark, Loader2, AlertCircle, HelpCircle, MapPin, Mail } from 'lucide-react';
import { MatchResult } from '../types';

interface MatchCardProps {
  result: MatchResult;
}

const MatchCard: React.FC<MatchCardProps> = ({ result }) => {
  const isPending = result.status === 'pending';
  const isProcessing = result.status === 'processing';
  const isError = result.status === 'error';
  const isCompleted = result.status === 'completed';

  const getIndustryIcon = (domain: string) => {
    const d = domain.toLowerCase();
    if (d.includes('metal') || d.includes('manufact') || d.includes('industr')) return <Factory className="w-4 h-4" />;
    if (d.includes('cloth') || d.includes('retail') || d.includes('fashion') || d.includes('thread')) return <ShoppingBag className="w-4 h-4" />;
    return <Landmark className="w-4 h-4" />;
  };

  return (
    <div className={`p-8 rounded-[2rem] border bg-white shadow-sm transition-all duration-500 ${isProcessing ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl translate-y-[-4px]' : 'border-slate-100 hover:border-slate-200'} ${isCompleted && result.isMatch ? 'bg-emerald-50/20' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2 max-w-[80%]">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 shrink-0">AUDIT #{result.id.split('-')[1]}</span>
            {isCompleted && (
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm shrink-0 ${result.isMatch ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {result.isMatch ? 'THEY ARE THE SAME!' : 'DIFFERENT COMPANIES'}
              </span>
            )}
            {isProcessing && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-md shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" /> RESEARCHING...
              </span>
            )}
          </div>
          <h3 className="text-2xl font-black text-slate-800 leading-tight pt-2">
            <span className="text-indigo-600 block sm:inline">{result.lsName}</span>
            <span className="text-slate-300 font-bold italic text-sm mx-2">vs</span>
            <span className="text-indigo-600 block sm:inline">{result.dbmName}</span>
          </h3>
        </div>
        {isCompleted && (
          <div className="animate-in zoom-in duration-500">
            {result.isMatch ? (
              <div className="p-2 bg-emerald-100 rounded-full border-4 border-white shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            ) : (
              <div className="p-2 bg-rose-100 rounded-full border-4 border-white shadow-lg">
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-2xl border transition-all ${isProcessing ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-xl shadow-sm text-slate-400">
              {getIndustryIcon(result.domainLS)}
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Industry Found (LS)</p>
          </div>
          <p className={`text-sm font-black ${result.domainLS ? 'text-slate-900' : 'text-slate-300 italic'}`}>
            {isProcessing ? 'Verifying...' : (result.domainLS || 'Searching...')}
          </p>
        </div>
        
        <div className={`p-4 rounded-2xl border transition-all ${isProcessing ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white rounded-xl shadow-sm text-slate-400">
              {getIndustryIcon(result.domainDBM)}
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Industry Found (DBM)</p>
          </div>
          <p className={`text-sm font-black ${result.domainDBM ? 'text-slate-900' : 'text-slate-300 italic'}`}>
            {isProcessing ? 'Verifying...' : (result.domainDBM || 'Searching...')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" /> Simple Explanation
          </h4>
          {isCompleted && (
            <div className="flex gap-4">
               <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><MapPin className="w-3 h-3" /> Location Checked</div>
               <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Mail className="w-3 h-3" /> Identity Verified</div>
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 relative overflow-hidden min-h-[80px] flex items-center">
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/50 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
          )}
          <p className="text-base text-slate-700 leading-relaxed font-bold">
            {isPending ? 'Queued for search...' : isProcessing ? 'I am checking their details on the internet now...' : result.reasoning}
          </p>
        </div>
        {isError && (
          <p className="text-sm text-rose-500 mt-4 bg-rose-50 p-3 rounded-xl border border-rose-100 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Error: {result.error}
          </p>
        )}
      </div>

      {result.sources.length > 0 && (
        <div className="border-t border-slate-100 pt-5">
          <h4 className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Proof & Resources:</h4>
          <div className="flex flex-wrap gap-2">
            {result.sources.map((source, idx) => (
              <a 
                key={idx}
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100/50 shadow-sm"
              >
                <Globe className="w-3 h-3" />
                <span className="max-w-[180px] truncate">{source.title || 'Official Identity'}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
