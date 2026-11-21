// Brand Review Desk and Governance Demos for Klarity
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'motion/react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  FileCheck,
  FileText,
  Images,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { BrandMark } from '../BrandMark'
import { AnimatedValue } from '../AnimatedValue'
import WakeSlider from '../WakeSlider'
import { isReducedMotion } from '../../lib/animations'
import { SlidingGroup, spring } from './LandingPrimitives'
import { contextFiles, reviewExamples, workflows } from './landingData'

const PRESET_DRAFTS = {
  spring: {
    id: 'spring',
    title: 'Aster & Oak · Spring Collection Launch Plate',
    text: 'Aster & Oak creates thoughtful designs with an organic aesthetic. Our new collection delivers seamless craftsmanship across both digital and physical living environments.\n\nEvery piece is crafted in small batches to maintain 100% eco-friendly integrity without compromise.',
  },
  clean: {
    id: 'clean',
    title: 'Aster & Oak Care & Standards Primer',
    text: 'We craft every Aster & Oak piece in small batches from high-grade materials. Each piece is finished slowly to achieve a durable, tactile finish that deepens with daily rituals.\n\nOur products are inspected by hand to ensure longevity and quality.',
  },
  blank: {
    id: 'blank',
    title: 'Untitled Draft Plate',
    text: '',
  },
}

