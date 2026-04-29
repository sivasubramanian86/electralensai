/**
 * ElectoralData — Recharts-powered electoral statistics dashboard.
 *
 * NON-PARTISAN: Shows only aggregate civic statistics — voter turnout,
 * registration demographics, seat distribution, and constituency data.
 * No party/candidate promotion.
 */

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  BarChart3,
  PieChartIcon,
  Map,
  Info,
  ChevronDown,
} from 'lucide-react';
import type { UseGamificationResult } from '../../../hooks/useGamification';

// ─── Data ──────────────────────────────────────────────────────────────────────

const voterTurnoutByYear = [
  { year: '2004', turnout: 58.1, registered: 671.0 },
  { year: '2009', turnout: 59.7, registered: 714.0 },
  { year: '2014', turnout: 66.4, registered: 814.0 },
  { year: '2019', turnout: 67.4, registered: 910.5 },
  { year: '2024', turnout: 65.8, registered: 970.0 },
];

const ageGroupRegistration = [
  { group: '18–19', male: 48, female: 52, other: 0.1 },
  { group: '20–29', male: 54, female: 46, other: 0.2 },
  { group: '30–39', male: 55, female: 45, other: 0.1 },
  { group: '40–49', male: 53, female: 47, other: 0.1 },
  { group: '50–59', male: 51, female: 49, other: 0.1 },
  { group: '60+', male: 50, female: 50, other: 0.0 },
];

const constituencyBreakdown = [
  { name: 'General', value: 412, color: '#3b82f6' },
  { name: 'SC Reserved', value: 84, color: '#8b5cf6' },
  { name: 'ST Reserved', value: 47, color: '#10b981' },
];

const stateTurnout = [
  { state: 'Manipur', turnout: 80.1 },
  { state: 'Nagaland', turnout: 78.4 },
  { state: 'Sikkim', turnout: 76.2 },
  { state: 'Mizoram', turnout: 73.3 },
  { state: 'Tripura', turnout: 80.0 },
  { state: 'Kerala', turnout: 71.3 },
  { state: 'West Bengal', turnout: 73.0 },
  { state: 'J&K', turnout: 58.5 },
  { state: 'Bihar', turnout: 57.3 },
  { state: 'UP', turnout: 60.5 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-900 border border-white/10 rounded-xl p-3 shadow-2xl">
      <p className="text-xs font-bold text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
          {p.name}: {p.value}
          {p.name === 'turnout' || p.name === 'Turnout %' ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ElectoralDataProps {
  gamification: UseGamificationResult;
}

export function ElectoralData({ gamification }: ElectoralDataProps) {
  const [selectedRegion, setSelectedRegion] = useState('IN');
  const [activeChart, setActiveChart] = useState<'turnout' | 'age' | 'seats' | 'states'>('turnout');

  useEffect(() => {
    gamification.unlockBadge('data_detective');
    gamification.awardXP(10, 'Opened Electoral Data panel');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSeats = constituencyBreakdown.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
            <BarChart3 className="w-9 h-9 text-emerald-400" />
            Electoral Data Explorer
          </h2>
          <p className="text-slate-400 mt-1">
            Aggregate civic statistics — turnout trends, demographics, and constituency breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Map className="w-4 h-4 text-emerald-400" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
          >
            <option value="IN" className="bg-slate-900">India (General Election)</option>
            <option value="IN_MH" className="bg-slate-900">Maharashtra</option>
            <option value="IN_TN" className="bg-slate-900">Tamil Nadu</option>
            <option value="IN_DL" className="bg-slate-900">Delhi</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex gap-3 items-start">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-500/80">
          <strong>Data Note:</strong> Figures are illustrative approximations based on publicly available ECI data for educational purposes.
          Always refer to the official Election Commission of India portal (eci.gov.in) for authoritative data.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Voters (2024)', value: '970M+', icon: Users, color: 'blue', change: '+6.5% from 2019' },
          { label: 'Lok Sabha Seats', value: '543', icon: BarChart3, color: 'violet', change: '412 General + 131 Reserved' },
          { label: '2024 Turnout', value: '65.8%', icon: TrendingUp, color: 'emerald', change: '-1.6pp from 2019 peak' },
          { label: 'Total Constituencies', value: '4,034', icon: Map, color: 'amber', change: 'State + Parliament combined' },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/15 transition-all space-y-3">
            <div className={`w-9 h-9 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit flex-wrap">
        {[
          { id: 'turnout', label: 'Turnout Trend', icon: TrendingUp },
          { id: 'age', label: 'Age & Gender', icon: Users },
          { id: 'seats', label: 'Seat Types', icon: PieChartIcon },
          { id: 'states', label: 'State Turnout', icon: Map },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id as typeof activeChart)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeChart === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Charts ─── */}
      <div className="glass p-8 rounded-3xl border border-white/10 min-h-[380px]">

        {/* Turnout Trend */}
        {activeChart === 'turnout' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Voter Turnout Trend (India General Elections)</h3>
              <p className="text-sm text-slate-400">National turnout % across 5 election cycles</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={voterTurnoutByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis domain={[50, 75]} stroke="#64748b" tick={{ fontSize: 12 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="turnout"
                  name="Turnout %"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 text-center">
              Visualization idea: Animate as a racing line chart with registered voter count overlay.
            </p>
          </div>
        )}

        {/* Age & Gender */}
        {activeChart === 'age' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Voter Registration by Age Group & Gender</h3>
              <p className="text-sm text-slate-400">Illustrative breakdown — male vs female registration share (%)</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageGroupRegistration} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="group" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 70]} stroke="#64748b" tick={{ fontSize: 12 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Female" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 text-center">
              Youth (18–19) shows higher female registration — a positive indicator of youth engagement.
            </p>
          </div>
        )}

        {/* Seat Types */}
        {activeChart === 'seats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Lok Sabha Seat Reservation</h3>
              <p className="text-sm text-slate-400 mb-6">
                {totalSeats} total elected seats — classified by constituency type
              </p>
              <div className="space-y-3">
                {constituencyBreakdown.map((seg) => (
                  <div key={seg.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: seg.color }} />
                        <span className="text-sm font-medium text-slate-300">{seg.name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{seg.value} seats</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(seg.value / totalSeats) * 100}%`,
                          background: seg.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={constituencyBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {constituencyBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} seats`, 'Seats']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* State Turnout */}
        {activeChart === 'states' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">State-wise Turnout (Selected States, 2024)</h3>
              <p className="text-sm text-slate-400">North-East states historically lead in turnout</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stateTurnout} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[50, 85]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="state" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="turnout" name="Turnout %" radius={[0, 4, 4, 0]}>
                  {stateTurnout.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Suggested Visualizations */}
      <div className="p-6 rounded-3xl bg-emerald-600/5 border border-emerald-500/20 space-y-3">
        <h4 className="text-sm font-bold text-emerald-400">Suggested Visualization Formats</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Racing Bar Chart', use: 'Turnout trends across years' },
            { label: 'Choropleth Map', use: 'State-wise turnout geography' },
            { label: 'Donut Chart', use: 'Seat-type distribution' },
            { label: 'Gender Gap Chart', use: 'Age-group registration parity' },
          ].map((v, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-xs font-bold text-white">{v.label}</p>
              <p className="text-[10px] text-slate-500">{v.use}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
