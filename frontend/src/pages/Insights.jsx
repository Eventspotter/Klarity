import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Download,
  Flame,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PulseChart, VolumeBars, Heatmap } from '../components/Charts'
import { Avatar, CategoryTag, Panel, SectionHead, Segmented } from '../components/UI'
import { AnimatedValue } from '../components/AnimatedValue'
import { FocusCity } from '../components/ui/focus-city'
import { categoryLabels, cx, formatCount } from '../lib/utils'
import { animateHorizontalBars } from '../lib/animations'

function buildReviewDays(submissions = [], isDemo = false) {
  const DAY_MS = 86_400_000
  const now = new Date()
  
  const subsByDate = new Map()
  submissions.forEach((sub) => {
    if (!sub.submitted_at) return
    const dateStr = sub.submitted_at.slice(0, 10)
    if (!subsByDate.has(dateStr)) subsByDate.set(dateStr, [])
    subsByDate.get(dateStr).push(sub)
  })

  const sessionTemplates = [
    { title: 'Brand voice & tone audit', minutes: 55, startedAt: '09:30' },
    { title: 'Packaging claims review', minutes: 40, startedAt: '11:15' },
    { title: 'Sustainability evidence verification', minutes: 75, startedAt: '14:00' },
    { title: 'Terminology & banned words scan', minutes: 35, startedAt: '16:20' },
    { title: 'Editorial proofing · Campaign copy', minutes: 60, startedAt: '10:00' },
    { title: 'Wholesale deck compliance', minutes: 45, startedAt: '15:10' },
  ]

  const totalDays = 84
  return Array.from({ length: totalDays }, (_, index) => {
    const d = new Date(now.getTime() - (totalDays - 1 - index) * DAY_MS)
    const date = d.toISOString().slice(0, 10)
    const dayOfWeek = d.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const realSubs = subsByDate.get(date) || []
    let sessions = []

    if (realSubs.length > 0) {
      sessions = realSubs.map((s, idx) => ({
        id: `sub-${s.id || idx}`,
        title: s.title || `Review #${s.id}`,
        minutes: 45 + ((s.id * 13) % 45),
        startedAt: s.submitted_at ? s.submitted_at.slice(11, 16) : '10:30',
      }))
    } else if (isDemo && submissions.length > 0) {
      const resting = isWeekend && index % 3 !== 0
      let seed = Math.imul(index + 29, 0x45d9f3b)
      seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b)
      seed = (seed ^ (seed >>> 16)) >>> 0

      // Thursdays and Tuesdays are peak review days in Klarity
      const isPeak = dayOfWeek === 4 || dayOfWeek === 2
      const count = resting ? 0 : isPeak ? 3 + (seed % 2) : isWeekend ? 1 : 1 + (seed % 3)

      for (let s = 0; s < count; s++) {
        const tmpl = sessionTemplates[(seed + s * 3) % sessionTemplates.length]
        const mins = Math.max(25, tmpl.minutes + ((seed + s * 7) % 30) - 10)
        sessions.push({
          id: `${date}-sess-${s}`,
          title: tmpl.title,
          minutes: mins,
          startedAt: tmpl.startedAt,
        })
      }
    }

    return {
      date,
      sessions,
    }
  })
}

const flaggedTerms = [
  { term: 'seamless', count: 34, change: 8 },
  { term: 'eco-friendly', count: 28, change: 4 },
  { term: 'game-changing', count: 19, change: -2 },
  { term: 'utilize', count: 14, change: 1 },
  { term: 'carbon neutral', count: 11, change: 5 },
  { term: 'leverage', count: 9, change: -3 },
]

