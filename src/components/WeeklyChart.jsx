import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function WeeklyChart({ data }) {
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
    <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 4" />
    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#969cad', fontSize: 10 }} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#969cad', fontSize: 10 }} />
    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} hours`, 'Study time']} cursor={{ fill: '#5965d811' }} />
    <Bar dataKey="hours" fill="#6974dc" radius={[5, 5, 0, 0]} maxBarSize={32} />
  </BarChart></ResponsiveContainer></div>
}