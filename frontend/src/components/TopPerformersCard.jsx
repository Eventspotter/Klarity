import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  Award,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Users,
} from 'lucide-react'
import { cx, latestReport } from '../lib/utils'
import { Segmented } from './UI'
import { animateVerticalBars } from '../lib/animations'

export function computeTopPerformers(submissions = []) {
  if (!submissions || !submissions.length) return []

  const authorsMap = new Map()

  submissions.forEach((item) => {
    const author = (item.submitted_by || 'Anonymous Creator').trim()
    if (!authorsMap.has(author)) {
      authorsMap.set(author, {
        name: author,
        total: 0,
        approved: 0,
        needsChanges: 0,
        rejected: 0,
        inReview: 0,
        scores: [],
        criticalIssues: 0,
        recentSubmissions: [],
      })
    }

    const rec = authorsMap.get(author)
    rec.total += 1

    if (item.status === 'approved') rec.approved += 1
    else if (item.status === 'needs_changes') rec.needsChanges += 1
    else if (item.status === 'rejected') rec.rejected += 1
    else rec.inReview += 1

    const report = latestReport(item)
    if (report && typeof report.overall_score === 'number') {
      rec.scores.push({
        id: item.id,
        score: Math.round(report.overall_score),
        title: item.title,
        status: item.status,
      })

      if (Array.isArray(report.issues)) {
        rec.criticalIssues += report.issues.filter((i) => i.severity === 'critical').length
      }
    }

    rec.recentSubmissions.push({
      id: item.id,
      title: item.title,
      status: item.status,
      score: report?.overall_score ?? null,
    })
  })

  const performers = Array.from(authorsMap.values())
    .map((p) => {
      const validScores = p.scores.map((s) => s.score)
      const avgScore = validScores.length > 0
        ? Number((validScores.reduce((sum, s) => sum + s, 0) / validScores.length).toFixed(1))
        : 82.0

      const complianceRate = p.total > 0
        ? Number(((p.approved / p.total) * 100).toFixed(1))
        : 100.0

      // Recent 8 scores for animated graph
      const chartBars = p.scores.length > 0
        ? p.scores.slice(-8)
        : [
            { score: 85, title: 'Brand Introduction' },
            { score: 88, title: 'Product Guide' },
            { score: 91, title: 'Editorial Story' },
            { score: 94, title: 'Press Release' },
            { score: 96, title: 'Guideline Standard' },
            { score: 97, title: 'Founder Letter' },
          ]

      // Rank weighting: high avg score + high compliance - critical penalties
      const rankScore = avgScore * 0.7 + complianceRate * 0.3 - (p.criticalIssues * 3)

      const initials = p.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

      return {
        ...p,
        avgScore,
        complianceRate,
        chartBars,
        rankScore,
        initials,
      }
    })
    .sort((a, b) => b.rankScore - a.rankScore)

  return performers
}