export function CreatorStudioDemo({ getPath }) {
  const [selectedTemplate, setSelectedTemplate] = useState('spring')
  const [viewMode, setViewMode] = useState('specimen') // 'specimen' | 'write'
  const [text, setText] = useState(PRESET_DRAFTS.spring.text)
  const [title, setTitle] = useState(PRESET_DRAFTS.spring.title)
  const [fixedTerms, setFixedTerms] = useState([])
  const [applyingRules, setApplyingRules] = useState(false)
  const [rewriting, setRewriting] = useState(false)

  const isSeamlessFixed = fixedTerms.includes('seamless') || !text.toLowerCase().includes('seamless')
  const isEcoFixed = fixedTerms.includes('100% eco-friendly') || !text.toLowerCase().includes('100% eco-friendly')

  const issuesCount = (isSeamlessFixed ? 0 : 1) + (isEcoFixed ? 0 : 1)
  const isClean = issuesCount === 0

  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const readingTime = Math.max(1, Math.ceil(words / 3.8))

  // Scores match real app: 84 base, 98 when fixed
  const overallScore = isClean ? 98 : 84
  const lexiconScore = isSeamlessFixed ? 100 : 74
  const esgScore = isEcoFixed ? 100 : 65

  const handleSelectTemplate = (key) => {
    setSelectedTemplate(key)
    const preset = PRESET_DRAFTS[key]
    setTitle(preset.title)
    setText(preset.text)
    setFixedTerms([])
  }

  const fixTerm = (term, replacement) => {
    setText((prev) => prev.replace(new RegExp(term, 'gi'), replacement))
    setFixedTerms((prev) => [...prev, term])
  }

  const fixAll = () => {
    let updated = text
    updated = updated.replace(/seamless/gi, 'considered')
    updated = updated.replace(/100% eco-friendly/gi, 'certified organic flax')
    setText(updated)
    setFixedTerms(['seamless', '100% eco-friendly'])
  }

  const handleAiRewrite = () => {
    setRewriting(true)
    setTimeout(() => {
      fixAll()
      setRewriting(false)
    }, 450)
  }

  const handleApplyRules = () => {
    setApplyingRules(true)
    setTimeout(() => setApplyingRules(false), 500)
  }

  const resetDraft = () => {
    handleSelectTemplate(selectedTemplate)
  }

  return (
    <div className="creator-studio-demo" data-reveal>
      {/* Real Toolbar Strip matching CreatorStudio.jsx */}
      <div className="creator-toolbar-strip">
        <div className="creator-toolbar-strip__left">
          <span className="creator-toolbar-label">Load Template:</span>
          <button
            type="button"
            className={`btn-preset ${selectedTemplate === 'spring' ? 'is-active' : ''}`}
            onClick={() => handleSelectTemplate('spring')}
          >
            Spring Specimen (2 Flags)
          </button>
          <button
            type="button"
            className={`btn-preset ${selectedTemplate === 'clean' ? 'is-active' : ''}`}
            onClick={() => handleSelectTemplate('clean')}
          >
            Clean Copy (100% On-Brand)
          </button>
          <button
            type="button"
            className={`btn-preset btn-preset--blank ${selectedTemplate === 'blank' ? 'is-active' : ''}`}
            onClick={() => handleSelectTemplate('blank')}
          >
            <Plus size={13} /> Blank Document
          </button>
        </div>

        <div className="creator-toolbar-strip__right">
          <div className="editor-mode-toggle">
            <button
              type="button"
              className={`btn-preset ${viewMode === 'write' ? 'is-active' : ''}`}
              onClick={() => setViewMode('write')}
            >
              <Edit3 size={13} /> Live Writer
            </button>
            <button
              type="button"
              className={`btn-preset ${viewMode === 'specimen' ? 'is-active' : ''}`}
              onClick={() => setViewMode('specimen')}
            >
              <FileCheck size={13} /> Specimen View
            </button>
          </div>
        </div>
      </div>

      {/* Real Specimen Desk Card matching CreatorStudio.jsx & media_1795244045657.png */}
      <div className="specimen-desk-card">
        <header className="specimen-desk-card__top">
          <div className="specimen-desk-card__title-lockup">
            <FileText size={18} className="specimen-desk-card__icon" />
            <span className="specimen-desk-card__title">{title}</span>
          </div>
          <div className="specimen-desk-card__top-actions">
            <button
              type="button"
              className="button button-outline"
              style={{ height: '34px', fontSize: '13px', padding: '0 12px' }}
              onClick={handleApplyRules}
              disabled={applyingRules}
            >
              <RefreshCw size={13} className={applyingRules ? 'animate-spin' : ''} />
              {applyingRules ? 'Applying...' : 'Apply Guideline Rules'}
            </button>
          </div>
        </header>

        <div className="specimen-desk-grid">
          {/* Left Column: Specimen Pane */}
          <div className="specimen-pane">
            <div className="specimen-pane__head">
              <div className="specimen-pane__badges">
                <span className="specimen-pane__label">DRAFT COPY SPECIMEN</span>
                {issuesCount > 0 ? (
                  <span className="specimen-flag-pill specimen-flag-pill--warn">
                    ⚠️ {issuesCount} {issuesCount === 1 ? 'issue flagged' : 'issues flagged'}
                  </span>
                ) : (
                  <span className="specimen-flag-pill specimen-flag-pill--good">
                    <Check size={12} /> Ready to publish
                  </span>
                )}
              </div>
              <div className="specimen-pane__legend">
                <span className="legend-item">
                  <span className="dot dot--orange" /> Flagged Buzzword
                </span>
                <span className="legend-item">
                  <span className="dot dot--red" /> Unverified Claim
                </span>
              </div>
            </div>

            {/* Specimen Box */}
            <div className="specimen-box">
              {viewMode === 'write' ? (
                <div className="writer-container">
                  <textarea
                    className="specimen-box__textarea"
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write or paste your draft copy here. Klarity performs real-time pre-flight analysis against brand guidelines as you type..."
                  />
                  <div className="writer-live-hint">
                    <span>
                      <Sparkles size={12} /> Live pre-flight active · Type or edit freely
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn-ai-rewrite-inline"
                        onClick={handleAiRewrite}
                        disabled={rewriting || !text.trim()}
                      >
                        <Sparkles size={13} className={rewriting ? 'animate-spin' : ''} />
                        {rewriting ? 'AI Rewriting...' : 'AI Rewrite'}
                      </button>
                      <button
                        type="button"
                        className="link-switch-preview"
                        onClick={() => setViewMode('specimen')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        See highlighted flags &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="specimen-box__content">
                  {text ? (
                    text.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} className="specimen-paragraph">
                        {para.split(/(seamless|100% eco-friendly|considered|certified organic flax)/gi).map((part, tIdx) => {
                          const low = part.toLowerCase()
                          if (low === 'seamless') {
                            return (
                              <mark
                                key={tIdx}
                                className="specimen-highlight specimen-highlight--buzzword"
                                title="Flagged Buzzword: Click to replace with 'considered'"
                                onClick={() => fixTerm('seamless', 'considered')}
                              >
                                {part}
                              </mark>
                            )
                          }
                          if (low === '100% eco-friendly') {
                            return (
                              <mark
                                key={tIdx}
                                className="specimen-highlight specimen-highlight--claim"
                                title="Unverified Claim: Click to replace with 'certified organic flax'"
                                onClick={() => fixTerm('100% eco-friendly', 'certified organic flax')}
                              >
                                {part}
                              </mark>
                            )
                          }
                          if (low === 'considered' || low === 'certified organic flax') {
                            return (
                              <mark key={tIdx} className="hl hl--approved" title="Approved phrasing">
                                {part}
                              </mark>
                            )
                          }
                          return part
                        })}
                      </p>
                    ))
                  ) : (
                    <p className="specimen-empty-text" style={{ color: 'var(--faint)', fontStyle: 'italic' }}>
                      No copy in this draft yet. Switch to Live Writer above to write.
                    </p>
                  )}
                </div>
              )}

              {/* Quick Actions overlay */}
              {issuesCount > 0 ? (
                <div className="specimen-quick-actions">
                  <span className="specimen-quick-hint">
                    <Sparkles size={13} /> Click any term to replace with approved phrasing:
                  </span>
                  <div className="specimen-fix-chips">
                    {!isSeamlessFixed && (
                      <button
                        type="button"
                        className="chip-fix"
                        onClick={() => fixTerm('seamless', 'considered')}
                      >
                        Fix &quot;seamless&quot; → &quot;considered&quot;
                      </button>
                    )}
                    {!isEcoFixed && (
                      <button
                        type="button"
                        className="chip-fix"
                        onClick={() => fixTerm('100% eco-friendly', 'certified organic flax')}
                      >
                        Fix &quot;eco-friendly&quot; → &quot;certified organic flax&quot;
                      </button>
                    )}
                    <button type="button" className="chip-fix chip-fix--all" onClick={fixAll}>
                      Fix all issues (1-click)
                    </button>
                    <button
                      type="button"
                      className="chip-fix chip-fix--ai"
                      onClick={handleAiRewrite}
                      disabled={rewriting}
                    >
                      <Sparkles size={13} className={rewriting ? 'animate-spin' : ''} />
                      {rewriting ? 'AI Rewriting...' : 'AI Rewrite Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                fixedTerms.length > 0 && (
                  <div className="specimen-quick-actions">
                    <span className="specimen-quick-hint text-good">
                      <CheckCircle2 size={13} /> All terms conform to Aster &amp; Oak brand standards.
                    </span>
                    <div className="specimen-fix-chips">
                      <button type="button" className="chip-fix" onClick={resetDraft}>
                        <RotateCcw size={12} /> Revert to original draft
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Specimen Pane Foot */}
            <footer className="specimen-pane__foot">
              <div className="specimen-meta-summary">
                Length: <strong>{words} words</strong> · Reading time:{' '}
                <strong>{readingTime} sec</strong> · Target Tone:{' '}
                <strong>Calm &amp; Grounded</strong>
              </div>
              <div className="specimen-pills-wrap">
                <span className="specimen-status-pill specimen-status-pill--green">
                  Tone: 98% Consistent
                </span>
                {issuesCount > 0 ? (
                  <span className="specimen-status-pill specimen-status-pill--tan">
                    {issuesCount} {issuesCount === 1 ? 'Flag Pending' : 'Flags Pending'}
                  </span>
                ) : (
                  <span className="specimen-status-pill specimen-status-pill--green">
                    0 Flags · Clean Specimen
                  </span>
                )}
              </div>
            </footer>
          </div>

          {/* Right Column: Brand Compliance Index */}
          <aside className="compliance-pane">
            <div className="compliance-card">
              <div className="compliance-card__head">
                <span className="compliance-card__label">BRAND COMPLIANCE INDEX</span>
                {issuesCount > 0 ? (
                  <span className="compliance-action-badge">ACTION REQUIRED</span>
                ) : (
                  <span className="compliance-action-badge compliance-action-badge--good">
                    READY TO PUBLISH
                  </span>
                )}
              </div>

              <div className="compliance-score-display">
                <span className="compliance-score-num">
                  <AnimatedValue value={overallScore} />
                </span>
                <span className="compliance-score-denom">/100</span>
              </div>

              <div className="compliance-meter-track">
                <div
                  className={`compliance-meter-fill ${issuesCount === 0 ? 'is-good' : 'is-warn'}`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>

              <p className="compliance-subtext">
                {issuesCount > 0
                  ? `${issuesCount} terms require editorial adjustments before publishing.`
                  : 'All editorial requirements satisfied. Ready for sign-off.'}
              </p>
            </div>

            {/* Evaluation Breakdown */}
            <div className="breakdown-section">
              <h4 className="breakdown-section__title">EVALUATION BREAKDOWN</h4>
              <ul className="breakdown-list">
                <li className="breakdown-item">
                  <span className="breakdown-item__name">Voice &amp; Tone Register</span>
                  <strong className="breakdown-item__value text-good">98%</strong>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-item__name">Approved Lexicon</span>
                  <strong className={`breakdown-item__value ${lexiconScore >= 85 ? 'text-good' : 'text-warn'}`}>
                    {lexiconScore}%
                  </strong>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-item__name">ESG Claim Substantiation</span>
                  <strong className={`breakdown-item__value ${esgScore >= 85 ? 'text-good' : 'text-danger'}`}>
                    {esgScore}%
                  </strong>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-item__name">Visual Asset Tokens</span>
                  <strong className="breakdown-item__value text-good">100%</strong>
                </li>
              </ul>
            </div>

            {/* Actions: Direct Submit & Full Review Desk */}
            <div className="compliance-actions">
              <Link to={getPath ? getPath('/reviews') : '/reviews'} className="btn-full-dark">
                Submit Draft for Team Review <Send size={15} style={{ marginLeft: 6 }} />
              </Link>
              <Link to={getPath ? getPath('/reviews') : '/reviews'} className="btn-full-secondary">
                Open Full Review Desk <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export function ReviewDeskDemo({ getPath }) {
  const [fixed, setFixed] = useState([])
  const [decision, setDecision] = useState('pending')

  const isSeamlessFixed = fixed.includes('seamless')
  const isEcoFixed = fixed.includes('eco')
  const issuesRemaining = 2 - fixed.length
  const score = 84 + fixed.length * 7

  const applyFix = (term) => {
    setFixed((prev) => (prev.includes(term) ? prev : [...prev, term]))
    if (fixed.length === 1) {
      setDecision('approved')
    }
  }

  const reset = () => {
    setFixed([])
    setDecision('pending')
  }

  return (
    <div className="review-desk-demo" data-reveal>
      <header className="review-desk-demo__top">
        <div className="review-desk-demo__meta">
          <div className="review-desk-demo__eyebrow mono">
            <span>EDITORIAL MANUSCRIPT</span>
            <span>·</span>
            <span>#DOC-0042</span>
          </div>
          <h3 className="review-desk-demo__title">Aster &amp; Oak · Spring Collection Launch Plate</h3>
          <p className="review-desk-demo__author">
            Submitted by <strong>Maya Lin</strong> · Brand Creator Desk · 14 minutes ago
          </p>
        </div>
        <div className="review-desk-demo__badges">
          <span className={`review-status-pill ${issuesRemaining === 0 ? 'is-good' : 'is-warn'}`}>
            {issuesRemaining === 0 ? '✓ Ready for publish' : '⚠️ Action required'}
          </span>
          <span className="review-score-pill">
            <AnimatedValue value={score} /> / 100
          </span>
        </div>
      </header>

      <div className="review-desk-demo__grid">
        {/* Left: Submitted Content Specimen */}
        <div className="rdesk-panel content-panel">
          <div className="content-panel__head">
            <div>
              <h2>Submitted content</h2>
              <p>42 words · Manuscript Specimen</p>
            </div>
            <span className="content-panel__type">
              <FileText size={13} /> Website copy
            </span>
          </div>

          <div className="content-body">
            <div className="content-body__browser">
              <span />
              <span />
              <span />
              <small>asteroak.studio/specimen</small>
            </div>
            <p>
              Aster &amp; Oak creates thoughtful designs with an organic aesthetic. Our new collection delivers{' '}
              {isSeamlessFixed ? (
                <mark className="hl hl--approved" title="Approved phrasing">
                  considered
                </mark>
              ) : (
                <mark className="hl hl--warning" title="Tone mismatch: Overused superlative">
                  seamless
                </mark>
              )}{' '}
              craftsmanship across both digital and physical living environments.
              <br />
              <br />
              Every piece is crafted in small batches to maintain{' '}
              {isEcoFixed ? (
                <mark className="hl hl--approved" title="Approved substantiated phrasing">
                  certified organic flax
                </mark>
              ) : (
                <mark className="hl hl--critical" title="Unverified claim: Absolute environmental claim">
                  100% eco-friendly
                </mark>
              )}{' '}
              integrity without compromise.
            </p>
          </div>

          <div className="content-notes">
            <div>
              <span>Reviewer notes</span>
              <p>Lead Reviewer: “Please swap 'seamless' for 'considered' and substantiate the flax claim before syndication.”</p>
            </div>
            <span className="content-notes__date">Audited against Aster &amp; Oak v1.4</span>
          </div>
        </div>

        {/* Right: Review Report & Human Decision Gate */}
        <div className="rdesk-panel report-panel">
          <div className="report-panel__head">
            <div>
              <h2>Brand Review Report</h2>
              <p>
                {issuesRemaining === 0 ? 'All 2 rules satisfied' : `${issuesRemaining} findings require adjustment`} · {score}/100
              </p>
            </div>
            <span className={`report-status ${issuesRemaining === 0 ? 'tone-good' : 'tone-warn'}`}>
              <span /> {issuesRemaining === 0 ? 'Approved' : 'Needs Changes'}
            </span>
          </div>

          <div className="report-score">
            <div className="report-score__number">
              <AnimatedValue value={score} suffix="/100" />
            </div>
            <div className="report-score__bar">
              <span
                className={`report-score__fill ${issuesRemaining === 0 ? 'is-good' : 'is-warn'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p>
              {issuesRemaining === 0
                ? 'All terms conform to Aster & Oak living guidelines. Approved for retail release.'
                : 'Scanned against Aster & Oak Living Guidelines v1.4. Non-compliant phrases are flagged for reviewer action.'}
            </p>
          </div>

          <div className="rdesk-issues-list">
            {/* Finding 1 */}
            <article className={`rdesk-issue ${isSeamlessFixed ? 'is-fixed' : ''}`}>
              <div className="rdesk-issue__head">
                <span className="severity-tag severity-tag--warning">Warning</span>
                <span className="rdesk-issue__rule mono">Voice Guide §3.1</span>
              </div>
              <h4>Tone mismatch: Overused superlative</h4>
              <p>Use calm, specific language. Avoid promotional superlatives like &quot;seamless&quot;.</p>
              <button
                type="button"
                className="btn-apply-rule"
                disabled={isSeamlessFixed}
                onClick={() => applyFix('seamless')}
              >
                {isSeamlessFixed ? <Check size={12} /> : <Sparkles size={12} />}
                {isSeamlessFixed ? 'Rule Applied: "considered"' : 'Apply: "considered"'}
              </button>
            </article>

            {/* Finding 2 */}
            <article className={`rdesk-issue ${isEcoFixed ? 'is-fixed' : ''}`}>
              <div className="rdesk-issue__head">
                <span className="severity-tag severity-tag--critical">Critical</span>
                <span className="rdesk-issue__rule mono">Claims Policy §2.4</span>
              </div>
              <h4>Unverified claim: Absolute environmental claim</h4>
              <p>Absolute environmental claims require verified third-party certification on file.</p>
              <button
                type="button"
                className="btn-apply-rule"
                disabled={isEcoFixed}
                onClick={() => applyFix('eco')}
              >
                {isEcoFixed ? <Check size={12} /> : <Sparkles size={12} />}
                {isEcoFixed ? 'Rule Applied: "certified organic flax"' : 'Apply: "certified organic flax"'}
              </button>
            </article>
          </div>

          {/* Human Reviewer Decision Gate */}
          <div className="rdesk-gate">
            <span className="rdesk-gate__title mono">HUMAN REVIEWER GATE</span>
            <div className="rdesk-gate__buttons">
              <button
                type="button"
                className={`gate-btn gate-btn--approve ${decision === 'approved' ? 'is-selected' : ''}`}
                onClick={() => setDecision('approved')}
              >
                <CheckCircle2 size={14} /> Approve Draft
              </button>
              <button
                type="button"
                className={`gate-btn gate-btn--request ${decision === 'changes_requested' ? 'is-selected' : ''}`}
                onClick={() => setDecision('changes_requested')}
              >
                <AlertTriangle size={14} /> Request Changes
              </button>
              <button
                type="button"
                className={`gate-btn gate-btn--reject ${decision === 'rejected' ? 'is-selected' : ''}`}
                onClick={() => setDecision('rejected')}
              >
                <X size={14} /> Reject
              </button>
            </div>
            <p className="rdesk-gate__note">
              Suggestions support reviewers. The publishing decision always stays with people.
            </p>
          </div>

          <div className="rdesk-foot">
            <button
              type="button"
              className="rdesk-reset-btn"
              disabled={fixed.length === 0}
              onClick={reset}
            >
              <RotateCcw size={12} /> Revert audit
            </button>
            <Link to={getPath ? getPath('/reviews') : '/reviews'} className="rdesk-open-link">
              Open Full Review Desk in Workspace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Backward-compatible exports
export const ReviewDemo = CreatorStudioDemo
export const VoiceDemo = ReviewDeskDemo

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
