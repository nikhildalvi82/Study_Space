import { Check } from 'lucide-react'

export default function BlockRow({ block, checked, onToggle }) {
  const isStudy = block.type === 'study'
  return <div className={`timeline-row ${checked ? 'done' : ''}`}>
    <div className="timeline-time">{block.startLabel}<br />{block.endLabel}</div>
    <span className={`timeline-marker ${block.type}`} />
    <div><div className="timeline-title">{block.title}</div>{block.subject && <div className="timeline-detail">{block.subject} · {block.minutes} min focus</div>}</div>
    {isStudy ? <button className={`check-button ${checked ? 'checked' : ''}`} aria-label={`${checked ? 'Undo' : 'Complete'} ${block.title}`} onClick={onToggle}>{checked && <Check size={16} />}</button> : <span />}
  </div>
}