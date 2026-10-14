export default function StatCard({ icon: Icon, label, value, caption, tint }) {
  return <article className="card stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon" style={tint ? { background: `${tint}1c`, color: tint } : undefined}><Icon size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-caption">{caption}</div></article>
}