import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button, Drawer, Panel, ScorePill, Select, StatusPill, Tabs } from '../components/UI'
import { cx, latestReport } from '../lib/utils'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MILESTONES_STORAGE_KEY = 'klarity_calendar_milestones.v1'

const DEFAULT_MILESTONES = [
  {
    id: 'camp-offsite',
    title: 'Team offsite',
    startDate: '2026-11-30',
    endDate: '2026-12-02',
    tone: 'good',
    detail: 'Quarterly brand governance and editorial planning offsite.',
    isMilestone: true,
  },
]

function getTodayLocal() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(dateStr) {
  if (!dateStr) return getTodayLocal()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function addMonthsClamped(date, deltaMonths) {
  const targetMonthIndex = date.getMonth() + deltaMonths
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12
  const maxDay = new Date(targetYear, normalizedMonth + 1, 0).getDate()
  return new Date(targetYear, normalizedMonth, Math.min(date.getDate(), maxDay))
}

function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayIndex = (d.getDay() + 6) % 7 // Mon=0 ... Sun=6
  d.setDate(d.getDate() - dayIndex)
  return d
}

function getISOWeekNumber(date) {
  const temp = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayNum = (temp.getDay() + 6) % 7
  temp.setDate(temp.getDate() - dayNum + 3)
  const firstThursday = new Date(temp.getFullYear(), 0, 4)
  const diff = temp - firstThursday
  return 1 + Math.round(diff / (7 * 86400000))
}

function formatReadableDate(dateStr, includeYear = false) {
  if (!dateStr) return '—'
  const date = parseLocalDate(dateStr)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date)
}