function extractFlaggedTerms(submissions = [], isDemo = false) {
  if (isDemo && (!submissions || submissions.length === 0)) {
    return flaggedTerms
  }
  if (!submissions || submissions.length === 0) {
    return []
  }

  const counts = new Map()
  submissions.forEach((sub) => {
    (sub.reports || []).forEach((report) => {
      (report.issues || []).forEach((issue) => {
        if (issue.category === 'terminology') {
          const match = (issue.evidence || issue.title || '').match(/["']([^"']+)["']/)
          const term = (match ? match[1] : issue.title || 'term').toLowerCase().trim()
          counts.set(term, (counts.get(term) || 0) + 1)
        }
      })
    })
  })

  if (counts.size === 0) {
    return isDemo ? flaggedTerms : []
  }

  return Array.from(counts.entries())
    .map(([term, count]) => ({
      term,
      count,
      change: count > 3 ? 1 : -1,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

const team = [
  { name: 'Kruthik Kamegaonkar', role: 'Admin', reviewed: 32, score: 92, hours: '2.4h', approval: 96 },
  { name: 'Ashwik Saxena', role: 'Reviewer', reviewed: 64, score: 89, hours: '4.2h', approval: 94 },
  { name: 'Maya Iyer', role: 'Reviewer', reviewed: 58, score: 87, hours: '3.8h', approval: 92 },
  { name: 'Maddi Abhinav', role: 'Reviewer', reviewed: 46, score: 86, hours: '5.1h', approval: 89 },
]

const heatValues = [
  1, 2, 3, 2, 4, 3, 2, 2, 4, 4, 3, 1, 3, 4, 4, 3, 2, 4, 3, 1, 2, 3, 4, 4, 3, 2, 1, 3, 4, 4, 2, 1, 3, 4, 3,
  2, 2, 3, 4, 3, 1, 2,
]

const toneFor = (change) => (change > 0 ? 'warn' : 'good')

export function Insights() {
  const { data, user, toast } = useApp()
  const isDemo = Boolean(user?.is_demo || ['ashwik', 'sunless'].includes(user?.username))
  const [period, setPeriod] = useState('30d')
  const days = period === '7d' ? 7 : period === '14d' ? 14 : 30
  const chartData = data.trends.slice(-days)
  const reviewDays = useMemo(() => buildReviewDays(data.submissions, isDemo), [data.submissions, isDemo])
  const activeFlaggedTerms = useMemo(() => extractFlaggedTerms(data.submissions, isDemo), [data.submissions, isDemo])
  const activeTeam = useMemo(() => {
    const map = new Map()
    ;(data.submissions || []).forEach((sub) => {
      const reviewer = sub.reviewed_by || sub.reports?.[0]?.actions?.[0]?.performed_by
      if (!reviewer) return
      if (!map.has(reviewer)) {
        map.set(reviewer, { name: reviewer, role: 'Reviewer', reviewed: 0, totalScore: 0, scoredCount: 0, approved: 0 })
      }
      const rec = map.get(reviewer)
      rec.reviewed += 1
      if (sub.status === 'approved') rec.approved += 1
      const score = sub.reports?.[0]?.overall_score
      if (typeof score === 'number') {
        rec.totalScore += score
        rec.scoredCount += 1
      }
    })
    if (map.size === 0) {
      return isDemo && (data.submissions || []).length > 0 ? team : []
    }
    return Array.from(map.values()).map((r) => ({
      name: r.name,
      role: r.role,
      reviewed: r.reviewed,
      score: r.scoredCount > 0 ? Math.round(r.totalScore / r.scoredCount) : 0,
      hours: '—',
      approval: r.reviewed > 0 ? Math.round((r.approved / r.reviewed) * 100) : 0,
    }))
  }, [data.submissions, isDemo])

  const busiestDayInfo = useMemo(() => {
    if (!data.submissions || data.submissions.length === 0) return null
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    data.submissions.forEach((sub) => {
      if (!sub.submitted_at) return
      const d = new Date(sub.submitted_at)
      if (!isNaN(d.getTime())) {
        dayCounts[d.getUTCDay()] += 1
      }
    })
    const maxVal = Math.max(...dayCounts)
    if (maxVal === 0) return null
    const busiestDayIndex = dayCounts.indexOf(maxVal)
    return dayNames[busiestDayIndex]
  }, [data.submissions])

  const categories = useMemo(() => {
    const totals = data.issue_breakdown.reduce((result, item) => {
      if (!result[item.category]) result[item.category] = { total: 0, critical: 0, warning: 0, suggestion: 0 }
      result[item.category].total += item.count
      result[item.category][item.severity] += item.count
      return result
    }, {})
    return Object.entries(totals)
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.total - a.total)
  }, [data.issue_breakdown])

  const guidelineGap = useMemo(() => {
    if (!data.coverage || data.coverage.length === 0) return null
    const withIssues = data.coverage.filter((c) => c.issues > 0)
    if (withIssues.length === 0) return null
    const sorted = [...withIssues].sort(
      (a, b) => (b.issues / (b.guidelines || 0.5)) - (a.issues / (a.guidelines || 0.5))
    )
    const gap = sorted[0]
    const catIssues = categories.find((c) => c.category === gap.category)
    return {
      category: gap.category,
      label: categoryLabels[gap.category] || gap.category,
      issues: gap.issues,
      guidelines: gap.guidelines,
      blocking: catIssues?.critical || 0,
    }
  }, [data.coverage, categories])

  const totalIssues = categories.reduce((sum, item) => sum + item.total, 0)
  const maxTerm = activeFlaggedTerms.length > 0 ? Math.max(...activeFlaggedTerms.map((item) => item.count)) : 1
  const termListRef = useRef(null)
  const mixPanelRef = useRef(null)

  useEffect(() => {
    const cancel1 = animateHorizontalBars(termListRef.current)
    const cancel2 = animateHorizontalBars(mixPanelRef.current)
    return () => {
      cancel1?.()
      cancel2?.()
    }
  }, [])

  const weeks = useMemo(() => {
    const result = []
    for (let index = 0; index < 5; index += 1) {
      const slice = data.trends.slice(index * 6, index * 6 + 6)
      result.push({
        label: `W${42 + index}`,
        value: slice.reduce((sum, point) => sum + point.submissions, 0),
      })
    }
    return result
  }, [data.trends])

  const exportReport = () => {
    const rows = [
      ['Klarity governance report'],
      ['Generated', new Date().toISOString()],
      [],
      ['Metric', 'Value'],
      ['Content reviewed', data.stats.total_submissions],
      ['Approval rate', `${data.stats.approval_rate}%`],
      ['Average score', data.stats.avg_score],
      ['Open issues', data.stats.open_issues],
      [],
      ['Issue category', 'Count'],
      ...categories.map((item) => [categoryLabels[item.category] || item.category, item.total]),
      [],
      ['Flagged term', 'Count'],
      ...activeFlaggedTerms.map((item) => [item.term, item.count]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'klarity-governance-report.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    toast('Governance report exported as CSV.')
  }

  return (
    <div className="insights-page">
      <section className="page-head">
        <div>
          <h1>Insights</h1>
          <p>The Patterns behind the scores. What keeps slipping, who is moving fastest, and where the rules need work.</p>
        </div>
        <div className="page-head__actions">
          {data.stats.total_submissions > 0 && typeof data.stats.score_delta === 'number' && (
            <span className="insight-stat">
              {data.stats.score_delta >= 0 ? <TrendingUp size={15} /> : <ArrowDownRight size={15} />}
              {data.stats.score_delta > 0
                ? `Quality up ${data.stats.score_delta.toFixed(1)} pts this month`
                : data.stats.score_delta < 0
                  ? `Quality down ${Math.abs(data.stats.score_delta).toFixed(1)} pts this month`
                  : `Quality steady this month`}
            </span>
          )}
          <button type="button" className="btn btn--secondary btn--md" onClick={exportReport}>
            <Download size={15} /> <span>Export Report</span>
          </button>
        </div>
      </section>

      <section className="insights-hero">
        <Panel className="insight-chart-panel">
          <SectionHead
            title={data.stats.total_submissions > 0 ? "The trend is quietly good" : "Average review quality"}
            description={data.stats.total_submissions > 0 ? "Average review score across every published piece." : "Review scores will track here once content submissions are evaluated."}
            action={
              <Segmented
                label="Insight period"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: '7d', label: '7d' },
                  { value: '14d', label: '14d' },
                  { value: '30d', label: '30d' },
                ]}
              />
            }
          />
          <div className="insight-chart-score">
            <AnimatedValue value={data.stats.avg_score.toFixed(1)} suffix="/100" />
            {data.stats.total_submissions > 0 && (
              <em>
                {data.stats.score_delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {data.stats.score_delta > 0
                  ? `+${data.stats.score_delta.toFixed(1)} pts`
                  : data.stats.score_delta < 0
                    ? `${data.stats.score_delta.toFixed(1)} pts`
                    : `0.0 pts`}
              </em>
            )}
          </div>
          <PulseChart data={chartData} height={222} minScore={80} maxScore={94} target={85} />
        </Panel>

        <Panel className="term-panel">
          <SectionHead
            title="The words doing damage"
            description="Most flagged terms across the last 90 days."
            action={<Flame size={18} className="term-panel__flame" />}
          />
          {activeFlaggedTerms.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
              <p className="empty-state__title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                No words flagged
              </p>
              <p className="empty-state__desc" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                Zero terminology violations recorded. As content is audited, repeatedly flagged words will appear here.
              </p>
            </div>
          ) : (
            <ul className="term-list" ref={termListRef}>
              {activeFlaggedTerms.map((item, index) => (
                <li key={item.term}>
                  <span className="term-list__rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="term-list__word">{item.term}</span>
                  <span className="term-list__track">
                    <span className="term-list__bar" style={{ width: `${(item.count / maxTerm) * 100}%` }} />
                  </span>
                  <AnimatedValue value={item.count} duration={600} />
                  <span className={cx('term-list__change', `is-${toneFor(item.change)}`)}>
                    {item.change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(item.change)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link className="term-panel__link" to="/guidelines?guideline=2">
            <BookOpen size={14} /> Open the terminology guideline <ArrowUpRight size={13} />
          </Link>
        </Panel>
      </section>

      <section className="insights-row">
        <Panel className="mix-panel" ref={mixPanelRef}>
          <SectionHead
            title="Where the issues live"
            description={`${formatCount(totalIssues)} findings across ${categories.length} categories.`}
          />
          <div className="mix-list">
            {categories.map((item) => (
              <div key={item.category} className="mix-row">
                <div className="mix-row__head">
                  <CategoryTag category={item.category} />
                  <AnimatedValue value={item.total} duration={600} />
                </div>
                <div className="mix-row__bar" role="img" aria-label={`${categoryLabels[item.category]}: ${item.total} issues`}>
                  {item.critical > 0 ? (
                    <span
                      className="mix-row__segment mix-row__segment--critical"
                      style={{ width: `${(item.critical / item.total) * 100}%` }}
                    />
                  ) : null}
                  {item.warning > 0 ? (
                    <span
                      className="mix-row__segment mix-row__segment--warning"
                      style={{ width: `${(item.warning / item.total) * 100}%` }}
                    />
                  ) : null}
                  {item.suggestion > 0 ? (
                    <span
                      className="mix-row__segment mix-row__segment--suggestion"
                      style={{ width: `${(item.suggestion / item.total) * 100}%` }}
                    />
                  ) : null}
                </div>
                <div className="mix-row__legend">
                  {item.critical ? <span><i className="dot-critical" />{item.critical} blocking</span> : null}
                  {item.warning ? <span><i className="dot-warning" />{item.warning} warnings</span> : null}
                  {item.suggestion ? <span><i className="dot-suggestion" />{item.suggestion} notes</span> : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="volume-panel">
          <SectionHead
            title="Review volume"
            description="Pieces submitted each week, last five weeks."
            action={<span className="volume-panel__total">{formatCount(data.stats.reviews_this_week)} this week</span>}
          />
          <VolumeBars data={weeks} height={230} />
          <p className="volume-panel__note">
            {data.stats.total_submissions > 0 ? (
              <>
                <Sparkles size={14} />{' '}
                {data.stats.volume_delta > 0
                  ? `Volume is up ${data.stats.volume_delta.toFixed(1)}% over the prior month.`
                  : data.stats.volume_delta < 0
                    ? `Volume is down ${Math.abs(data.stats.volume_delta).toFixed(1)}% over the prior month.`
                    : `Volume is consistent with the prior month.`}{' '}
                Review turnaround held steady.
              </>
            ) : (
              <>
                <Sparkles size={14} /> No weekly submission volume recorded yet.
              </>
            )}
          </p>
        </Panel>
      </section>

      <section className="insights-row insights-row--lower">
        <Panel className="heat-panel heat-panel--focus-city">
          <FocusCity
            days={reviewDays}
            title="When reviews happen"
            description="Interactive 3D skyline & calendar heatmap. Drag to orbit."
            defaultView="city"
            totalReviews={data.stats.total_submissions}
            totalContent={data.stats.total_submissions}
          />
          <div className="heat-panel__note">
            <span>
              {busiestDayInfo ? (
                <><strong>{busiestDayInfo}</strong> is the busiest review day for this workspace.</>
              ) : (
                <>No review activity recorded yet for this workspace.</>
              )}
            </span>
            <Link to="/reviews">Open the queue <ArrowUpRight size={13} /></Link>
          </div>
        </Panel>

        <Panel className="team-panel">
          <SectionHead
            title="Reviewer performance"
            description="Throughput and quality by reviewer, last 30 days."
            action={<span className="live-tag"><span /> Live</span>}
          />
          {activeTeam.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
              <p className="empty-state__title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                No reviewer activity yet
              </p>
              <p className="empty-state__desc" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                Reviewer throughput and turnaround times will calculate once content submissions are evaluated.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table--team">
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Reviewed</th>
                    <th>Avg. score</th>
                    <th>Turnaround</th>
                    <th>Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTeam.map((member) => (
                    <tr key={member.name}>
                      <td>
                        <span className="team-cell">
                          <Avatar name={member.name} size="sm" />
                          <span>
                            <strong>{member.name.split(' ')[0]}</strong>
                            <small>{member.role}</small>
                          </span>
                        </span>
                      </td>
                      <td>{member.reviewed}</td>
                      <td>
                        <span className={cx('score-text', member.score >= 85 ? 'is-good' : 'is-warn')}>
                          {member.score}
                        </span>
                      </td>
                      <td>{member.hours}</td>
                      <td>{member.approval}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>

      {guidelineGap && (
        <section className="gap-callout">
          <div className="gap-callout__blob" aria-hidden="true" />
          <div className="gap-callout__copy">
            <span className="gap-callout__tag">
              <BookOpen size={13} /> Guideline gap
            </span>
            <h2>The {guidelineGap.label.toLowerCase()} library is carrying the highest issue load.</h2>
            <p>
              {guidelineGap.label} accounts for <strong>{guidelineGap.issues} {guidelineGap.issues === 1 ? 'issue' : 'issues'}</strong> across{' '}
              <strong>{guidelineGap.guidelines} {guidelineGap.guidelines === 1 ? 'guideline' : 'guidelines'}</strong>. Adding worked examples
              gives creators clear reference patterns to reduce recurring violations.
            </p>
            <Link to="/guidelines" className="btn btn--light btn--md">
              Review the guideline library <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="gap-callout__stats">
            <div>
              <strong>{guidelineGap.issues}</strong>
              <span>{guidelineGap.label.toLowerCase()} issues</span>
            </div>
            <div>
              <strong>{guidelineGap.guidelines}</strong>
              <span>guidelines</span>
            </div>
            <div>
              <strong>{guidelineGap.blocking}</strong>
              <span>blocking</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
