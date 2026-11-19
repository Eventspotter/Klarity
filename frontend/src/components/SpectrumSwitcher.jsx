import { useEffect, useRef, useState } from 'react'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '../lib/utils'
import { useApp } from '../context/AppContext'
import { DEFAULT_BRANDS } from '../lib/brands'

const BRAND_GRADIENTS = {
  'Aster & Oak': 'linear-gradient(135deg, #38bdf8 0%, #298ee4 50%, #1e40af 100%)',
  'Nova Athletics': 'linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #9f1239 100%)',
  'Ember & Ivy': 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)',
  'Solaris Media': 'linear-gradient(135deg, #c084fc 0%, #8b5cf6 50%, #6d28d9 100%)',
  'Velvet Thread': 'linear-gradient(135deg, #34d399 0%, #059669 50%, #065f46 100%)',
}

const defaultSpectrums = [
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm and bold ambience',
    color: 'linear-gradient(135deg, #fb7185 0%, #f97316 50%, #fde047 100%)',
    darkColor: 'linear-gradient(135deg, #e11d48 0%, #ea580c 50%, #ca8a04 100%)',
    layoutId: 'spectrum-sunset',
    mark: 'SG',
  },
  {
    id: 'lavender',
    name: 'Lavender Mist',
    description: 'Soft and dreamy palette',
    color: 'linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #e879f9 100%)',
    darkColor: 'linear-gradient(135deg, #9333ea 0%, #db2777 50%, #c026d3 100%)',
    layoutId: 'spectrum-lavender',
    mark: 'LM',
  },
]

export const SpectrumSwitcher = ({
  spectrums: propSpectrums,
  value,
  onChange,
  className,
  title = 'Workspace',
}) => {
  // Safe hook lookup in case component is used outside AppProvider
  let app
  try {
    app = useApp()
  } catch {
    app = null
  }

  const allBrands = app?.allBrands?.length ? app.allBrands : DEFAULT_BRANDS
  const activeBrand = app?.activeBrand || allBrands[0]
  const switchBrand = app?.switchBrand

  // Derive spectrums from props or Klarity's brand workspaces
  const spectrums = propSpectrums || allBrands.map((b) => {
    const bName = b.brand_name || b.name
    const bMark = b.mark || bName.slice(0, 2).toUpperCase()
    const gradient = BRAND_GRADIENTS[bName] || b.color || 'var(--sage)'
    return {
      id: String(b.id || b.code || bName),
      name: bName,
      description: b.tagline || `${bName} workspace`,
      color: gradient,
      darkColor: gradient,
      layoutId: `spectrum-${(b.id || bName).toString().toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      mark: bMark,
      rawBrand: b,
    }
  })

  // Selected item determination
  const selectedSpectrum = (
    value
      ? spectrums.find((s) => s.id === value?.id || s.name === value?.name || s.id === value)
      : activeBrand
        ? spectrums.find((s) => s.name === (activeBrand.brand_name || activeBrand.name))
        : null
  ) || spectrums[0] || defaultSpectrums[0]

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (spectrum) => {
    if (onChange) {
      onChange(spectrum)
    } else if (spectrum.rawBrand && switchBrand) {
      switchBrand(spectrum.rawBrand)
    }
    setIsOpen(false)
  }

  const itemVariant = {
    open: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: 'easeInOut',
      },
    },
    close: {
      opacity: 0,
      y: -5,
      filter: 'blur(5px)',
      transition: {
        duration: 0.1,
        ease: 'easeInOut',
      },
    },
  }

  const dividerVariant = {
    open: {
      opacity: 1,
      scaleX: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    close: {
      opacity: 0,
      scaleX: 0,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'spectrum-switcher w-full max-w-105 overflow-hidden rounded-md',
        'bg-linear-to-b from-neutral-50 to-white dark:from-neutral-900/80 dark:to-neutral-950',
        'shadow-[inset_0_0_0_1px_#e5e5e5,inset_0_2px_0_0_#ffffff] dark:shadow-[inset_0_1px_0_0_#e5e5e510,inset_0_0_0_1px_#171717]',
        className,
      )}
    >
      <motion.div
        className={cn('spectrum-switcher__header flex min-h-16.75 items-center justify-between px-4')}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="spectrum-switcher__info">
          <p className="spectrum-switcher__title text-[0.9rem] font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              className="spectrum-switcher__subtitle text-xs text-neutral-500 dark:text-neutral-400"
              key={selectedSpectrum.name}
              initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -3, filter: 'blur(2px)' }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {selectedSpectrum.name} active
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="spectrum-switcher__controls flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {!isOpen && (
              <motion.div className="spectrum-switcher__swatches-row flex items-center gap-1.5">
                {spectrums.map((spectrum) => {
                  const isSelected = spectrum.id === selectedSpectrum.id
                  return (
                    <motion.div
                      key={spectrum.id}
                      layoutId={spectrum.layoutId}
                      style={{ background: spectrum.color }}
                      className={cn(
                        'spectrum-switcher__swatch-mini h-7 w-7 rounded-md',
                        isSelected && 'is-active',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(spectrum)
                      }}
                      title={`${spectrum.name} (${spectrum.description})`}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 25,
                      }}
                    />
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Close workspace switcher' : 'Open workspace switcher'}
            className={cn(
              'spectrum-switcher__toggle-btn flex items-center justify-center',
              'h-7.5 w-7.5 rounded-md transition-all duration-300',
              'bg-neutral-200/60 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800',
            )}
          >
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{
                type: 'spring',
                damping: 12,
                stiffness: 150,
                mass: 1,
                bounce: 0.3,
                delay: 0.13,
              }}
              style={{ display: 'inline-flex' }}
            >
              <MdKeyboardArrowDown className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
            </motion.span>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
            className="spectrum-switcher__body overflow-hidden"
          >
            <div className="spectrum-switcher__list p-2">
              {spectrums.map((spectrum, index) => {
                const isSelected = spectrum.id === selectedSpectrum.id
                return (
                  <motion.div key={spectrum.id}>
                    {index > 0 && (
                      <motion.div
                        variants={dividerVariant}
                        initial="close"
                        animate="open"
                        exit="close"
                        className="spectrum-switcher__divider mx-4 h-px bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700"
                      />
                    )}

                    <motion.div
                      className={cn(
                        'spectrum-switcher__item cursor-pointer rounded-lg p-2 transition-all duration-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/30',
                        isSelected && 'is-selected',
                      )}
                      onClick={() => handleSelect(spectrum)}
                      role="menuitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelect(spectrum)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <motion.div
                          layoutId={spectrum.layoutId}
                          style={{ background: spectrum.color }}
                          className={cn('spectrum-switcher__swatch-expanded size-10 shrink-0 rounded-md')}
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 90 }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 25,
                          }}
                        >
                          {spectrum.mark && (
                            <span
                              style={{
                                transform: 'rotate(-90deg)',
                                display: 'inline-block',
                              }}
                            >
                              {spectrum.mark}
                            </span>
                          )}
                        </motion.div>

                        <motion.div
                          variants={itemVariant}
                          initial="close"
                          animate="open"
                          exit="close"
                          className="spectrum-switcher__item-content flex flex-1 flex-col"
                        >
                          <span className="spectrum-switcher__item-name text-[0.9rem] font-medium text-neutral-900 transition-colors dark:text-neutral-100">
                            {spectrum.name}
                          </span>
                          <span className="spectrum-switcher__item-desc text-xs text-neutral-500 transition-colors dark:text-neutral-400">
                            {spectrum.description}
                          </span>
                        </motion.div>

                        {isSelected && (
                          <Check
                            size={15}
                            className="text-sage ml-auto shrink-0"
                            style={{ color: 'var(--sage, #298ee4)' }}
                          />
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SpectrumSwitcher
