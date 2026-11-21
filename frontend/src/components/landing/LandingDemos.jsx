// Workspace and section layouts adapted from Wren by LN (MIT).
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ArrowRight, BookOpen, Check, CheckCircle2, FileText, Images, PenLine, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import { BrandMark } from '../BrandMark'
import { AnimatedValue } from '../AnimatedValue'
import WakeSlider from '../WakeSlider'
import { isReducedMotion } from '../../lib/animations'
import { SlidingGroup, spring } from './LandingPrimitives'
import { contextFiles, reviewExamples, uses } from './landingData'

export function ReviewDemo({ getPath }) {
  const [selected, setSelected] = useState('launch')
  const [fixed, setFixed] = useState([])
  const [version, setVersion] = useState('draft')
  const [step, setStep] = useState(0)
  const root = useRef(null)
  const seen = useInView(root, { once: true })
  const example = reviewExamples.find(item => item.id === selected)
  const complete = fixed.length === example.issues.length
  const showingFixes = version === 'revised'
  const score = 84 + fixed.length * 7
  const draft = example.issues.reduce((text, issue, i) => fixed.includes(i) ? text.replace(issue.term, issue.fix) : text, example.before)

  useEffect(() => {
    if (!seen) return
    if (isReducedMotion()) { setStep(4); return }
    const timers = [1, 2, 3, 4].map(n => window.setTimeout(() => setStep(n), n * 450))
    return () => timers.forEach(window.clearTimeout)
  }, [seen, selected])

  const selectExample = (id) => { setSelected(id); setFixed([]); setVersion('draft'); setStep(0) }
  const apply = (i) => { setFixed(items => items.includes(i) ? items : [...items, i]); setVersion('revised') }
  const reset = () => { setFixed([]); setVersion('draft') }
  const highlightedDraft = () => {
    const pattern = new RegExp(`(${example.issues.map(issue => issue.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
    return example.before.split(pattern).map((text, i) => example.issues.some(issue => issue.term === text)
      ? <mark key={i}>{text}</mark> : text)
  }

  return <div className="app review-demo" ref={root} aria-label="Interactive Klarity review demonstration">
    <aside className="app-side">
      <div className="demo-brand"><BrandMark size={24} /><strong>Klarity</strong><span className="demo-label">DEMO</span></div>
      <p className="side-label mono">ASTER & OAK</p>
      <SlidingGroup className="demo-projects" active={selected} vertical aria-label="Example submissions">
        {reviewExamples.map(item => <button type="button" key={item.id} data-selected={selected === item.id} aria-pressed={selected === item.id} onClick={() => selectExample(item.id)}>
          <FileText size={14} /><span>{item.name}</span>
        </button>)}
      </SlidingGroup>
      <p className="side-label mono">BRAND KNOWLEDGE</p>
      <ul className="side-recents">
        <li><BookOpen size={13} /> Voice & tone</li>
        <li><ShieldCheck size={13} /> Approved claims</li>
        <li><Images size={13} /> Visual standards</li>
      </ul>
      <div className="side-plan"><span className="plan-dot" /> Human review stays in control<small>Suggestions prepare the decision.</small></div>
    </aside>

    <section className="chat" aria-label="Example content and review">
      <header className="chat-head"><strong><FileText size={14} />{example.name}</strong><select className="demo-example-picker" aria-label="Example submission" value={selected} onChange={e => selectExample(e.target.value)}>{reviewExamples.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="file-chip">{example.channel}</span></header>
      <div className="chat-thread">
        <div className="demo-document">
          <div className="demo-document-head"><span className="mono">CONTENT PREVIEW</span>
            <SlidingGroup active={version} className="versions" aria-label="Content version">
              <button type="button" data-selected={version === 'draft'} aria-pressed={version === 'draft'} onClick={() => setVersion('draft')}><span>Original</span></button>
              <button type="button" data-selected={version === 'revised'} aria-pressed={version === 'revised'} onClick={() => setVersion('revised')}><span>Revised</span></button>
            </SlidingGroup>
          </div>
          <AnimatePresence mode="wait" initial={false}><motion.p key={`${selected}-${version}-${fixed.join()}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {showingFixes ? draft : highlightedDraft()}
          </motion.p></AnimatePresence>
          <span className="demo-doc-meta">Aster & Oak · Calm, thoughtful, grounded</span>
        </div>
        <div className="turn-wren">
          <span className="wren-mark"><BrandMark size={18} /></span>
          <div><p className="demo-analysis-title">A second look, with the reasons attached.</p>
            <ol className="demo-checks" aria-label="Illustrated review steps">
              {['Read the voice & tone guide', 'Compare approved facts and terminology', 'Link each issue to its source', 'Prepare suggestions for a human reviewer'].map((label, i) => <li key={label} data-done={step > i}><Check size={12} />{label}</li>)}
            </ol>
          </div>
        </div>
      </div>
      <div className="demo-review-foot"><span role="status">{complete ? 'Suggestions applied · ready for human review' : `${example.issues.length - fixed.length} issues to resolve`}</span>
        <button type="button" onClick={reset} disabled={!fixed.length}><RotateCcw size={12} /> Reset</button>
      </div>
    </section>

    <aside className="canvas" aria-label="Review findings">
      <header className="canvas-head"><strong><ShieldCheck size={14} /> Brand review</strong><span className={`demo-status ${complete ? 'is-good' : ''}`}>{complete ? 'Ready for review' : 'Needs changes'}</span></header>
      <div className="canvas-body">
        <div className="demo-score"><span>Brand alignment</span><div><AnimatedValue value={score} /><small>/ 100</small></div></div>
        <WakeSlider value={score} min={0} max={100} bars={28} height={30} restHeight={9} gap={3} fillColor="var(--sage)" trackColor="var(--line)" ariaLabel="Example brand alignment score" readOnly />
        <div className="demo-issues">
          {example.issues.map((issue, i) => <article key={`${selected}-${i}`} className="demo-issue" data-fixed={fixed.includes(i)}>
            <div className="demo-issue-title"><span>{fixed.includes(i) ? <CheckCircle2 size={13} /> : <span className="issue-dot" />}{issue.kind}</span><small>{issue.rule}</small></div>
            <h3>{issue.title}</h3><p>{issue.why}</p>
            <button type="button" className="apply-fix" disabled={fixed.includes(i)} onClick={() => apply(i)}>{fixed.includes(i) ? <Check size={12} /> : <Sparkles size={12} />}{fixed.includes(i) ? 'Applied' : `Use “${issue.fix}”`}</button>
          </article>)}
        </div>
      </div>
      <Link className="demo-open" to={getPath('/reviews')}>Open the full review desk <ArrowRight size={14} /></Link>
    </aside>
  </div>
}

const voiceExamples = {
  Website: { original: 'Revolutionary homeware that will transform your life.', revised: 'Thoughtfully crafted homeware for a little everyday calm.', note: 'Voice guide §3.1 · Replace exaggerated promises with a concrete everyday benefit.' },
  Social: { original: 'HURRY! Get your hands on our game-changing collection.', revised: 'Take a moment. Explore our new collection, made for slower days.', note: 'Voice guide §3.2 · Invite the reader without all-caps urgency or buzzwords.' },
  Email: { original: 'Dear valued customer, we are pleased to announce our latest range.', revised: 'Something thoughtful for your home. Meet our latest collection.', note: 'Voice guide §3.3 · Speak directly and warmly, without formal stock phrases.' },
}

export function VoiceDemo() {
  const [channel, setChannel] = useState('Website')
  const [revised, setRevised] = useState(true)
  const example = voiceExamples[channel]
  return <div className="styles-demo" data-reveal>
    <div className="sd-controls"><p className="mono sd-label">ONE BRAND, EVERY CHANNEL</p><p className="sd-brief">“Introduce the new Aster & Oak collection.”</p>
      <p className="mono sd-label">CONTENT TYPE</p><SlidingGroup className="seg big" active={channel} aria-label="Content type">{Object.keys(voiceExamples).map(type => <button key={type} type="button" data-selected={channel === type} aria-pressed={channel === type} onClick={() => setChannel(type)}><span>{type}</span></button>)}</SlidingGroup>
      <p className="mono sd-label">COMPARE THE COPY</p><SlidingGroup className="seg big" active={revised} aria-label="Compare copy">{[false, true].map(on => <button key={String(on)} type="button" data-selected={revised === on} aria-pressed={revised === on} onClick={() => setRevised(on)}><span>{on ? 'Suggested fix' : 'Original draft'}</span></button>)}</SlidingGroup>
    </div>
    <div className="sd-out"><div className="sd-out-head"><span><Sparkles size={14} />{revised ? 'A more familiar voice' : 'The submitted draft'}</span><em className="mono">EXAMPLE</em></div>
      <AnimatePresence mode="wait" initial={false}><motion.p key={`${channel}-${revised}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>{revised ? example.revised : example.original}</motion.p></AnimatePresence>
      <div className="voice-evidence"><BookOpen size={14} /><span>{example.note}</span></div>
    </div>
  </div>
}

export function KnowledgeDemo() {
  const [added, setAdded] = useState(['voice', 'facts'])
  const used = contextFiles.filter(file => added.includes(file.id))
  return <div className="proj" data-reveal>
    <div className="proj-files"><p className="mono sd-label">ASTER & OAK · EXAMPLE BRAND KNOWLEDGE</p><ul>{contextFiles.map(file => {
      const on = added.includes(file.id)
      return <li key={file.id}><button type="button" data-on={on} aria-pressed={on} onClick={() => setAdded(items => on ? items.filter(id => id !== file.id) : [...items, file.id])}><FileText size={15} /><span>{file.name}</span><em>{file.detail}</em><Check size={14} style={{ opacity: on ? 1 : 0.15 }} /></button></li>
    })}</ul><div className="landing-context-meter"><span>Reference sources selected</span><b><AnimatedValue value={used.length} /> / 4</b><i><motion.b animate={{ width: `${used.length * 25}%` }} transition={spring} /></i></div></div>
    <div className="proj-answer"><p className="turn-q">What should this review check?</p><div className="proj-a"><span className="wren-mark"><BrandMark size={18} /></span><div className="knowledge-answer" aria-live="polite">{used.length ? used.map(file => <p key={file.id}>{file.answer}</p>) : <p>Select a reference source to see the guidance it brings into the review.</p>}</div></div><div className="proj-cites">{used.map(file => <span key={file.id}><FileText size={11} />{file.name}</span>)}</div></div>
  </div>
}

export function UseCasesDemo() {
  const [selected, setSelected] = useState('copy')
  const item = uses.find(use => use.id === selected)
  const icons = { write: PenLine, facts: ShieldCheck, visuals: Images, review: CheckCircle2 }
  return <div className="convo" data-reveal>
    <SlidingGroup className="convo-list" active={selected} vertical role="tablist" aria-label="Review use cases" aria-orientation="vertical" onKeyDown={e => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
      e.preventDefault()
      const index = uses.findIndex(use => use.id === selected)
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? uses.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + uses.length) % uses.length
      setSelected(uses[next].id)
      e.currentTarget.querySelectorAll('[role="tab"]')[next].focus()
    }}>{uses.map(use => { const Icon = icons[use.icon]; return <button key={use.id} type="button" role="tab" id={`use-${use.id}`} aria-controls="use-panel" aria-selected={selected === use.id} tabIndex={selected === use.id ? 0 : -1} data-active={selected === use.id || undefined} data-selected={selected === use.id} className="ui-tabs-trigger convo-tab" onClick={() => setSelected(use.id)}><span className="convo-tab-in"><i className="convo-ico"><Icon size={16} /></i><b>{use.tab}</b><small>{use.ask}</small></span></button> })}</SlidingGroup>
    <div className="convo-panel" role="tabpanel" id="use-panel" aria-labelledby={`use-${selected}`} tabIndex={0}><div className="convo-bar mono"><span className="convo-dot" />Review preview<span className="convo-bar-r">{item.tab}</span></div>
      <AnimatePresence mode="wait" initial={false}><motion.div key={selected} className="convo-body" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><p className="bubble-user">{item.ask}</p><div className="thought"><span className="thought-head mono"><Sparkles size={13} />The review, step by step</span><ol>{item.think.map(step => <li key={step}><span className="thought-tick"><Check size={11} /></span>{step}</li>)}</ol></div><div className="answer"><span className="answer-mark"><BrandMark size={21} /></span><div className="answer-text"><strong>{item.result}</strong><p>{item.detail}</p></div></div></motion.div></AnimatePresence>
    </div>
  </div>
}
