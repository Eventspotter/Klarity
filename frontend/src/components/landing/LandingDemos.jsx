// Brand Review Desk and Governance Demos for Klarity
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'motion/react'
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  Images,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  X,
  Scale,
  SlidersHorizontal,
} from 'lucide-react'
import { BrandMark } from '../BrandMark'
import { AnimatedValue } from '../AnimatedValue'
import WakeSlider from '../WakeSlider'
import { isReducedMotion } from '../../lib/animations'
import { SlidingGroup, spring } from './LandingPrimitives'
import { contextFiles, reviewExamples, workflows } from './landingData'

export function ReviewDemo({ getPath }) {
  const [selected, setSelected] = useState('launch')
  const [fixed, setFixed] = useState([])
  const [version, setVersion] = useState('draft')
  const root = useRef(null)
  const seen = useInView(root, { once: true })
  const example = reviewExamples.find((item) => item.id === selected) || reviewExamples[0]
  const complete = fixed.length === example.issues.length
  const showingFixes = version === 'revised'
  const score = 84 + fixed.length * 7

  const draft = example.issues.reduce(
    (text, issue, i) => (fixed.includes(i) ? text.replace(issue.term, issue.fix) : text),
    example.before
  )

  const selectExample = (id) => {
    setSelected(id)
    setFixed([])
    setVersion('draft')
  }

  const apply = (i) => {
    setFixed((items) => (items.includes(i) ? items : [...items, i]))
    setVersion('revised')
  }

  const reset = () => {
    setFixed([])
    setVersion('draft')
  }

  const highlightedDraft = () => {
    const pattern = new RegExp(
      `(${example.issues.map((issue) => issue.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'g'
    )
    return example.before.split(pattern).map((text, i) => {
      const isIssue = example.issues.some((issue) => issue.term === text)
      if (isIssue) {
        return (
          <mark key={i} className="demo-hl demo-hl--flagged">
            {text}
          </mark>
        )
      }
      return text
    })
  }

  return (
    <div className="app review-demo" ref={root} aria-label="Interactive Klarity review desk demonstration">
      {/* Left Workspace Sidebar */}
      <aside className="app-side">
        <div className="demo-brand">
          <BrandMark size={24} />
          <strong>Klarity</strong>
          <span className="demo-label">WORKSPACE</span>
        </div>

        <p className="side-label mono">REVIEW QUEUE</p>
        <SlidingGroup className="demo-projects" active={selected} vertical aria-label="Example submissions">
          {reviewExamples.map((item) => (
            <button
              type="button"
              key={item.id}
              data-selected={selected === item.id}
              aria-pressed={selected === item.id}
              onClick={() => selectExample(item.id)}
            >
              <FileText size={14} />
              <span>{item.name}</span>
            </button>
          ))}
        </SlidingGroup>

        <p className="side-label mono">BRAND KNOWLEDGE BASE</p>
        <ul className="side-recents">
          <li>
            <BookOpen size={13} /> Voice &amp; Tone Register
          </li>
          <li>
            <ShieldCheck size={13} /> Approved Claims §2.4
          </li>
          <li>
            <Images size={13} /> Visual Standards &amp; Tokens
          </li>
        </ul>

        <div className="side-plan">
          <span className="plan-dot" />
          <span>Active Governance Desk</span>
          <small>Aster &amp; Oak · 14 rules active</small>
        </div>
      </aside>

      {/* Middle Column: Submitted Content Specimen */}
      <section className="chat demo-specimen-pane" aria-label="Submitted copy inspection">
        <header className="chat-head">
          <strong>
            <FileText size={14} />
            {example.name}
          </strong>
          <select
            className="demo-example-picker"
            aria-label="Example submission"
            value={selected}
            onChange={(e) => selectExample(e.target.value)}
          >
            {reviewExamples.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span className="file-chip">{example.channel}</span>
          <span className="file-chip mono">{example.documentId}</span>
        </header>

        <div className="chat-thread demo-thread">
          <div className="demo-document">
            <div className="demo-document-head">
              <span className="mono">SUBMITTED CONTENT SPECIMEN</span>
              <SlidingGroup active={version} className="versions" aria-label="Content version">
                <button
                  type="button"
                  data-selected={version === 'draft'}
                  aria-pressed={version === 'draft'}
                  onClick={() => setVersion('draft')}
                >
                  <span>Original Draft</span>
                </button>
                <button
                  type="button"
                  data-selected={version === 'revised'}
                  aria-pressed={version === 'revised'}
                  onClick={() => setVersion('revised')}
                >
                  <span>Revised Draft</span>
                </button>
              </SlidingGroup>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`${selected}-${version}-${fixed.join()}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="demo-specimen-text"
              >
                {showingFixes ? draft : highlightedDraft()}
              </motion.p>
            </AnimatePresence>

            <span className="demo-doc-meta">Aster &amp; Oak · Editorial Manuscript</span>
          </div>

          {/* Real Klarity Reviewer Notes / Inspection Summary (NO Chatbot) */}
          <div className="demo-inspection-card">
            <div className="demo-inspection-card__head">
              <div className="demo-inspection-card__title">
                <ShieldCheck size={16} className="text-sage" />
                <strong>Automated Brand Guideline Audit</strong>
              </div>
              <span className={`demo-inspection-badge ${complete ? 'is-good' : 'is-warn'}`}>
                {complete ? '✓ All rules satisfied' : `⚠️ ${example.issues.length - fixed.length} findings`}
              </span>
            </div>

            <p className="demo-inspection-card__body">
              {complete
                ? 'All terms conform to Aster & Oak Voice & Tone guidelines and substantiated claims standards. Ready for reviewer sign-off.'
                : 'Scanned against Aster & Oak Living Guidelines v1.4. Non-compliant phrases are flagged on the right for reviewer action.'}
            </p>

            <div className="demo-inspection-pills">
              <span className="inspection-pill">
                <BookOpen size={12} /> Voice Guide §3.1
              </span>
              <span className="inspection-pill">
                <ShieldCheck size={12} /> Claims Policy §2.4
              </span>
              <span className="inspection-pill">
                <CheckCircle2 size={12} /> Editorial Sign-off Required
              </span>
            </div>
          </div>
        </div>

        <div className="demo-review-foot">
          <span role="status">
            {complete
              ? '✓ Suggestions applied · Ready for human approval'
              : `${example.issues.length - fixed.length} issues requiring review`}
          </span>
          <button type="button" onClick={reset} disabled={!fixed.length}>
            <RotateCcw size={12} /> Revert to draft
          </button>
        </div>
      </section>

      {/* Right Column: Klarity Review Report */}
      <aside className="canvas" aria-label="Review findings">
        <header className="canvas-head">
          <strong>
            <ShieldCheck size={14} /> Brand Review Report
          </strong>
          <span className={`demo-status ${complete ? 'is-good' : ''}`}>
            {complete ? 'Approved' : 'Needs Changes'}
          </span>
        </header>

        <div className="canvas-body">
          <div className="demo-score">
            <span>Brand Alignment Score</span>
            <div>
              <AnimatedValue value={score} />
              <small>/ 100</small>
            </div>
          </div>

          <WakeSlider
            value={score}
            min={0}
            max={100}
            bars={28}
            height={30}
            restHeight={9}
            gap={3}
            fillColor={complete ? 'var(--good, #34d399)' : 'var(--sage, #38bdf8)'}
            trackColor="var(--line)"
            ariaLabel="Brand alignment score"
            readOnly
          />

          <div className="demo-issues">
            <div className="demo-issues-head">
              <span>What Needs Attention</span>
              <small>{example.issues.length} audit rules</small>
            </div>

            {example.issues.map((issue, i) => (
              <article key={`${selected}-${i}`} className="demo-issue" data-fixed={fixed.includes(i)}>
                <div className="demo-issue-title">
                  <span>
                    {fixed.includes(i) ? <CheckCircle2 size={13} /> : <span className="issue-dot" />}
                    {issue.kind}
                  </span>
                  <small>{issue.rule}</small>
                </div>
                <h3>{issue.title}</h3>
                <p>{issue.why}</p>
                <button
                  type="button"
                  className="apply-fix"
                  disabled={fixed.includes(i)}
                  onClick={() => apply(i)}
                >
                  {fixed.includes(i) ? <Check size={12} /> : <Sparkles size={12} />}
                  {fixed.includes(i) ? 'Rule Applied' : `Apply: “${issue.fix}”`}
                </button>
              </article>
            ))}
          </div>
        </div>

        <Link className="demo-open" to={getPath('/reviews')}>
          Open full review desk <ArrowRight size={14} />
        </Link>
      </aside>
    </div>
  )
}

const voiceExamples = {
  Website: {
    original: 'Revolutionary homeware that will transform your life.',
    revised: 'Thoughtfully crafted homeware for a little everyday calm.',
    note: 'Voice guide §3.1 · Replace exaggerated promises with concrete everyday benefits.',
  },
  Social: {
    original: 'HURRY! Get your hands on our game-changing collection.',
    revised: 'Take a moment. Explore our new collection, made for slower days.',
    note: 'Voice guide §3.2 · Invite the reader without all-caps urgency or buzzwords.',
  },
  Email: {
    original: 'Dear valued customer, we are pleased to announce our latest range.',
    revised: 'Something thoughtful for your home. Meet our latest collection.',
    note: 'Voice guide §3.3 · Speak directly and warmly, without corporate stock phrases.',
  },
}

export function VoiceDemo() {
  const [channel, setChannel] = useState('Website')
  const [revised, setRevised] = useState(true)
  const example = voiceExamples[channel]

  return (
    <div className="styles-demo" data-reveal>
      <div className="sd-controls">
        <p className="mono sd-label">ONE BRAND, EVERY CHANNEL</p>
        <p className="sd-brief">“Introduce the new Aster &amp; Oak collection.”</p>

        <p className="mono sd-label">CONTENT CHANNEL</p>
        <SlidingGroup className="seg big" active={channel} aria-label="Content type">
          {Object.keys(voiceExamples).map((type) => (
            <button
              key={type}
              type="button"
              data-selected={channel === type}
              aria-pressed={channel === type}
              onClick={() => setChannel(type)}
            >
              <span>{type}</span>
            </button>
          ))}
        </SlidingGroup>

        <p className="mono sd-label">EDITORIAL REGISTER</p>
        <SlidingGroup className="seg big" active={revised} aria-label="Compare copy">
          {[false, true].map((on) => (
            <button
              key={String(on)}
              type="button"
              data-selected={revised === on}
              aria-pressed={revised === on}
              onClick={() => setRevised(on)}
            >
              <span>{on ? 'Klarity Verified' : 'Unfiltered Draft'}</span>
            </button>
          ))}
        </SlidingGroup>
      </div>

      <div className="sd-out">
        <div className="sd-out-head">
          <span>
            <Sparkles size={14} />
            {revised ? 'Aster & Oak Grounded Register' : 'Draft Copy (Voice Drift)'}
          </span>
          <em className="mono">VERIFIED SPEC</em>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={`${channel}-${revised}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {revised ? example.revised : example.original}
          </motion.p>
        </AnimatePresence>

        <div className="voice-evidence">
          <BookOpen size={14} />
          <span>{example.note}</span>
        </div>
      </div>
    </div>
  )
}

export function KnowledgeDemo() {
  const [added, setAdded] = useState(['voice', 'facts'])
  const used = contextFiles.filter((file) => added.includes(file.id))

  return (
    <div className="proj" data-reveal>
      <div className="proj-files">
        <p className="mono sd-label">ASTER &amp; OAK · LIVING GUIDELINE LIBRARY</p>
        <ul>
          {contextFiles.map((file) => {
            const on = added.includes(file.id)
            return (
              <li key={file.id}>
                <button
                  type="button"
                  data-on={on}
                  aria-pressed={on}
                  onClick={() =>
                    setAdded((items) => (on ? items.filter((id) => id !== file.id) : [...items, file.id]))
                  }
                >
                  <FileText size={15} />
                  <span>{file.name}</span>
                  <em>{file.detail}</em>
                  <Check size={14} style={{ opacity: on ? 1 : 0.15 }} />
                </button>
              </li>
            )
          })}
        </ul>

        <div className="landing-context-meter">
          <span>Active Standards Applied</span>
          <b>
            <AnimatedValue value={used.length} /> / 4
          </b>
          <i>
            <motion.b animate={{ width: `${used.length * 25}%` }} transition={spring} />
          </i>
        </div>
      </div>

      {/* Real Guideline Spec Panel (NO Chatbot) */}
      <div className="proj-answer demo-guideline-pane">
        <div className="demo-guideline-pane__head">
          <span className="mono">ENFORCED GUIDELINE SPECIFICATION</span>
          <span className="demo-guideline-count">{used.length} active standards</span>
        </div>

        <div className="demo-guidelines-list" aria-live="polite">
          {used.length ? (
            used.map((file) => (
              <article key={file.id} className="demo-guideline-card">
                <div className="demo-guideline-card__head">
                  <span className="demo-guideline-cat">{file.category}</span>
                  <strong>{file.rule}</strong>
                </div>
                <p className="demo-guideline-card__text">{file.guidance}</p>
                <div className="demo-guideline-card__examples">
                  <div className="example-block example-do">
                    <span className="ex-label">
                      <Check size={11} /> DO
                    </span>
                    <code>{file.doExample}</code>
                  </div>
                  <div className="example-block example-dont">
                    <span className="ex-label">
                      <X size={11} /> DON’T
                    </span>
                    <code>{file.dontExample}</code>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="demo-guidelines-empty">
              Select one or more guideline standards from the left to inspect their active rules.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function UseCasesDemo() {
  const [selected, setSelected] = useState('copy')
  const item = workflows.find((use) => use.id === selected) || workflows[0]
  const icons = { write: PenLine, facts: ShieldCheck, visuals: Images, review: CheckCircle2 }

  return (
    <div className="convo demo-workflow-hub" data-reveal>
      {/* Workflow Tabs on the left */}
      <SlidingGroup
        className="convo-list"
        active={selected}
        vertical
        role="tablist"
        aria-label="Brand verification workflows"
        aria-orientation="vertical"
      >
        {workflows.map((use) => {
          const Icon = icons[use.icon] || FileText
          return (
            <button
              key={use.id}
              type="button"
              role="tab"
              id={`use-${use.id}`}
              aria-controls="use-panel"
              aria-selected={selected === use.id}
              tabIndex={selected === use.id ? 0 : -1}
              data-active={selected === use.id || undefined}
              data-selected={selected === use.id}
              className="ui-tabs-trigger convo-tab"
              onClick={() => setSelected(use.id)}
            >
              <span className="convo-tab-in">
                <i className="convo-ico">
                  <Icon size={16} />
                </i>
                <b>{use.tab}</b>
                <small>{use.subtitle}</small>
              </span>
            </button>
          )
        })}
      </SlidingGroup>

      {/* Real Klarity Verification & Audit Panel (NO Chatbot) */}
      <div className="convo-panel demo-workflow-panel" role="tabpanel" id="use-panel" aria-labelledby={`use-${selected}`} tabIndex={0}>
        <div className="convo-bar mono">
          <span className="convo-dot" />
          <span>Workflow: {item.title}</span>
          <span className="convo-bar-r">{item.ruleCategory}</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected}
            className="demo-audit-card"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Step 1: Submitted Specimen */}
            <div className="audit-section">
              <div className="audit-section__head">
                <span className="audit-badge audit-badge--submitted">1. SUBMITTED DRAFT SPECIMEN</span>
                <span className="audit-severity">{item.severity}</span>
              </div>
              <div className="audit-specimen-box">
                <p>{item.specimen}</p>
                <div className="audit-flag-tag">
                  <AlertTriangle size={12} />
                  <span>Flagged: <strong>{item.flagged}</strong></span>
                </div>
              </div>
            </div>

            {/* Step 2: Matched Rule & Evidence */}
            <div className="audit-section">
              <div className="audit-section__head">
                <span className="audit-badge audit-badge--matched">2. MATCHED GUIDELINE STANDARD</span>
                <span className="audit-rule-code">{item.rule}</span>
              </div>
              <div className="audit-rule-box">
                <p className="audit-rationale">{item.rationale}</p>
              </div>
            </div>

            {/* Step 3: Verified Revision & Review Action */}
            <div className="audit-section">
              <div className="audit-section__head">
                <span className="audit-badge audit-badge--approved">3. COMPLIANT REVISED COPY</span>
                <span className="audit-status-tag">✓ Approved Standard</span>
              </div>
              <div className="audit-approved-box">
                <p>{item.approvedSpecimen}</p>
              </div>
              <div className="audit-actions-bar">
                <div className="audit-action-note">
                  <CheckCircle2 size={14} className="text-good" />
                  <span>{item.reviewAction}</span>
                </div>
                <div className="audit-btn-group">
                  <span className="audit-decision-pill">Human Reviewer Gate</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