function formatShortRangeDate(date) {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

function formatEventTime(timeStr) {
  if (!timeStr) return 'All day'
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  const ampm = h >= 12 ? 'pm' : 'am'
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

function loadMilestones() {
  try {
    const raw = localStorage.getItem(MILESTONES_STORAGE_KEY)
    if (!raw) return DEFAULT_MILESTONES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_MILESTONES
  } catch {
    return DEFAULT_MILESTONES
  }
}

export function Calendar({ onNewReview }) {
  const { data, toast } = useApp()
  const navigate = useNavigate()

  const today = useMemo(() => getTodayLocal(), [])
  const todayStr = useMemo(() => toDateStr(today), [today])

  // Single source of truth for active calendar date
  const [anchorDate, setAnchorDate] = useState(() => getTodayLocal())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'day' | 'agenda'
  const [agendaScope, setAgendaScope] = useState('month') // 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDayStr, setSelectedDayStr] = useState(null) // Opens day schedule drawer

  // Mini calendar date-picker popover state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [miniMonthDate, setMiniMonthDate] = useState(() => getTodayLocal())
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!pickerOpen) return
    const handlePointerDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [pickerOpen])

  // Custom calendar milestones persisted in localStorage
  const [milestones, setMilestones] = useState(loadMilestones)
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    startDate: todayStr,
    endDate: todayStr,
    tone: 'sage',
    detail: '',
  })

  useEffect(() => {
    try {
      localStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(milestones))
    } catch {
      // ignore storage errors
    }
  }, [milestones])

  const currentYear = anchorDate.getFullYear()
  const currentMonth = anchorDate.getMonth()
  const currentDay = anchorDate.getDate()
  const anchorDateStr = toDateStr(anchorDate)
  const isAnchorToday = anchorDateStr === todayStr
  const isoWeekNumber = getISOWeekNumber(anchorDate)

  // Extract review events cleanly (one canonical activity entry per submission)
  const allReviewEvents = useMemo(() => {
    if (!data?.submissions) return []
    const events = []

    data.submissions.forEach((sub) => {
      const report = latestReport(sub)
      const score = report?.overall_score ?? null

      const timestamp = sub.reviewed_at || sub.submitted_at
      if (!timestamp) return

      const dateStr = timestamp.slice(0, 10)
      const timeStr = timestamp.slice(11, 16)
      const [hh = 0, mm = 0] = timeStr.split(':').map(Number)
      const baseDate = parseLocalDate(dateStr)
      baseDate.setHours(hh, mm, 0, 0)

      let tone = 'neutral'
      if (sub.status === 'approved') tone = 'good'
      else if (sub.status === 'reviewing') tone = 'sage'
      else if (sub.status === 'needs_changes') tone = 'warn'
      else if (sub.status === 'rejected') tone = 'bad'

      events.push({
        id: `ev-${sub.id}`,
        submissionId: sub.id,
        status: sub.status,
        tone,
        title: sub.title,
        author: sub.submitted_by,
        date: dateStr,
        time: timeStr,
        rawDate: baseDate,
        contentType: sub.content_type || 'text',
        contentText: sub.content_text,
        score,
        report,
        detail: sub.reviewer_notes || report?.summary || `Review by ${sub.submitted_by}`,
        isMilestone: false,
      })
    })

    return events
  }, [data?.submissions])

  // Dynamic status tabs counts
  const statusTabs = useMemo(() => {
    const counts = { all: allReviewEvents.length }
    allReviewEvents.forEach((ev) => {
      counts[ev.status] = (counts[ev.status] || 0) + 1
    })

    return [
      { value: 'all', label: 'All', count: counts.all },
      { value: 'reviewing', label: 'In review', count: counts.reviewing || 0 },
      { value: 'needs_changes', label: 'Changes', count: counts.needs_changes || 0 },
      { value: 'approved', label: 'Approved', count: counts.approved || 0 },
      { value: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
    ]
  }, [allReviewEvents])

  // Filter review events by search & status
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allReviewEvents.filter((ev) => {
      if (statusFilter !== 'all' && ev.status !== statusFilter) return false
      if (q) {
        const matchTitle = ev.title.toLowerCase().includes(q)
        const matchAuthor = (ev.author || '').toLowerCase().includes(q)
        const matchDetail = (ev.detail || '').toLowerCase().includes(q)
        if (!matchTitle && !matchAuthor && !matchDetail) return false
      }
      return true
    })
  }, [allReviewEvents, statusFilter, searchQuery])

  // Filter milestones by search (shown when statusFilter is 'all')
  const filteredMilestones = useMemo(() => {
    if (statusFilter !== 'all') return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return milestones
    return milestones.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.detail || '').toLowerCase().includes(q)
    )
  }, [milestones, statusFilter, searchQuery])

  // Index review events by "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map()
    filteredEvents.forEach((ev) => {
      const list = map.get(ev.date) || []
      list.push(ev)
      map.set(ev.date, list)
    })
    map.forEach((list) => list.sort((a, b) => a.rawDate - b.rawDate))
    return map
  }, [filteredEvents])

  const getMilestonesForDate = useCallback(
    (dateStr) => filteredMilestones.filter((c) => dateStr >= c.startDate && dateStr <= c.endDate),
    [filteredMilestones]
  )

  const buildDayCell = useCallback(
    (date, referenceMonth) => {
      const dateStr = toDateStr(date)
      return {
        date,
        dayNumber: date.getDate(),
        dateStr,
        isCurrentMonth: date.getMonth() === referenceMonth,
        isToday: dateStr === todayStr,
        isSelected: dateStr === anchorDateStr,
        events: eventsByDate.get(dateStr) || [],
        campaigns: getMilestonesForDate(dateStr),
      }
    },
    [todayStr, anchorDateStr, eventsByDate, getMilestonesForDate]
  )

  // Month Grid Calculation (Monday to Sunday, safe local dates — zero UTC drift)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const startDayIndex = (firstDay.getDay() + 6) % 7 // Mon=0 ... Sun=6

    const days = []

    // 1. Preceding month days
    for (let i = startDayIndex; i > 0; i--) {
      const d = new Date(currentYear, currentMonth, 1 - i)
      days.push(buildDayCell(d, currentMonth))
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum)
      days.push(buildDayCell(d, currentMonth))
    }

    // 3. Trailing next month days to complete 35 or 42 grid cells
    const totalCells = days.length <= 35 ? 35 : 42
    const remaining = totalCells - days.length
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(currentYear, currentMonth + 1, dayNum)
      days.push(buildDayCell(d, currentMonth))
    }

    return days
  }, [currentYear, currentMonth, buildDayCell])

  // Real Week View Days (Mon-Sun containing anchorDate)
  const weekDays = useMemo(() => {
    const start = getWeekStart(anchorDate)
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i)
      return buildDayCell(d, currentMonth)
    })
  }, [anchorDate, currentMonth, buildDayCell])

  // Active Day Cell (for Day view & Day drawer)
  const activeDayCell = useMemo(
    () => buildDayCell(anchorDate, currentMonth),
    [anchorDate, currentMonth, buildDayCell]
  )

  const selectedDayCell = useMemo(
    () => (selectedDayStr ? buildDayCell(parseLocalDate(selectedDayStr), currentMonth) : null),
    [selectedDayStr, currentMonth, buildDayCell]
  )

  // Agenda items (reviews + milestones), scoped to month or all dates
  const agendaItems = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
    const milestoneEvents = filteredMilestones.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.startDate,
      endDate: m.endDate,
      time: '',
      rawDate: parseLocalDate(m.startDate),
      tone: m.tone,
      status: 'milestone',
      author: 'Workspace milestone',
      contentType: m.endDate && m.endDate !== m.startDate
        ? `${formatReadableDate(m.startDate)} – ${formatReadableDate(m.endDate)}`
        : 'Milestone',
      score: null,
      detail: m.detail || 'Scheduled brand milestone.',
      isMilestone: true,
    }))

    const combined = [...filteredEvents, ...milestoneEvents]
    const scoped =
      agendaScope === 'month'
        ? combined.filter((ev) => {
            if (ev.date.startsWith(monthPrefix)) return true
            if (ev.endDate && ev.endDate.startsWith(monthPrefix)) return true
            return false
          })
        : combined

    return [...scoped].sort((a, b) => b.rawDate - a.rawDate)
  }, [filteredEvents, filteredMilestones, agendaScope, currentYear, currentMonth])

  // Navigation handlers — step day-by-day cleanly across week/month/year boundaries
  const handlePrev = useCallback(() => {
    setAnchorDate((prev) => addDays(prev, -1))
  }, [])

  const handleNext = useCallback(() => {
    setAnchorDate((prev) => addDays(prev, 1))
  }, [])

  const handleToday = useCallback(() => {
    const now = getTodayLocal()
    setAnchorDate(now)
    setMiniMonthDate(now)
    setPickerOpen(false)
  }, [])

  const toggleDatePicker = useCallback(() => {
    setPickerOpen((open) => {
      if (!open) {
        setMiniMonthDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1))
      }
      return !open
    })
  }, [anchorDate])

  const handleMiniSelectDate = useCallback((dateStr) => {
    const picked = parseLocalDate(dateStr)
    setAnchorDate(picked)
    setMiniMonthDate(picked)
    setPickerOpen(false)
  }, [])

  // Mini Calendar Grid (Mon-Sun) for the date-picker popover
  const miniCalendarDays = useMemo(() => {
    const y = miniMonthDate.getFullYear()
    const m = miniMonthDate.getMonth()
    const firstDay = new Date(y, m, 1)
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const startDayIndex = (firstDay.getDay() + 6) % 7
    const cells = []

    const pushMiniCell = (d) => {
      const dateStr = toDateStr(d)
      const hasEvents = (eventsByDate.get(dateStr)?.length || 0) > 0
      const hasCampaign = getMilestonesForDate(dateStr).length > 0
      cells.push({
        dayNumber: d.getDate(),
        dateStr,
        isCurrentMonth: d.getMonth() === m,
        isToday: dateStr === todayStr,
        isSelected: dateStr === anchorDateStr,
        hasActivity: hasEvents || hasCampaign,
      })
    }

    for (let i = startDayIndex; i > 0; i--) {
      pushMiniCell(new Date(y, m, 1 - i))
    }
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      pushMiniCell(new Date(y, m, dayNum))
    }
    const totalCells = cells.length <= 35 ? 35 : 42
    const remaining = totalCells - cells.length
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      pushMiniCell(new Date(y, m + 1, dayNum))
    }
    return cells
  }, [miniMonthDate, todayStr, anchorDateStr, eventsByDate, getMilestonesForDate])

  // Keyboard navigation: Left/Right arrows & 'T' for Today
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.metaKey || e.ctrlKey || e.altKey) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault()
        handleToday()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlePrev, handleNext, handleToday])

  // Header range subtitle based on current view
  const headerRangeSubtitle = useMemo(() => {
    if (viewMode === 'week') {
      const start = weekDays[0]?.date || anchorDate
      const end = weekDays[6]?.date || anchorDate
      return `${formatShortRangeDate(start)} – ${formatShortRangeDate(end)}`
    }
    if (viewMode === 'day') {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(anchorDate)
    }
    if (viewMode === 'agenda') {
      return agendaScope === 'month'
        ? `${MONTH_NAMES[currentMonth]} ${currentYear} · ${agendaItems.length} ${agendaItems.length === 1 ? 'item' : 'items'}`
        : `All scheduled dates · ${agendaItems.length} ${agendaItems.length === 1 ? 'item' : 'items'}`
    }
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    return `1 ${MONTH_SHORT[currentMonth]} ${currentYear} – ${lastDay.getDate()} ${MONTH_SHORT[currentMonth]} ${currentYear}`
  }, [viewMode, weekDays, anchorDate, agendaScope, currentMonth, currentYear, agendaItems.length])

  const navPrevLabel = 'Previous day'
  const navNextLabel = 'Next day'

  const openScheduleForDate = (dateStr) => {
    setNewMilestone({
      title: '',
      startDate: dateStr,
      endDate: dateStr,
      tone: 'sage',
      detail: '',
    })
    setScheduleDrawerOpen(true)
  }

  const handleSaveMilestone = (e) => {
    e.preventDefault()
    const trimmed = newMilestone.title.trim()
    if (!trimmed) return
    const start = newMilestone.startDate || anchorDateStr
    const end = newMilestone.endDate && newMilestone.endDate >= start ? newMilestone.endDate : start
    const item = {
      id: `ms-${Date.now()}`,
      title: trimmed,
      startDate: start,
      endDate: end,
      tone: newMilestone.tone || 'sage',
      detail: newMilestone.detail.trim() || 'Scheduled brand governance milestone.',
      isMilestone: true,
    }
    setMilestones((prev) => [...prev, item])
    setAnchorDate(parseLocalDate(start))
    setScheduleDrawerOpen(false)
    toast?.(`Scheduled "${trimmed}" on ${formatReadableDate(start)}.`, 'good')
  }

  const handleDeleteMilestone = (id) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    setSelectedEvent(null)
    toast?.('Milestone removed from calendar.', 'good')
  }

  const openMilestoneDetail = (camp) => {
    setSelectedEvent({
      id: camp.id,
      title: camp.title,
      date: camp.startDate,
      endDate: camp.endDate,
      time: '',
      tone: camp.tone,
      status: 'milestone',
      author: 'Workspace milestone',
      detail: camp.detail || 'Scheduled brand governance milestone.',
      score: null,
      isMilestone: true,
    })
  }

  return (
    <div className="calendar-page">
      <Panel className="calendar-card">
        <header className="calendar-head">
          {/* Left: Dynamic Date Badge + Title + Real ISO Week indicator */}
          <div className="calendar-head__left">
            <button
              type="button"
              className="calendar-badge"
              onClick={handleToday}
              title={isAnchorToday ? 'Viewing today' : 'Click to jump back to today'}
            >
              <div className="calendar-badge__top">
                <span className="calendar-badge__month">{MONTH_SHORT[currentMonth]}</span>
              </div>
              <div className="calendar-badge__bottom">
                <span className="calendar-badge__day">{currentDay}</span>
              </div>
            </button>
            <div className="calendar-title-group">
              <div className="calendar-title-row">
                <h1>{MONTH_NAMES[currentMonth]} {currentYear}</h1>
                <span className="calendar-week-tag">Week {isoWeekNumber}</span>
              </div>
              <p className="calendar-range-sub">{headerRangeSubtitle}</p>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="calendar-head__right">
            {/* Search Filter */}
            <label className="calendar-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search events or submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search calendar"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="calendar-search__clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </label>

            {/* Day Navigation Group + Mini Calendar Date Picker Popover */}
            <div className="calendar-picker-anchor" ref={pickerRef}>
              <div className="calendar-nav-group">
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={handlePrev}
                  aria-label={navPrevLabel}
                  title="Previous day (←)"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className={cx(
                    'calendar-today-btn',
                    isAnchorToday && 'is-active',
                    pickerOpen && 'is-open'
                  )}
                  onClick={toggleDatePicker}
                  aria-expanded={pickerOpen}
                  aria-haspopup="dialog"
                  title="Open mini calendar to pick a date"
                >
                  <span>{isAnchorToday ? 'Today' : formatReadableDate(anchorDateStr)}</span>
                  <ChevronDown size={13} className={cx('calendar-today-chevron', pickerOpen && 'is-rotated')} />
                </button>
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={handleNext}
                  aria-label={navNextLabel}
                  title="Next day (→)"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {pickerOpen && (
                <div className="calendar-mini-popover" role="dialog" aria-label="Choose a date">
                  <div className="calendar-mini-head">
                    <button
                      type="button"
                      className="calendar-mini-nav"
                      onClick={() => setMiniMonthDate((d) => addMonthsClamped(d, -1))}
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="calendar-mini-title">
                      {MONTH_NAMES[miniMonthDate.getMonth()]} {miniMonthDate.getFullYear()}
                    </span>
                    <button
                      type="button"
                      className="calendar-mini-nav"
                      onClick={() => setMiniMonthDate((d) => addMonthsClamped(d, 1))}
                      aria-label="Next month"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="calendar-mini-weekdays">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((wd) => (
                      <span key={wd}>{wd}</span>
                    ))}
                  </div>

                  <div className="calendar-mini-grid">
                    {miniCalendarDays.map((cell) => (
                      <button
                        key={cell.dateStr}
                        type="button"
                        className={cx(
                          'calendar-mini-day',
                          !cell.isCurrentMonth && 'is-outside',
                          cell.isToday && 'is-today',
                          cell.isSelected && 'is-selected'
                        )}
                        onClick={() => handleMiniSelectDate(cell.dateStr)}
                      >
                        <span>{cell.dayNumber}</span>
                        {cell.hasActivity && <i className="calendar-mini-dot" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>

                  <div className="calendar-mini-foot">
                    <button
                      type="button"
                      className="calendar-mini-today-btn"
                      onClick={handleToday}
                    >
                      Jump to Today ({formatReadableDate(todayStr)})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Switcher */}
            <Select
              className="calendar-view-select"
              value={viewMode}
              onChange={setViewMode}
              ariaLabel="Select calendar view"
              options={[
                { value: 'month', label: 'Month view' },
                { value: 'week', label: 'Week view' },
                { value: 'day', label: 'Day view' },
                { value: 'agenda', label: 'Agenda view' },
              ]}
            />

            {/* Secondary Schedule Action */}
            <Button
              icon={Flag}
              variant="outline"
              onClick={() => openScheduleForDate(anchorDateStr)}
              className="calendar-milestone-btn"
            >
              Add milestone
            </Button>

            {/* Primary Action Button */}
            <Button
              icon={Plus}
              variant="primary"
              onClick={onNewReview}
              className="calendar-add-btn"
            >
              New review
            </Button>
          </div>
        </header>

        {/* Activity Filter Tabs with GSAP Sliding Pill */}
        <div className="calendar-filters-bar">
          <Tabs
            label="Filter activities"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusTabs}
          />
          <div className="calendar-filters-legend">
            <span className="legend-dot legend-dot--sage" /> In Review
            <span className="legend-dot legend-dot--good" /> Approved
            <span className="legend-dot legend-dot--warn" /> Changes Needed
            <span className="legend-dot legend-dot--neutral" /> Submitted
          </div>
        </div>

        {/* ---------------- Month View ---------------- */}
        {viewMode === 'month' && (
          <div className="calendar-grid-wrap">
            <div className="calendar-weekdays-row">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="calendar-weekday-cell">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-month-grid">
              {calendarDays.map((cell) => {
                const visibleEvents = cell.events.slice(0, 2)
                const overflowCount = cell.events.length - 2

                return (
                  <div
                    key={cell.dateStr}
                    className={cx(
                      'calendar-day-cell',
                      !cell.isCurrentMonth && 'is-outside-month',
                      cell.isToday && 'is-today',
                      cell.isSelected && 'is-selected'
                    )}
                    onClick={() => setAnchorDate(parseLocalDate(cell.dateStr))}
                    onDoubleClick={() => setSelectedDayStr(cell.dateStr)}
                  >
                    {/* Day Cell Header */}
                    <div className="calendar-day-top">
                      <button
                        type="button"
                        className={cx(
                          'calendar-day-number',
                          cell.isToday && 'calendar-day-number--today',
                          cell.isSelected && !cell.isToday && 'calendar-day-number--selected'
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          setAnchorDate(parseLocalDate(cell.dateStr))
                          setSelectedDayStr(cell.dateStr)
                        }}
                        title={`View schedule for ${formatReadableDate(cell.dateStr, true)}`}
                      >
                        {cell.dayNumber}
                      </button>

                      <button
                        type="button"
                        className="calendar-day-add-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setAnchorDate(parseLocalDate(cell.dateStr))
                          openScheduleForDate(cell.dateStr)
                        }}
                        aria-label={`Schedule milestone on ${cell.dateStr}`}
                        title={`Add milestone on ${formatReadableDate(cell.dateStr)}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Multi-Day & Scheduled Milestones */}
                    {cell.campaigns.map((camp) => (
                      <button
                        key={camp.id}
                        type="button"
                        className={cx('calendar-banner-pill', `calendar-banner-pill--${camp.tone}`)}
                        title={`${camp.title} (${formatReadableDate(camp.startDate)}${camp.endDate !== camp.startDate ? ` – ${formatReadableDate(camp.endDate)}` : ''})`}
                        onClick={(e) => {
                          e.stopPropagation()
                          openMilestoneDetail(camp)
                        }}
                      >
                        <span className="calendar-banner-text">{camp.title}</span>
                      </button>
                    ))}

                    {/* Event Pills List (Max 2 visible) */}
                    <div className="calendar-events-stack">
                      {visibleEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          className={cx('calendar-event-pill', `calendar-event-pill--${ev.tone}`)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnchorDate(parseLocalDate(cell.dateStr))
                            setSelectedEvent(ev)
                          }}
                          title={`${ev.title} (${ev.detail})`}
                        >
                          <span className="calendar-event-pill__title">{ev.title}</span>
                          <span className="calendar-event-pill__time">
                            {formatEventTime(ev.time)}
                          </span>
                        </button>
                      ))}

                      {overflowCount > 0 && (
                        <button
                          type="button"
                          className="calendar-overflow-link"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnchorDate(parseLocalDate(cell.dateStr))
                            setSelectedDayStr(cell.dateStr)
                          }}
                        >
                          +{overflowCount} more...
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- Week View ---------------- */}
        {viewMode === 'week' && (
          <div className="calendar-week-view">
            <div className="calendar-week-grid">
              {weekDays.map((day) => {
                const weekdayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day.date)
                const hasItems = day.events.length > 0 || day.campaigns.length > 0

                return (
                  <div
                    key={day.dateStr}
                    className={cx(
                      'calendar-week-col',
                      day.isToday && 'is-today',
                      day.isSelected && 'is-selected'
                    )}
                    onClick={() => setAnchorDate(parseLocalDate(day.dateStr))}
                  >
                    <div className="calendar-week-col__head">
                      <span className="calendar-week-col__name">{weekdayName}</span>
                      <div className="calendar-week-col__head-right">
                        <span className={cx('calendar-week-col__num', day.isToday && 'is-today')}>
                          {day.dayNumber}
                        </span>
                        <button
                          type="button"
                          className="calendar-day-add-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAnchorDate(parseLocalDate(day.dateStr))
                            openScheduleForDate(day.dateStr)
                          }}
                          aria-label={`Add milestone on ${day.dateStr}`}
                          title={`Add milestone on ${formatReadableDate(day.dateStr)}`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="calendar-week-col__body">
                      {day.campaigns.map((camp) => (
                        <button
                          key={camp.id}
                          type="button"
                          className={cx('calendar-banner-pill', `calendar-banner-pill--${camp.tone}`)}
                          onClick={(e) => {
                            e.stopPropagation()
                            openMilestoneDetail(camp)
                          }}
                        >
                          <span className="calendar-banner-text">{camp.title}</span>
                        </button>
                      ))}

                      {!hasItems ? (
                        <div className="calendar-col-empty">No activity</div>
                      ) : (
                        day.events.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            className={cx(
                              'calendar-week-card',
                              `calendar-week-card--${ev.tone}`
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAnchorDate(parseLocalDate(day.dateStr))
                              setSelectedEvent(ev)
                            }}
                          >
                            <div className="calendar-week-card__top">
                              <span className="calendar-week-card__time">{formatEventTime(ev.time)}</span>
                              {ev.score !== null && <ScorePill score={ev.score} size="sm" />}
                            </div>
                            <strong>{ev.title}</strong>
                            <small>{ev.author}</small>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- Day View ---------------- */}
        {viewMode === 'day' && (
          <div className="calendar-day-view">
            <div className="calendar-day-view__head">
              <div>
                <h3>
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  }).format(anchorDate)}
                </h3>
                <p>
                  {activeDayCell.events.length + activeDayCell.campaigns.length}{' '}
                  {activeDayCell.events.length + activeDayCell.campaigns.length === 1 ? 'item' : 'items'} scheduled
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => openScheduleForDate(anchorDateStr)}
              >
                Schedule on this day
              </Button>
            </div>

            {activeDayCell.campaigns.length > 0 && (
              <div className="calendar-day-view__milestones">
                {activeDayCell.campaigns.map((camp) => (
                  <button
                    key={camp.id}
                    type="button"
                    className={cx('calendar-banner-pill', `calendar-banner-pill--${camp.tone}`)}
                    onClick={() => openMilestoneDetail(camp)}
                  >
                    <Flag size={11} style={{ marginRight: 6, flexShrink: 0 }} />
                    <span className="calendar-banner-text">
                      {camp.title} ({formatReadableDate(camp.startDate)}
                      {camp.endDate !== camp.startDate ? ` – ${formatReadableDate(camp.endDate)}` : ''})
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeDayCell.events.length === 0 && activeDayCell.campaigns.length === 0 ? (
              <div className="calendar-agenda-empty">
                <p>No reviews or milestones logged for {formatReadableDate(anchorDateStr, true)}.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                  <Button variant="outline" size="sm" icon={Flag} onClick={() => openScheduleForDate(anchorDateStr)}>
                    Add milestone
                  </Button>
                  <Button variant="primary" size="sm" icon={Plus} onClick={onNewReview}>
                    New review
                  </Button>
                </div>
              </div>
            ) : (
              <div className="calendar-agenda-list">
                {activeDayCell.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="calendar-agenda-row"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div className="calendar-agenda-date">
                      <strong>{formatEventTime(ev.time)}</strong>
                      <small>{ev.contentType.toUpperCase()}</small>
                    </div>
                    <div className="calendar-agenda-main">
                      <div className="calendar-agenda-title-row">
                        <h4>{ev.title}</h4>
                        <StatusPill status={ev.status} />
                      </div>
                      <p>{ev.detail}</p>
                      <span className="calendar-agenda-meta">
                        <User size={13} /> {ev.author}
                      </span>
                    </div>
                    <div className="calendar-agenda-right">
                      {ev.score !== null && <ScorePill score={ev.score} size="md" />}
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/reviews/${ev.submissionId}`)
                        }}
                      >
                        View <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- Agenda View ---------------- */}
        {viewMode === 'agenda' && (
          <div className="calendar-agenda-view">
            <div className="calendar-agenda-bar">
              <span className="calendar-agenda-bar__label">
                {agendaScope === 'month'
                  ? `Showing ${MONTH_NAMES[currentMonth]} ${currentYear}`
                  : 'Showing all dates'}
              </span>
              <div className="calendar-agenda-scope">
                <button
                  type="button"
                  className={cx('calendar-scope-btn', agendaScope === 'month' && 'is-active')}
                  onClick={() => setAgendaScope('month')}
                >
                  This month
                </button>
                <button
                  type="button"
                  className={cx('calendar-scope-btn', agendaScope === 'all' && 'is-active')}
                  onClick={() => setAgendaScope('all')}
                >
                  All dates
                </button>
              </div>
            </div>

            {agendaItems.length === 0 ? (
              <div className="calendar-agenda-empty">
                <p>
                  No activity found in {agendaScope === 'month' ? `${MONTH_NAMES[currentMonth]} ${currentYear}` : 'the workspace'} matching your filters.
                </p>
                {agendaScope === 'month' && (
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ marginTop: 10 }}
                    onClick={() => setAgendaScope('all')}
                  >
                    Show all dates
                  </Button>
                )}
              </div>
            ) : (
              <div className="calendar-agenda-list">
                {agendaItems.map((ev) => (
                  <div
                    key={ev.id}
                    className="calendar-agenda-row"
                    onClick={() => {
                      setAnchorDate(parseLocalDate(ev.date))
                      setSelectedEvent(ev)
                    }}
                  >
                    <div className="calendar-agenda-date">
                      <strong>{formatReadableDate(ev.date)}</strong>
                      <small>{formatEventTime(ev.time)}</small>
                    </div>
                    <div className="calendar-agenda-main">
                      <div className="calendar-agenda-title-row">
                        <h4>{ev.title}</h4>
                        {ev.isMilestone ? (
                          <span className={cx('pill', `pill--${ev.tone === 'sage' ? 'info' : ev.tone}`)}>
                            Milestone
                          </span>
                        ) : (
                          <StatusPill status={ev.status} />
                        )}
                      </div>
                      <p>{ev.detail}</p>
                      <span className="calendar-agenda-meta">
                        {ev.isMilestone ? <Flag size={13} /> : <User size={13} />} {ev.author} • {String(ev.contentType).toUpperCase()}
                      </span>
                    </div>
                    <div className="calendar-agenda-right">
                      {ev.score !== null && <ScorePill score={ev.score} size="md" />}
                      {!ev.isMilestone && (
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/reviews/${ev.submissionId}`)
                          }}
                        >
                          View <ArrowUpRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Single Event / Milestone Detail Drawer */}
      <Drawer
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || 'Event detail'}
        description={
          selectedEvent?.isMilestone
            ? `Scheduled ${formatReadableDate(selectedEvent.date, true)}${
                selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date
                  ? ` – ${formatReadableDate(selectedEvent.endDate, true)}`
                  : ''
              }`
            : `Activity logged on ${selectedEvent?.date ? formatReadableDate(selectedEvent.date, true) : ''} at ${formatEventTime(selectedEvent?.time)}`
        }
        width="560px"
      >
        {selectedEvent && (
          <div className="calendar-detail-drawer">
            <div className="calendar-detail-header-card panel">
              <div className="calendar-detail-tags">
                {selectedEvent.isMilestone ? (
                  <span className={cx('pill', `pill--${selectedEvent.tone === 'sage' ? 'info' : selectedEvent.tone}`)}>
                    Calendar Milestone
                  </span>
                ) : (
                  <StatusPill status={selectedEvent.status} />
                )}
                {selectedEvent.score !== null && (
                  <ScorePill score={selectedEvent.score} size="md" />
                )}
              </div>
              <h3>{selectedEvent.title}</h3>
              <p className="calendar-detail-author">
                {selectedEvent.isMilestone ? <Flag size={14} /> : <User size={14} />}
                {selectedEvent.isMilestone ? (
                  <span>{selectedEvent.author}</span>
                ) : (
                  <span>
                    Submitted by <strong>{selectedEvent.author}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="calendar-detail-section">
              <h4>{selectedEvent.isMilestone ? 'Milestone notes' : 'Review status & summary'}</h4>
              <p className="calendar-detail-notes">{selectedEvent.detail}</p>
            </div>

            {selectedEvent.contentText && (
              <div className="calendar-detail-section">
                <h4>Submission excerpt</h4>
                <div className="calendar-detail-excerpt">{selectedEvent.contentText}</div>
              </div>
            )}

            <div className="calendar-detail-actions">
              {selectedEvent.isMilestone ? (
                <Button
                  variant="outline"
                  icon={Trash2}
                  onClick={() => handleDeleteMilestone(selectedEvent.id)}
                >
                  Remove milestone
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={ArrowUpRight}
                  onClick={() => {
                    const id = selectedEvent.submissionId
                    setSelectedEvent(null)
                    navigate(`/reviews/${id}`)
                  }}
                >
                  Open in Review Studio
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Day Schedule Drawer (click day number / double-click cell / overflow) */}
      <Drawer
        open={Boolean(selectedDayCell)}
        onClose={() => setSelectedDayStr(null)}
        title={selectedDayCell ? formatReadableDate(selectedDayCell.dateStr, true) : 'Day schedule'}
        description={`${
          (selectedDayCell?.events?.length || 0) + (selectedDayCell?.campaigns?.length || 0)
        } scheduled brand governance items`}
        width="520px"
      >
        {selectedDayCell && (
          <div className="calendar-day-overflow-list">
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <Button
                variant="outline"
                size="sm"
                icon={Flag}
                onClick={() => {
                  const target = selectedDayCell.dateStr
                  setSelectedDayStr(null)
                  openScheduleForDate(target)
                }}
              >
                Add milestone
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setSelectedDayStr(null)
                  onNewReview?.()
                }}
              >
                New review
              </Button>
            </div>

            {selectedDayCell.campaigns.map((camp) => (
              <div
                key={camp.id}
                className="calendar-overflow-item panel"
                onClick={() => {
                  setSelectedDayStr(null)
                  openMilestoneDetail(camp)
                }}
              >
                <div className="calendar-overflow-item__head">
                  <span className="calendar-overflow-time">All day · Milestone</span>
                  <span className={cx('pill', `pill--${camp.tone === 'sage' ? 'info' : camp.tone}`)}>
                    Milestone
                  </span>
                </div>
                <strong>{camp.title}</strong>
                <p>{camp.detail}</p>
              </div>
            ))}

            {selectedDayCell.events.map((ev) => (
              <div
                key={ev.id}
                className="calendar-overflow-item panel"
                onClick={() => {
                  setSelectedDayStr(null)
                  setSelectedEvent(ev)
                }}
              >
                <div className="calendar-overflow-item__head">
                  <span className="calendar-overflow-time">{formatEventTime(ev.time)}</span>
                  <StatusPill status={ev.status} />
                </div>
                <strong>{ev.title}</strong>
                <p>{ev.detail}</p>
                <small>By {ev.author}</small>
              </div>
            ))}

            {selectedDayCell.events.length === 0 && selectedDayCell.campaigns.length === 0 && (
              <div className="calendar-agenda-empty">
                <p>No reviews or milestones logged for this date.</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add Milestone Drawer */}
      <Drawer
        open={scheduleDrawerOpen}
        onClose={() => setScheduleDrawerOpen(false)}
        title="Schedule calendar milestone"
        description="Add a campaign launch, editorial deadline, or brand governance milestone."
        width="480px"
      >
        <form className="calendar-milestone-form" onSubmit={handleSaveMilestone}>
          <div className="calendar-form-field">
            <label htmlFor="ms-title">Title</label>
            <input
              id="ms-title"
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Winter Campaign Launch"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone((m) => ({ ...m, title: e.target.value }))}
            />
          </div>

          <div className="calendar-form-row">
            <div className="calendar-form-field">
              <label htmlFor="ms-start">Start date</label>
              <input
                id="ms-start"
                type="date"
                required
                value={newMilestone.startDate}
                onChange={(e) =>
                  setNewMilestone((m) => ({
                    ...m,
                    startDate: e.target.value,
                    endDate: m.endDate < e.target.value ? e.target.value : m.endDate,
                  }))
                }
              />
            </div>

            <div className="calendar-form-field">
              <label htmlFor="ms-end">End date</label>
              <input
                id="ms-end"
                type="date"
                min={newMilestone.startDate}
                value={newMilestone.endDate}
                onChange={(e) => setNewMilestone((m) => ({ ...m, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="calendar-form-field">
            <label htmlFor="ms-tone">Category color</label>
            <select
              id="ms-tone"
              value={newMilestone.tone}
              onChange={(e) => setNewMilestone((m) => ({ ...m, tone: e.target.value }))}
            >
              <option value="sage">Review / Launch (Blue)</option>
              <option value="good">Campaign / Offsite (Green)</option>
              <option value="warn">Deadline / Audit (Amber)</option>
            </select>
          </div>

          <div className="calendar-form-field">
            <label htmlFor="ms-detail">Notes</label>
            <textarea
              id="ms-detail"
              rows={3}
              maxLength={400}
              placeholder="Optional context, owners, or deliverable links..."
              value={newMilestone.detail}
              onChange={(e) => setNewMilestone((m) => ({ ...m, detail: e.target.value }))}
            />
          </div>

          <div className="calendar-detail-actions">
            <Button type="submit" variant="primary" icon={CalendarIcon}>
              Save milestone
            </Button>
            <Button type="button" variant="outline" onClick={() => setScheduleDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}

export default Calendar
