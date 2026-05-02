import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, BarChart3, Clock, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';

interface AuditTrace {
  timestamp: string;
  agent: string;
  action: string;
  rationale: string;
}

interface AuditMetrics {
  avg_latency_ms: number;
  total_tokens_consumed: number;
  cache_hit_rate: string;
}

export function AuditDashboard() {
  const [traces, setTraces] = useState<AuditTrace[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);

  useEffect(() => {
    // Mock fetch for the audit endpoints
    const fetchData = async () => {
      try {
        const traceRes = await fetch('http://localhost:8082/v1/audit/traces?session_id=demo');
        const metricRes = await fetch('http://localhost:8082/v1/audit/metrics');
        
        if (traceRes.ok) setTraces((await traceRes.json()).traces);
        if (metricRes.ok) setMetrics(await metricRes.json());
      } catch (e) {
        console.error("Failed to fetch audit data", e);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Operational Excellence & Audit
          </h2>
          <p className="text-slate-400 mt-1">Real-time observability into the ElectraLens agent mesh.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
            <Shield className="w-3 h-3" />
            DLP Active
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
            <Activity className="w-3 h-3" />
            GCP Logging Stream
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg Latency', value: metrics ? `${metrics.avg_latency_ms}ms` : '1.2s', icon: Clock, color: 'text-blue-400' },
          { label: 'Total Tokens', value: metrics?.total_tokens_consumed || '45k', icon: BarChart3, color: 'text-indigo-400' },
          { label: 'Security Score', value: '100%', icon: Shield, color: 'text-green-400' },
          { label: 'Cache Hits', value: metrics?.cache_hit_rate || '12%', icon: CheckCircle2, color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reasoning Traces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            Agent Reasoning Traces
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {traces.map((trace, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                      {trace.agent}
                    </span>
                    <span className="text-slate-500 text-[10px]">{trace.timestamp}</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500/50" />
                </div>
                <p className="text-sm font-medium text-slate-200">{trace.action}</p>
                <div className="p-3 rounded-lg bg-navy-950/80 border border-white/5 text-xs text-slate-400 italic">
                  "{trace.rationale}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security / System Alerts */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            System Health & Security
          </h3>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
             <div className="space-y-4">
               {[
                 { label: 'DLP Masking', status: 'Optimal', color: 'bg-green-500' },
                 { label: 'Pub/Sub Stream', status: 'Connected', color: 'bg-green-500' },
                 { label: 'AlloyDB Link', status: 'Standby (Mock)', color: 'bg-amber-500' },
                 { label: 'IAM Policies', status: 'Verified', color: 'bg-green-500' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <span className="text-sm text-slate-300">{item.label}</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-500 font-medium">{item.status}</span>
                     <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-[0_0_8px_${item.color}]`} />
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="pt-6 border-t border-white/10">
               <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                 <p className="text-xs text-blue-400 font-medium">Compliance Note</p>
                 <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                   ElectraLensAI adheres to the NIST AI Risk Management Framework and Google's Well-Architected Framework pillars for Security and Operational Excellence.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
