// Adapted from Wren by LN (MIT). Original: ln-dev7/landing-pages/landing-pages/wren.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, MotionConfig } from 'motion/react'
import { ArrowRight, BookOpenText, Check, CheckCircle2, CircleHelp, FileText, Images, LineChart, Menu, Moon, Play, ShieldCheck, Sparkles, Sun, Users, X } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { useApp } from '../context/AppContext'
import { Contours, Typed, useReveal } from '../components/landing/HeroEffects'
import { SlidingGroup, spring, useActiveSection } from '../components/landing/LandingPrimitives'
import { CreatorStudioDemo, KnowledgeDemo, ReviewDeskDemo, UseCasesDemo } from '../components/landing/LandingDemos'
import { faqs } from '../components/landing/landingData'
import './hero.css'

const links = [
  { href: '#proof-desk', label: 'Creator studio' },
  { href: '#review-desk', label: 'Review desk' },
  { href: '#guidelines', label: 'Guidelines' },
  { href: '#workflow', label: 'Workflows' },
  { href: '#faq', label: 'Questions' },
]
const sections = links.map(link => link.href.slice(1))
const lift = { whileHover: { y: -4 }, transition: spring }

function SectionHead({ eyebrow, children, description }) {
  return <div className="landing-section-head" data-reveal><span className="eyebrow mono">{eyebrow}</span><h2>{children}</h2>{description && <p>{description}</p>}</div>
}

export function Hero() {
  const { user, theme, toggleTheme } = useApp()
  const getPath = route => user ? route : `/login?redirect=${encodeURIComponent(route)}`
  const { active, select } = useActiveSection(sections)
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const [openQuestion, setOpenQuestion] = useState(null)
  const menuButton = useRef(null)
  const menuPanel = useRef(null)
  useReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menu) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuPanel.current?.querySelector('a, button')?.focus()
    const handleKey = e => {
      if (e.key === 'Escape') { setMenu(false); menuButton.current?.focus() }
      if (e.key === 'Tab') {
        const items = menuPanel.current?.querySelectorAll('a, button')
        if (!items?.length) return
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', handleKey) }
  }, [menu])

  const closeMenu = () => { setMenu(false); menuButton.current?.focus() }

  return <MotionConfig reducedMotion="user"><div className="klarity-landing">
    <a className="skip" href="#landing-main">Skip to content</a>
    <header className="nav" data-scrolled={scrolled}>
      <div className="nav-inner">
        <a href="#top" className="brand" aria-label="Klarity home"><BrandMark size={29} /><span>Klarity</span></a>
        <SlidingGroup as="nav" className="nav-links" active={active} aria-label="Main navigation">
          {links.map(link => { const id = link.href.slice(1); return <a key={id} href={link.href} data-selected={active === id} aria-current={active === id ? 'location' : undefined} onClick={() => select(id)}><span>{link.label}</span></a> })}
        </SlidingGroup>
        <div className="nav-actions">
          <button type="button" className="landing-theme" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
          <Link to={getPath('/')} className="button nav-workspace">Open workspace <ArrowRight size={14} /></Link>
          <button ref={menuButton} type="button" className="menu-button" aria-label="Open navigation" aria-expanded={menu} aria-controls="landing-menu" onClick={() => setMenu(true)}><Menu size={19} /></button>
        </div>
      </div>
    </header>

    {menu && <div className="landing-menu-backdrop" onClick={closeMenu}>
      <div className="landing-menu" id="landing-menu" ref={menuPanel} role="dialog" aria-modal="true" aria-labelledby="landing-menu-title" onClick={e => e.stopPropagation()}>
        <div className="landing-menu-head"><span className="brand" id="landing-menu-title"><BrandMark size={28} />Klarity</span><button type="button" className="landing-theme" aria-label="Close navigation" onClick={closeMenu}><X size={20} /></button></div>
        <p>Every piece of content. One clear identity.</p>
        <nav aria-label="Mobile navigation" className="sheet-links">{links.map(link => <a key={link.href} href={link.href} aria-current={active === link.href.slice(1) ? 'location' : undefined} onClick={() => { select(link.href.slice(1)); closeMenu() }}>{link.label}<ArrowRight size={15} /></a>)}</nav>
        <Link className="button" to={getPath('/')} onClick={closeMenu}>Open workspace <ArrowRight size={14} /></Link>
        {!user && <Link className="text-button" to="/login" onClick={closeMenu}>Sign in</Link>}
      </div>
    </div>}

    <main id="landing-main">
      <section className="hero" id="top">
        <div className="frame" aria-hidden="true"><span className="corner tl" /><span className="corner tr" /></div>
        <div className="hero-stage">
          <Contours />
          <div className="hero-hints" aria-hidden="true">
            <span className="hh hh-1 rise" style={{ animationDelay: '1.2s' }}><Check size={13} /> Voice guide, checked.</span>
            <span className="hh hh-2 rise" style={{ animationDelay: '1.35s' }}><CircleHelp size={13} /> Can we back up this claim?</span>
            <span className="hh hh-3 rise" style={{ animationDelay: '1.5s' }}><Sparkles size={13} /> Your voice. A little clearer.</span>
          </div>
          <div className="hero-copy hero-think">
            <h1 aria-label="Keep every word on-brand, accurate, consistent, and yours.">
              <span className="rise" style={{ animationDelay: '.2s' }} aria-hidden="true">Keep every word</span>
              <span className="rise typed-line" style={{ animationDelay: '.35s' }} aria-hidden="true"><Typed /></span>
            </h1>
            <p className="rise" style={{ animationDelay: '.55s' }}>Your brand has a voice. Keep it clear. Klarity checks content against your guidelines, facts, and visual standards—with the reason behind every suggestion.</p>
            <div className="hero-ctas rise" style={{ animationDelay: '.7s' }}>
              <Link className="button button-lg" to={getPath('/')}>Open Klarity <span className="cta-note">Your brand workspace</span><ArrowRight size={16} /></Link>
              <a className="button button-outline button-lg" href="#proof-desk" onClick={() => select('proof-desk')}><Play size={14} /> See it in action</a>
            </div>
          </div>
        </div>
        <div className="hero-app" id="proof-desk">
          <CreatorStudioDemo getPath={getPath} />
          <p className="hint mono">AUTHENTIC PRODUCT SPECIMEN · Real pre-flight inspection and compliance index from the Klarity Creator Studio.</p>
        </div>
      </section>

      <section className="teams" aria-label="Brand checks">
        <p>One clear standard, from the first draft to the final decision.</p>
        <div className="brand-checks">{[{ icon: BookOpenText, label: 'Voice & tone' }, { icon: ShieldCheck, label: 'Facts & claims' }, { icon: FileText, label: 'Terminology' }, { icon: Images, label: 'Visual identity' }, { icon: Users, label: 'Human approval' }].map(({ icon: Icon, label }) => <span key={label}><Icon size={18} />{label}</span>)}</div>
      </section>

      <section className="section" id="review-desk">
        <SectionHead eyebrow="LINE-BY-LINE REVIEW" description="Once submitted, reviewers inspect every flagged phrase with guideline citations, severity ratings, and 1-click recommendations.">Shows its work, <em>every single line.</em></SectionHead>
        <ReviewDeskDemo getPath={getPath} />
      </section>

      <section className="section" id="guidelines">
        <SectionHead eyebrow="YOUR SOURCE OF TRUTH" description="Bring guidelines, approved facts, terminology, and visual standards into one place. Every review starts with the rules your team agreed on.">Good feedback starts with <em>shared knowledge.</em></SectionHead>
        <KnowledgeDemo />
        <p className="fine">Explore living guidelines to see how brand voice, substantiation, and lexicon rules inform live pre-flight checks.</p>
      </section>

      <section className="section" id="workflow">
        <SectionHead eyebrow="FROM DRAFT TO DECISION" description="See what was flagged, which guideline it relates to, and how to fix it. Then let the right person make the call.">Complete audit trails, <em>human decisions.</em></SectionHead>
        <UseCasesDemo />
      </section>

      <section className="section" id="product">
        <SectionHead eyebrow="ONE CONNECTED WORKSPACE" description="Guidance, content, assets, and approvals belong together. Give the whole team a shared view of what good looks like.">Less back-and-forth. <em>More Klarity.</em></SectionHead>
        <div className="bento">
          <motion.article className="tile tile-wide" data-reveal {...lift}>
            <div className="tile-visual longdoc" aria-hidden="true"><div className="pages">{Array.from({ length: 7 }, (_, i) => <motion.i key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.05 * i }} />)}</div><span><BookOpenText size={14} /> Voice guide · Naming · Approved claims</span></div>
            <h3>Guidelines that stay close to the work</h3><p>A shared reference for tone, terminology, facts, and visual rules. Bring it into the review, where it matters.</p><Link to={getPath('/guidelines')} className="tile-link">Explore guidelines <ArrowRight size={13} /></Link>
          </motion.article>
          <motion.article className="tile tile-wide" data-reveal {...lift}>
            <div className="tile-visual analysis" aria-hidden="true"><svg viewBox="0 0 300 110" preserveAspectRatio="none"><motion.path d="M0,90 C40,80 60,40 100,48 S160,85 200,52 S260,18 300,24" fill="none" stroke="var(--accent)" strokeWidth="2.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: 'easeOut' }} vectorEffect="non-scaling-stroke" /><path d="M0,96 C50,94 90,78 140,82 S230,62 300,58" fill="none" stroke="var(--faint)" strokeDasharray="4 4" strokeWidth="1.5" /></svg><span className="an-note"><LineChart size={13} /> Spot the patterns behind repeat issues</span></div>
            <h3>Learn from every review</h3><p>Follow brand health, review activity, and recurring issues. Use those patterns to make your next brief clearer.</p><Link to={getPath('/insights')} className="tile-link">Explore insights <ArrowRight size={13} /></Link>
          </motion.article>
          <motion.article className="tile" data-reveal {...lift}>
            <div className="tile-visual memory" aria-hidden="true">{['Tone mismatch', 'Unverified claim', 'Suggested correction'].map((label, i) => <span key={label}><CheckCircle2 size={13} />{label}<small>{['Warning', 'Critical', 'Review'][i]}</small></span>)}</div>
            <h3>A reason for every flag</h3><p>Read the severity, explanation, guideline, and suggested fix together.</p>
          </motion.article>
          <motion.article className="tile" data-reveal {...lift}>
            <div className="tile-visual asset-visual" aria-hidden="true"><BrandMark size={48} /><div>{['var(--sage)', 'var(--brown-surface)', 'var(--cream-deep)', 'var(--clay)'].map(color => <i key={color} style={{ background: color }} />)}</div><span className="mono">ONE APPROVED IDENTITY</span></div>
            <h3>The right assets, within reach</h3><p>Keep approved logos, palettes, and typography in the same workspace.</p>
          </motion.article>
          <motion.article className="tile" data-reveal {...lift}>
            <div className="tile-visual honest" aria-hidden="true"><ShieldCheck size={21} /><strong>“Ready for your review.”</strong><span>Approve · Request changes · Reject</span></div>
            <h3>Your team has the final say</h3><p>Keep review decisions, comments, and submission history together.</p>
          </motion.article>
        </div>
      </section>

      <section className="section trust"><div className="trust-grid">
        {[{ icon: BookOpenText, title: 'Evidence before opinion', body: 'Connect feedback to a specific guideline or approved source.' }, { icon: Sparkles, title: 'Keep the creator’s intent', body: 'Fix the issue without rewriting the idea out of the work.' }, { icon: Users, title: 'Human judgement, always', body: 'Suggestions support reviewers. The publishing decision stays with people.' }].map(({ icon: Icon, title, body }) => <div className="trust-item" key={title} data-reveal><span className="trust-icon"><Icon size={18} /></span><h3>{title}</h3><p>{body}</p></div>)}
      </div></section>

      <section className="section split" id="faq"><SectionHead eyebrow="A FEW THINGS TO KNOW">Clear answers. <em>Of course.</em></SectionHead>
        <div className="faq" data-reveal>{faqs.map((faq, i) => { const open = openQuestion === i; return <div className="ui-accordion-item" key={faq.q}><h3 className="ui-accordion-header"><button type="button" id={`faq-question-${i}`} className="ui-accordion-trigger" aria-expanded={open} aria-controls={`faq-answer-${i}`} data-panel-open={open || undefined} onClick={() => setOpenQuestion(open ? null : i)}>{faq.q}<span className="ui-accordion-icon" aria-hidden="true" /></button></h3><div id={`faq-answer-${i}`} role="region" aria-labelledby={`faq-question-${i}`} hidden={!open}><div className="ui-accordion-content">{faq.a}</div></div></div> })}</div>
      </section>

      <section className="closing" data-reveal><span className="closing-mark" aria-hidden="true"><BrandMark size={44} /></span><h2>Make the next draft <em>feel like you.</em></h2><p>Bring your guidelines, your content, and your team. Give every piece of work the clarity it deserves.</p><div className="hero-ctas"><Link className="button button-lg" to={getPath('/')}>Open your workspace <ArrowRight size={16} /></Link><Link className="button button-outline button-lg" to={getPath('/guidelines')}>Explore guidelines</Link></div></section>
    </main>

    <footer className="footer"><div className="footer-top"><a className="brand" href="#top"><BrandMark size={27} />Klarity</a><nav aria-label="Footer navigation"><Link to={getPath('/reviews')}>Reviews</Link><Link to={getPath('/guidelines')}>Guidelines</Link><Link to={getPath('/assets')}>Brand assets</Link><Link to={getPath('/calendar')}>Calendar</Link>{!user && <Link to="/login">Sign in</Link>}</nav></div><div className="footer-bottom"><p>© {new Date().getFullYear()} Klarity · Enterprise Brand Intelligence.</p><p>Every piece of content. One clear brand identity.</p></div></footer>
  </div></MotionConfig>
}