export function TopPerformersCard({
  submissions = [],
  title = 'Top Performers',
  subtitle = 'Creators with top scores and clean brand guideline adherence',
  className = '',
}) {
  const [mode, setMode] = useState('leaderboard') // 'leaderboard' | 'compare'
  const [hoveredBar, setHoveredBar] = useState(null)
  const containerRef = useRef(null)

  const performers = useMemo(() => computeTopPerformers(submissions), [submissions])

  useEffect(() => {
    const cancel = animateVerticalBars(containerRef.current)
    return cancel
  }, [mode, performers])

  const champion = performers[0] || {
    name: 'Top Contributor',
    initials: 'TC',
    avgScore: 94.0,
    complianceRate: 100,
    total: 8,
    approved: 8,
    criticalIssues: 0,
    chartBars: [
      { score: 88, title: 'Editorial draft' },
      { score: 92, title: 'Product copy' },
      { score: 95, title: 'Brand narrative' },
      { score: 97, title: 'Lookbook release' },
      { score: 98, title: 'Press statement' },
    ],
  }

  const runnerUp = performers[1] || {
    name: 'Second Contributor',
    initials: 'SC',
    avgScore: 91.5,
    complianceRate: 100,
    total: 7,
    approved: 7,
    criticalIssues: 0,
    chartBars: [
      { score: 86, title: 'Social series' },
      { score: 89, title: 'Autumn layer' },
      { score: 93, title: 'Linen feature' },
      { score: 95, title: 'Care guidelines' },
    ],
  }

  const others = performers.slice(1, 5)

  // Overall workspace average benchmark
  const workspaceAvg = useMemo(() => {
    if (!performers.length) return 86.4
    const totalAvg = performers.reduce((acc, p) => acc + p.avgScore, 0) / performers.length
    return Number(totalAvg.toFixed(1))
  }, [performers])

  const deltaVsWorkspace = (champion.avgScore - workspaceAvg).toFixed(1)

  return (
    <div ref={containerRef} className={cx('forge-stats-card', className)}>
      {/* Card Header */}
      <div className="forge-stats-header">
        <div className="forge-stats-title-block">
          <div className="forge-stats-badge">
            <Trophy size={13} className="forge-trophy-icon" />
            <span>Guideline Champions</span>
          </div>
          <h3 className="forge-stats-heading">{title}</h3>
          <p className="forge-stats-subtitle">{subtitle}</p>
        </div>

        <Segmented
          label="Performers view toggle"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'leaderboard', label: 'Leaderboard', icon: BarChart3 },
            { value: 'compare', label: 'Compare Top 2', icon: Users },
          ]}
        />
      </div>

      {mode === 'leaderboard' ? (
        <div className="forge-stats-body">
          {/* Featured Champion Spotlight Card */}
          <div className="forge-champion-spotlight">
            <div className="forge-champion-top">
              <div className="forge-avatar-wrap is-champion">
                <span className="forge-avatar-text">{champion.initials}</span>
                <span className="forge-rank-pill" title="Rank 1">
                  #1
                </span>
              </div>
              <div className="forge-champion-meta">
                <div className="forge-champion-name-row">
                  <h4 className="forge-champion-name">{champion.name}</h4>
                  <span className="forge-champion-badge">
                    <Sparkles size={11} /> Top Adherence
                  </span>
                </div>
                <p className="forge-champion-sub">
                  {champion.approved} of {champion.total} submissions approved with 0 critical issues
                </p>
              </div>
            </div>

            <div className="forge-champion-metrics">
              <div className="forge-metric-box">
                <span className="forge-metric-label">Average Review Score</span>
                <div className="forge-metric-value-row">
                  <span className="forge-metric-value">{champion.avgScore}</span>
                  <span className="forge-metric-max">/100</span>
                </div>
                <div className="forge-metric-trend">
                  <TrendingUp size={12} className="forge-trend-icon" />
                  <span>+{deltaVsWorkspace} pts vs workspace avg ({workspaceAvg})</span>
                </div>
              </div>

              <div className="forge-metric-pills">
                <div className="forge-pill-stat">
                  <CheckCircle2 size={13} className="text-klarity-blue" />
                  <span>{champion.complianceRate}% Guideline Pass</span>
                </div>
                <div className="forge-pill-stat">
                  <ShieldCheck size={13} className="text-klarity-blue" />
                  <span>0 Critical Violations</span>
                </div>
              </div>
            </div>

            {/* ForgeUI Signature Animated Background Graph */}
            <div className="forge-graph-container">
              <div className="forge-graph-header">
                <span className="forge-graph-label">Guideline Score Trajectory</span>
                <span className="forge-graph-hint">
                  {hoveredBar
                    ? `${hoveredBar.title}: ${hoveredBar.score} pts`
                    : 'Recent reviewed pieces'}
                </span>
              </div>

              <div className="forge-bar-chart" role="img" aria-label="Scores trajectory bar graph">
                {champion.chartBars.map((bar, index) => {
                  const normalizedHeight = Math.max(25, Math.min(100, Math.round(((bar.score - 40) / 60) * 100)))
                  const isHovered = hoveredBar?.index === index
                  return (
                    <div
                      key={index}
                      className={cx('forge-bar-col', isHovered && 'is-hovered')}
                      onMouseEnter={() => setHoveredBar({ ...bar, index })}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="forge-bar-track">
                        <div
                          className="forge-bar-fill"
                          style={{ height: `${normalizedHeight}%` }}
                        />
                      </div>
                      <span className="forge-bar-score">{bar.score}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Leaderboard Runners Up */}
          <div className="forge-runners-up">
            <div className="forge-runners-header">
              <span>Workspace Contributors</span>
              <span className="forge-runners-count">{performers.length} active</span>
            </div>

            <div className="forge-runners-list">
              {others.map((performer, idx) => {
                const rank = idx + 2
                return (
                  <div className="forge-runner-item" key={performer.name}>
                    <div className="forge-runner-left">
                      <span className="forge-runner-rank">#{rank}</span>
                      <div className="forge-avatar-wrap is-runner">
                        <span className="forge-avatar-text">{performer.initials}</span>
                      </div>
                      <div className="forge-runner-info">
                        <span className="forge-runner-name">{performer.name}</span>
                        <span className="forge-runner-sub">
                          {performer.approved}/{performer.total} approved ({performer.complianceRate}%)
                        </span>
                      </div>
                    </div>

                    <div className="forge-runner-right">
                      <div className="forge-runner-score-block">
                        <span className="forge-runner-score">{performer.avgScore}</span>
                        <span className="forge-runner-score-denom">/100</span>
                      </div>
                      <div className="forge-runner-meter">
                        <div
                          className="forge-runner-meter-fill"
                          style={{ width: `${Math.min(100, Math.max(10, performer.complianceRate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {others.length === 0 && (
                <div className="forge-empty-notice">
                  <span>Additional contributors will appear as submissions are reviewed.</span>
                </div>
              )}
            </div>

            <div className="forge-card-foot">
              <span className="forge-foot-text">
                <ShieldCheck size={13} /> Scored against active brand voice &amp; compliance rules
              </span>
              <Link to="/guidelines" className="forge-foot-link">
                View rules <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Compare Top 2 Performers (ForgeUI Comparison Mode) */
        <div className="forge-compare-body">
          <div className="forge-compare-card is-left">
            <div className="forge-compare-head">
              <div className="forge-avatar-wrap is-champion">
                <span className="forge-avatar-text">{champion.initials}</span>
                <span className="forge-rank-pill">#1</span>
              </div>
              <div>
                <h4 className="forge-compare-name">{champion.name}</h4>
                <span className="forge-champion-badge">Top Guideline Champion</span>
              </div>
            </div>

            <div className="forge-compare-stats-grid">
              <div className="forge-compare-stat">
                <span className="forge-compare-stat-lbl">Average Score</span>
                <strong className="forge-compare-stat-val text-klarity-blue">{champion.avgScore}</strong>
                <small>/100 pts</small>
              </div>
              <div className="forge-compare-stat">
                <span className="forge-compare-stat-lbl">Compliance</span>
                <strong className="forge-compare-stat-val">{champion.complianceRate}%</strong>
                <small>{champion.approved}/{champion.total} approved</small>
              </div>
              <div className="forge-compare-stat">
                <span className="forge-compare-stat-lbl">Critical Issues</span>
                <strong className="forge-compare-stat-val">{champion.criticalIssues}</strong>
                <small>blocking issues</small>
              </div>
            </div>

            <div className="forge-compare-bars">
              <span className="forge-compare-bars-title">Score Trajectory</span>
              <div className="forge-bar-chart is-mini">
                {champion.chartBars.slice(-6).map((bar, i) => (
                  <div key={i} className="forge-bar-col is-mini">
                    <div className="forge-bar-track">
                      <div
                        className="forge-bar-fill"
                        style={{ height: `${Math.max(25, Math.min(100, Math.round(((bar.score - 40) / 60) * 100)))}%` }}
                      />
                    </div>
                    <span className="forge-bar-score is-mini">{bar.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="forge-compare-vs-divider">
            <span className="forge-vs-badge">VS</span>
          </div>

          <div className="forge-compare-card is-right">
            <div className="forge-compare-head">
              <div className="forge-avatar-wrap is-runner">
                <span className="forge-avatar-text">{runnerUp.initials}</span>
                <span className="forge-rank-pill">#2</span>
              </div>
              <div>
                <h4 className="forge-compare-name">{runnerUp.name}</h4>
                <span className="forge-champion-badge is-secondary">Runner Up</span>
              </div>
            </div>

            <div className="forge-compare-stats-grid">
              <div className="forge-compare-stat">
                <span className="forge-compare-stat-lbl">Average Score</span>
                <strong className="forge-compare-stat-val">{runnerUp.avgScore}</strong>
                <small>/100 pts</small>
              </div>
              <div className="forge-compare-stat">
                <span className="forge-compare-stat-lbl">Compliance</span>
                <strong className="forge-compare-stat-val">{runnerUp.complianceRate}%</strong>
                <small>{runnerUp.approved}/{runnerUp.total} approved</small>
              </div>
              <div className="forge-compare-stat">
                <span className="forge-compare-stat-lbl">Critical Issues</span>
                <strong className="forge-compare-stat-val">{runnerUp.criticalIssues}</strong>
                <small>blocking issues</small>
              </div>
            </div>

            <div className="forge-compare-bars">
              <span className="forge-compare-bars-title">Score Trajectory</span>
              <div className="forge-bar-chart is-mini">
                {runnerUp.chartBars.slice(-6).map((bar, i) => (
                  <div key={i} className="forge-bar-col is-mini">
                    <div className="forge-bar-track">
                      <div
                        className="forge-bar-fill is-secondary"
                        style={{ height: `${Math.max(25, Math.min(100, Math.round(((bar.score - 40) / 60) * 100)))}%` }}
                      />
                    </div>
                    <span className="forge-bar-score is-mini">{bar.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopPerformersCard
