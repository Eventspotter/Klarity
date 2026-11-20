import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Code,
  Copy,
  Download,
  Edit3,
  FileCheck2,
  FileCode,
  FileUp,
  Image,
  Images,
  Layers,
  Palette,
  Pipette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
  Upload,
  UploadCloud,
  Wand2,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { DEFAULT_BRANDS, getBrandAssets } from '../lib/brands'
import {
  Badge,
  Button,
  CodeBlock,
  Drawer,
  EmptyState,
  Field,
  MiddleTruncate,
  Panel,
  Segmented,
  Select,
  StatusDot,
} from '../components/UI'
import { animateAssetGrid } from '../lib/animations'
import { cx } from '../lib/utils'
import {
  defaultRole,
  extractColorsFromImage,
  generateCssVariables,
  generateTailwindConfig,
  generateTokensJson,
  getColorName,
  hexToRgb,
  normalizeHex,
  parseSwatchesFromText,
} from '../lib/colorUtils'

const ASSETS_MAP_STORAGE_KEY = 'klarity_brand_assets_map_v6'

function getStoredBrandAssets(brandKey) {
  try {
    const raw = localStorage.getItem(ASSETS_MAP_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed[brandKey] && Array.isArray(parsed[brandKey]) && parsed[brandKey].length > 0) {
        return parsed[brandKey]
      }
    }
  } catch {}
  return null
}

function saveStoredBrandAssets(brandKey, assets) {
  try {
    const raw = localStorage.getItem(ASSETS_MAP_STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[brandKey] = assets
    localStorage.setItem(ASSETS_MAP_STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

const swatches = [
  { name: 'Cream', hex: '#F6F1E6', role: 'Background' },
  { name: 'Brown / Ink', hex: '#3B2418', role: 'Text / Ink' },
  { name: 'Klarity Blue', hex: '#298EE4', role: 'Primary Accent' },
  { name: 'Clay', hex: '#A97A32', role: 'Secondary' },
  { name: 'Paper', hex: '#FBF8F1', role: 'Surface' },
  { name: 'Blue wash', hex: '#D7EAFB', role: 'Highlight' },
]

function LogoPlate({ dark = false, brandName = 'Aster & Oak', brand = null }) {
  const bColor = brand?.color || '#298EE4'
  const bMark = brand?.mark || brandName.slice(0, 2).toUpperCase()
  const darkBg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('text') || s.role?.toLowerCase().includes('ink') || s.role?.toLowerCase().includes('dark'))?.hex || '#18181B'
  const lightBg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('background') || s.role?.toLowerCase().includes('surface'))?.hex || '#F8FAFC'
  const bg = dark ? darkBg : lightBg
  const textColor = dark ? '#FFFFFF' : (brand?.swatches?.find(s => s.role?.toLowerCase().includes('text') || s.role?.toLowerCase().includes('ink'))?.hex || '#111827')

  return (
    <svg viewBox="0 0 320 200" className="asset-svg" role="img" aria-label={`${brandName} logo lockup`}>
      <rect width="320" height="200" fill={bg} />
      <g transform="translate(160, 68)">
        <rect x="-20" y="-20" width="40" height="40" rx="9" fill={bColor} />
        <text x="0" y="5.5" textAnchor="middle" fill="#FFFFFF" style={{ fontSize: '13px', fontWeight: 800 }}>
          {bMark}
        </text>
      </g>
      <text
        x="160"
        y="122"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        className="asset-svg__wordmark"
        style={{ fontSize: brandName.length > 15 ? '17px' : '20px', fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        {brandName}
      </text>
      <text x="24" y="174" fill={dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'} className="asset-svg__caption">
        PRIMARY LOCKUP · HORIZONTAL
      </text>
      <text x="296" y="174" textAnchor="end" fill={bColor} className="asset-svg__caption" style={{ fontWeight: 700 }}>
        {brand?.brand_code || brand?.code || 'VERIFIED'}
      </text>
    </svg>
  )
}

function MonogramPlate({ mark = 'A&O', color = '#3B2418', bg = '#FBF8F1', brand = null }) {
  const brandCode = brand?.brand_code || brand?.code || 'DIGITAL ONLY'
  const displayBg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('background') || s.role?.toLowerCase().includes('surface'))?.hex || bg
  const displayColor = brand?.color || color

  return (
    <svg viewBox="0 0 320 200" className="asset-svg" role="img" aria-label={`${mark} monogram`}>
      <rect width="320" height="200" fill={displayBg} />
      <circle cx="160" cy="88" r="50" fill={displayColor} />
      <text x="160" y="99" textAnchor="middle" fill="#FFFFFF" className="asset-svg__monogram" style={{ fontSize: '22px', fontWeight: 800 }}>
        {mark}
      </text>
      <text x="160" y="168" textAnchor="middle" fill="#5F675C" className="asset-svg__caption">
        MONOGRAM · {brandCode}
      </text>
    </svg>
  )
}

export function DynamicPalettePlate({ swatches: inputSwatches = [], title = 'COLOUR PALETTE' }) {
  const displaySwatches =
    inputSwatches && inputSwatches.length > 0 ? inputSwatches.slice(0, 6) : swatches.slice(0, 4)
  const count = displaySwatches.length
  const width = 320
  const height = 200
  const padding = 16
  const gap = count > 5 ? 6 : 8
  const availableWidth = width - padding * 2 - (count - 1) * gap
  const chipWidth = Math.max(30, Math.floor(availableWidth / count))
  const chipHeight = 88
  const chipY = 30

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="asset-svg" role="img" aria-label={title}>
      <rect width={width} height={height} fill="#FBF8F1" />
      {displaySwatches.map((swatch, index) => {
        const x = padding + index * (chipWidth + gap)
        const centerX = x + chipWidth / 2
        const maxChars = count > 5 ? 7 : count > 4 ? 9 : 12
        const displayName = swatch.name
          ? swatch.name.length > maxChars
            ? `${swatch.name.slice(0, maxChars - 1)}…`
            : swatch.name
          : `Token ${index + 1}`

        return (
          <g key={`${swatch.hex}-${index}`}>
            <rect
              x={x}
              y={chipY}
              width={chipWidth}
              height={chipHeight}
              rx={6}
              fill={swatch.hex}
              stroke="rgba(32, 21, 15, 0.12)"
              strokeWidth={1}
            />
            <text
              x={centerX}
              y={chipY + chipHeight + 17}
              textAnchor="middle"
              fill="#5F675C"
              className="asset-svg__caption"
              style={{
                fontSize: count > 5 ? '8px' : count > 4 ? '8.5px' : '9.5px',
                fontWeight: 600,
              }}
            >
              {displayName}
            </text>
            <text
              x={centerX}
              y={chipY + chipHeight + 30}
              textAnchor="middle"
              fill="#20150F"
              className="asset-svg__hex"
              style={{
                fontSize: count > 5 ? '7.5px' : count > 4 ? '8px' : '9px',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {swatch.hex}
            </text>
          </g>
        )
      })}
      <text
        x={padding}
        y={186}
        fill="#5F675C"
        className="asset-svg__caption"
        style={{ fontSize: '8.5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}
      >
        {title.toUpperCase()} · {count} {count === 1 ? 'TOKEN' : 'TOKENS'}
      </text>
    </svg>
  )
}

function PalettePlate() {
  return <DynamicPalettePlate swatches={swatches} title="Core palette" />
}

function TypePlate({ displayFont = 'Bricolage Grotesque', bodyFont = 'Manrope', sentence = 'Fewer pieces. Kept longer.', brand = null }) {
  const textColor = brand?.swatches?.find(s => s.role?.toLowerCase().includes('text') || s.role?.toLowerCase().includes('ink'))?.hex || '#1E1B4B'
  const bg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('background') || s.role?.toLowerCase().includes('surface'))?.hex || '#F6F1E6'
  const accent = brand?.color || '#298EE4'

  return (
    <svg viewBox="0 0 320 200" className="asset-svg" role="img" aria-label="Typography specimen">
      <rect width="320" height="200" fill={bg} />
      <text x="24" y="106" fill={accent} className="asset-svg__aa" style={{ fontSize: '68px', fontWeight: 800, opacity: 0.9 }}>
        Aa
      </text>
      <text x="135" y="54" fill={textColor} className="asset-svg__type-name" style={{ fontSize: '15px', fontWeight: 700 }}>
        {displayFont}
      </text>
      <text x="135" y="74" fill="#5F675C" className="asset-svg__caption">
        DISPLAY · 700 / 800
      </text>
      <text x="135" y="108" fill={textColor} className="asset-svg__type-name asset-svg__type-name--body" style={{ fontSize: '13.5px', fontWeight: 500 }}>
        {bodyFont}
      </text>
      <text x="135" y="128" fill="#5F675C" className="asset-svg__caption">
        UI &amp; BODY · 400–700
      </text>
      <text x="24" y="174" fill={textColor} className="asset-svg__sentence" style={{ fontSize: '11px', opacity: 0.85 }}>
        {sentence}
      </text>
    </svg>
  )
}

function CampaignPlate({ variant = 1, brand = null }) {
  const brandName = brand?.brand_name || brand?.name || 'Aster & Oak'
  const brandColor = brand?.color || '#298EE4'
  const tagline = brand?.tagline || 'A slower morning.'
  const darkBg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('text') || s.role?.toLowerCase().includes('ink'))?.hex || '#18181B'
  const lightBg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('background') || s.role?.toLowerCase().includes('surface'))?.hex || '#F8FAFC'
  const secColor = brand?.swatches?.find(s => s.role?.toLowerCase().includes('secondary') || s.role?.toLowerCase().includes('highlight'))?.hex || '#F97316'

  if (variant === 2) {
    return (
      <svg viewBox="0 0 320 200" className="asset-svg" role="img" aria-label={`${brandName} campaign plate`}>
        <rect width="320" height="200" fill={darkBg} />
        <path d="M206 0h114v200H182c22-31 27-62 22-96-3-24 3-59 2-104Z" fill={brandColor} opacity=".65" />
        <path d="M218 0v200M236 0v200M254 0v200M272 0v200" stroke="#FFFFFF" strokeOpacity=".14" />
        <text x="22" y="70" fill="#FFFFFF" className="asset-svg__campaign" style={{ fontSize: '19px', fontWeight: 700 }}>
          {brandName}
        </text>
        <text x="22" y="98" fill="#FFFFFF" opacity="0.8" className="asset-svg__campaign" style={{ fontSize: '12.5px' }}>
          {tagline}
        </text>
        <text x="22" y="174" fill="#FFFFFF" opacity="0.5" className="asset-svg__caption">
          CAMPAIGN PLATE · 2026
        </text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 320 200" className="asset-svg" role="img" aria-label={`${brandName} campaign artboard`}>
      <rect width="320" height="200" fill={lightBg} />
      <circle cx="236" cy="84" r="54" fill={brandColor} opacity="0.9" />
      <circle cx="210" cy="116" r="32" fill={secColor} opacity="0.75" />
      <path d="M30 48h40M30 60h24" stroke={darkBg} strokeWidth="2" opacity="0.3" />
      <text x="24" y="112" fill={darkBg} className="asset-svg__campaign" style={{ fontSize: '20px', fontWeight: 800 }}>
        {brandName}
      </text>
      <text x="24" y="136" fill={darkBg} opacity="0.75" className="asset-svg__campaign" style={{ fontSize: '12px', fontWeight: 500 }}>
        {tagline}
      </text>
      <text x="24" y="176" fill={darkBg} opacity="0.5" className="asset-svg__caption">
        OFFICIAL HERO ARTBOARD · 2026
      </text>
    </svg>
  )
}

function SocialPlate({ handle = '@BRAND', accentColor = '#298EE4', brand = null }) {
  const brandName = brand?.brand_name || brand?.name || 'Brand'
  const darkBg = brand?.swatches?.find(s => s.role?.toLowerCase().includes('text') || s.role?.toLowerCase().includes('ink'))?.hex || '#18181B'
  const tagline = brand?.tagline || 'Keep the good things.'

  return (
    <svg viewBox="0 0 320 200" className="asset-svg" role="img" aria-label="Social template">
      <rect width="320" height="200" fill={darkBg} />
      <circle cx="236" cy="74" r="58" fill={accentColor} />
      <path d="M0 152c64-28 122-34 172-20 42 12 90 14 148 4v64H0v-48Z" fill="#FFFFFF" opacity="0.1" />
      <text x="24" y="38" fill="#FFFFFF" opacity="0.7" className="asset-svg__caption asset-svg__caption--light">
        {handle}
      </text>
      <text x="24" y="96" fill="#FFFFFF" className="asset-svg__campaign asset-svg__campaign--social" style={{ fontSize: '19px', fontWeight: 700 }}>
        {brandName}
      </text>
      <text x="24" y="122" fill="#FFFFFF" opacity="0.8" className="asset-svg__campaign asset-svg__campaign--social" style={{ fontSize: '12px' }}>
        {tagline}
      </text>
      <text x="24" y="180" fill="#FFFFFF" opacity="0.45" className="asset-svg__caption">
        STORY TEMPLATE · 16:10 PREVIEW
      </text>
    </svg>
  )
}

const defaultAssets = [
  {
    id: 'logo-primary',
    title: 'Primary lockup',
    kind: 'logos',
    type: 'SVG',
    size: '18 KB',
    updated: '12 Nov 2026',
    owner: 'Brand team',
    usage: 'Digital and print',
    description: 'The default horizontal lockup. Cream and ink versions are approved for digital and print.',
    plateType: 'logo-primary',
  },
  {
    id: 'logo-mono',
    title: 'Monogram',
    kind: 'logos',
    type: 'SVG',
    size: '9 KB',
    updated: '08 Nov 2026',
    owner: 'Brand team',
    usage: 'Digital only',
    description: 'Reserved for the mark, social avatars, and small placements. Never use it to replace the wordmark in copy.',
    plateType: 'logo-mono',
  },
  {
    id: 'palette',
    title: 'Core palette',
    kind: 'colour',
    type: 'ASE · CSS',
    size: '6 tokens',
    updated: '04 Nov 2026',
    owner: 'Design ops',
    usage: 'Tokens & themes',
    description: 'Cream, ink, sage, and clay. Sage carries action and selection; it is never decorative.',
    plateType: 'palette',
    swatches: [
      { name: 'Cream', hex: '#F6F1E6', role: 'Background' },
      { name: 'Brown / Ink', hex: '#3B2418', role: 'Text / Ink' },
      { name: 'Klarity Blue', hex: '#298EE4', role: 'Primary Accent' },
      { name: 'Clay', hex: '#A97A32', role: 'Secondary' },
      { name: 'Paper', hex: '#FBF8F1', role: 'Surface' },
      { name: 'Blue wash', hex: '#D7EAFB', role: 'Highlight' },
    ],
  },
  {
    id: 'palette-autumn',
    title: 'Autumn Campaign Wash',
    kind: 'colour',
    type: 'Palette · Tokens',
    size: '4 tokens',
    updated: '08 Nov 2026',
    owner: 'Creative ops',
    usage: 'Campaign plate & social',
    description: 'Deep ink base with warm linen rule, rich terracotta clay, and wash highlights.',
    plateType: 'palette',
    swatches: [
      { name: 'Deep Ink', hex: '#22140D', role: 'Base / Ground' },
      { name: 'Linen Rule', hex: '#DDE5D6', role: 'Highlight' },
      { name: 'Terracotta', hex: '#A97A32', role: 'Accent' },
      { name: 'Klarity Sky', hex: '#298EE4', role: 'Action' },
    ],
  },
  {
    id: 'type',
    title: 'Type pairing',
    kind: 'typography',
    type: 'Specimen',
    size: '28 KB',
    updated: '01 Nov 2026',
    owner: 'Typography lead',
    usage: 'UI and editorial',
    description: 'Bricolage Grotesque for display, Manrope for interface and body. One display moment per screen.',
    plateType: 'type',
  },
  {
    id: 'campaign-slower',
    title: 'A slower morning',
    kind: 'campaign',
    type: 'SVG plate',
    size: '64 KB',
    updated: '10 Nov 2026',
    owner: 'Marketing creative',
    usage: 'Campaign hero',
    description: 'Spring campaign plate. Organic sage field, quiet type, generous cream. Synthetic demonstration artwork.',
    plateType: 'campaign-1',
  },
  {
    id: 'campaign-washed',
    title: 'The washed edge',
    kind: 'campaign',
    type: 'SVG plate',
    size: '58 KB',
    updated: '10 Nov 2026',
    owner: 'Marketing creative',
    usage: 'Editorial placement',
    description: 'Autumn campaign plate. Ink ground with sage depth and a linen-rule detail. Synthetic demonstration artwork.',
    plateType: 'campaign-2',
  },
  {
    id: 'campaign-oak',
    title: 'Oak & linen',
    kind: 'campaign',
    type: 'SVG plate',
    size: '52 KB',
    updated: '09 Nov 2026',
    owner: 'Creative ops',
    usage: 'Packaging & web',
    description: 'Object-led composition using the core palette. Synthetic demonstration artwork.',
    plateType: 'campaign-3',
  },
  {
    id: 'social',
    title: 'Social story template',
    kind: 'campaign',
    type: 'SVG template',
    size: '36 KB',
    updated: '07 Nov 2026',
    owner: 'Social team',
    usage: 'Instagram & TikTok',
    description: 'A 4:5 story frame with the mark and a three-line close. Keep captions under 90 words.',
    plateType: 'social',
  },
]

function renderAssetPreview(asset, large = false, brand = null) {
  const bName = brand?.brand_name || brand?.name || 'Aster & Oak'
  const bMark = brand?.mark || bName.slice(0, 2).toUpperCase()
  const bColor = brand?.color || '#298EE4'
  const bDisplayFont = brand?.displayFont || 'Bricolage Grotesque'
  const bBodyFont = brand?.bodyFont || 'Manrope'
  const bSwatches = brand?.swatches || swatches

  if (asset.kind === 'colour' || (asset.swatches && asset.swatches.length > 0)) {
    return <DynamicPalettePlate swatches={asset.swatches || bSwatches} title={asset.title} />
  }
  if (asset.imageUrl) {
    return (
      <div className={cx('asset-card__image-wrap', large && 'asset-drawer__preview--uploaded')}>
        <img src={asset.imageUrl} alt={asset.title} className="asset-uploaded-img" />
      </div>
    )
  }
  switch (asset.plateType) {
    case 'logo-primary':
      return <LogoPlate dark={large} brandName={bName} brand={brand} />
    case 'logo-mono':
      return <MonogramPlate mark={bMark} color={bColor} brand={brand} />
    case 'palette':
      return <DynamicPalettePlate swatches={asset.swatches || bSwatches} title={asset.title} />
    case 'type':
      return (
        <TypePlate
          displayFont={bDisplayFont}
          bodyFont={bBodyFont}
          sentence={brand?.tagline || brand?.values || 'Fewer pieces. Kept longer.'}
          brand={brand}
        />
      )
    case 'campaign-1':
      return <CampaignPlate variant={1} brand={brand} />
    case 'campaign-2':
      return <CampaignPlate variant={2} brand={brand} />
    case 'campaign-3':
      return <CampaignPlate variant={3} brand={brand} />
    case 'social':
      return (
        <SocialPlate
          handle={`@${bName.replace(/[\s&]+/g, '').toUpperCase()}`}
          accentColor={bColor}
          brand={brand}
        />
      )
    default:
      return (
        <div className="asset-card__image-wrap">
          <FileCheck2 size={36} style={{ color: bColor || 'var(--sage)' }} />
        </div>
      )
  }
}

const filters = [
  { value: 'all', label: 'All' },
  { value: 'logos', label: 'Logos' },
  { value: 'colour', label: 'Colour' },
  { value: 'typography', label: 'Typography' },
  { value: 'campaign', label: 'Campaign' },
]

const categoryOptions = [
  { value: 'logos', label: 'Logos & Wordmarks' },
  { value: 'colour', label: 'Colour & Palettes' },
  { value: 'typography', label: 'Typography & Fonts' },
  { value: 'campaign', label: 'Campaign & Creative' },
]

export function Assets() {
  const { toast, activeBrand } = useApp()
  const currentBrand = useMemo(() => {
    if (!activeBrand) return DEFAULT_BRANDS[0]
    const match = DEFAULT_BRANDS.find(
      (b) => b.brand_name === activeBrand.brand_name || b.name === activeBrand.name
    )
    return match ? { ...match, ...activeBrand } : activeBrand
  }, [activeBrand])

  const brandKey = currentBrand.brand_name || currentBrand.name || 'Aster & Oak'

  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)

  // Upload Drawer State
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    kind: 'logos',
    type: 'SVG',
    description: '',
    usage: 'Digital + print',
    owner: `${currentBrand.brand_name || 'Brand'} team`,
  })

  // Palette Studio State
  const [paletteTab, setPaletteTab] = useState('builder') // 'builder' | 'paste' | 'extract'
  const [paletteSwatches, setPaletteSwatches] = useState(() => {
    return currentBrand.swatches && currentBrand.swatches.length > 0
      ? [...currentBrand.swatches]
      : [
          { name: 'Cream', hex: '#F6F1E6', role: 'Background' },
          { name: 'Brown / Ink', hex: '#3B2418', role: 'Text / Ink' },
          { name: 'Klarity Blue', hex: '#298EE4', role: 'Primary Accent' },
          { name: 'Clay', hex: '#A97A32', role: 'Secondary' },
        ]
  })
  const [pasteText, setPasteText] = useState('')
  const [extractedThumb, setExtractedThumb] = useState(null)
  const extractInputRef = useRef(null)

  // Edit Mode Palette State
  const [editSwatches, setEditSwatches] = useState([])

  // Drag and drop states
  const [isDraggingPage, setIsDraggingPage] = useState(false)
  const [isDraggingDropzone, setIsDraggingDropzone] = useState(false)
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const drawerPreviewRef = useRef(null)
  const gridRef = useRef(null)

  // Initialize assets from brand-scoped store or default brand assets
  const [assetsList, setAssetsList] = useState(() => {
    return getStoredBrandAssets(brandKey) || getBrandAssets(currentBrand)
  })

  // Whenever activeBrand changes from the sidebar, instantly update the assets list!
  useEffect(() => {
    const loaded = getStoredBrandAssets(brandKey) || getBrandAssets(currentBrand)
    setAssetsList(loaded)
    if (currentBrand.swatches && currentBrand.swatches.length > 0) {
      setPaletteSwatches([...currentBrand.swatches])
    }
    setUploadForm((prev) => ({
      ...prev,
      owner: `${currentBrand.brand_name || 'Brand'} team`,
    }))
    setSelected(null)
    setIsEditing(false)
  }, [brandKey, currentBrand])

  useLayoutEffect(() => {
    if (gridRef.current) {
      animateAssetGrid(gridRef.current)
    }
  }, [filter])

  const visible = useMemo(
    () => assetsList.filter((asset) => filter === 'all' || asset.kind === filter),
    [assetsList, filter],
  )

  useLayoutEffect(() => {
    if (gridRef.current) {
      animateAssetGrid(gridRef.current)
    }
  }, [filter])

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value)
      toast(`${label} copied.`)
    } catch {
      toast('Could not access the clipboard in this browser.', 'warn')
    }
  }

  const handleUpdateSwatch = (index, field, value) => {
    setPaletteSwatches((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === 'hex' && normalizeHex(value) && (!next[index].name || next[index].name === 'New Token')) {
        next[index].name = getColorName(normalizeHex(value))
      }
      return next
    })
  }

  const handleAddSwatch = () => {
    const roles = ['Accent', 'Secondary', 'Highlight', 'Surface', 'Muted']
    const nextRole = roles[paletteSwatches.length % roles.length]
    setPaletteSwatches((prev) => [
      ...prev,
      { name: 'New Token', hex: '#298EE4', role: nextRole },
    ])
  }

  const handleRemoveSwatch = (index) => {
    if (paletteSwatches.length <= 1) return
    setPaletteSwatches((prev) => prev.filter((_, i) => i !== index))
  }

  const handleApplyPreset = (presetName) => {
    if (presetName === 'core') {
      const coreSwatches =
        currentBrand.swatches && currentBrand.swatches.length > 0
          ? [...currentBrand.swatches]
          : [
              { name: 'Cream', hex: '#F6F1E6', role: 'Background' },
              { name: 'Brown / Ink', hex: '#3B2418', role: 'Text / Ink' },
              { name: 'Klarity Blue', hex: '#298EE4', role: 'Accent / Action' },
              { name: 'Clay', hex: '#A97A32', role: 'Secondary' },
            ]
      setPaletteSwatches(coreSwatches)
      toast(`Loaded ${currentBrand.brand_name} Core tokens.`, 'good')
    } else if (presetName === 'earth') {
      setPaletteSwatches([
        { name: 'Warm Linen', hex: '#F7F3E9', role: 'Background' },
        { name: 'Espresso', hex: '#2C1D11', role: 'Deep Text' },
        { name: 'Terracotta', hex: '#C86D51', role: 'Primary Accent' },
        { name: 'Olive Sage', hex: '#7A8B7B', role: 'Secondary' },
      ])
      toast('Loaded Warm Earth preset.', 'good')
    } else if (presetName === 'modern') {
      setPaletteSwatches([
        { name: 'Ice White', hex: '#F8FAFC', role: 'Background' },
        { name: 'Slate Dark', hex: '#0F172A', role: 'Primary Text' },
        { name: 'Electric Blue', hex: '#2563EB', role: 'Accent / Action' },
        { name: 'Sky Cyan', hex: '#38BDF8', role: 'Secondary' },
      ])
      toast('Loaded Modern Blue preset.', 'good')
    }
  }

  const handleApplyPaste = () => {
    const parsed = parseSwatchesFromText(pasteText)
    if (parsed.length > 0) {
      setPaletteSwatches(parsed)
      setPaletteTab('builder')
      toast(`Successfully parsed ${parsed.length} color tokens!`, 'good')
    } else {
      toast('Could not find valid hex colors in pasted text.', 'warn')
    }
  }

  const handleExtractImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setExtractedThumb(dataUrl)
      const extracted = await extractColorsFromImage(dataUrl, 6)
      if (extracted.length > 0) {
        setPaletteSwatches(extracted)
        toast(`Extracted ${extracted.length} dominant colors from image!`, 'good')
      } else {
        toast('Could not extract distinct colors from image.', 'warn')
      }
    }
    reader.readAsDataURL(file)
  }

  // Parse uploaded file
  const processFile = (file, isReplace = false) => {
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE'
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ')
    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`

    // If json or css file, parse tokens
    if (file.name.endsWith('.json') || file.name.endsWith('.css') || file.name.endsWith('.txt')) {
      const textReader = new FileReader()
      textReader.onload = (e) => {
        const text = e.target.result
        const parsed = parseSwatchesFromText(text)
        if (parsed.length > 0) {
          if (isReplace) {
            setEditSwatches(parsed)
            setEditForm((prev) => ({ ...prev, kind: 'colour', type: 'Palette · Tokens' }))
          } else {
            setPaletteSwatches(parsed)
            setUploadForm((prev) => ({
              ...prev,
              title: prev.title || cleanTitle,
              kind: 'colour',
              type: 'Palette · Tokens',
            }))
            setUploadOpen(true)
          }
          toast(`Extracted ${parsed.length} color tokens from ${file.name}!`, 'good')
        }
      }
      textReader.readAsText(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      if (isReplace) {
        setEditForm((prev) => ({
          ...prev,
          imageUrl: dataUrl,
          type: ext,
          size: formattedSize,
        }))
        toast(`File replaced with ${file.name}.`, 'good')
      } else {
        setUploadFile({
          name: file.name,
          size: formattedSize,
          type: ext,
          dataUrl,
        })
        setUploadForm((prev) => ({
          ...prev,
          title: prev.title || cleanTitle,
          type: ext,
        }))
        if (isImage && uploadForm.kind === 'colour') {
          extractColorsFromImage(dataUrl, 6).then((extracted) => {
            if (extracted.length > 0) {
              setPaletteSwatches(extracted)
              setExtractedThumb(dataUrl)
              toast(`Extracted ${extracted.length} colors from uploaded image.`, 'good')
            }
          })
        }
        setUploadOpen(true)
      }
    }
    reader.readAsDataURL(file)
  }

  // Page-level drag & drop listeners
  useEffect(() => {
    const handleDragEnter = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        dragCounterRef.current += 1
        setIsDraggingPage(true)
      }
    }
    const handleDragLeave = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        dragCounterRef.current -= 1
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0
          setIsDraggingPage(false)
        }
      }
    }
    const handleDragOver = (e) => {
      e.preventDefault()
    }
    const handleDrop = (e) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDraggingPage(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0])
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  // Create new asset
  const handleCreateAsset = (e) => {
    e.preventDefault()
    if (!uploadForm.title.trim()) {
      toast('Please provide an asset title.', 'warn')
      return
    }

    const today = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date())

    const isPalette = uploadForm.kind === 'colour'
    const newAsset = {
      id: `asset-${Date.now()}`,
      title: uploadForm.title.trim(),
      kind: uploadForm.kind,
      type: isPalette ? 'Palette · Tokens' : uploadForm.type || 'SVG',
      size: isPalette ? `${paletteSwatches.length} tokens` : uploadFile?.size || '12 KB',
      updated: today,
      owner: uploadForm.owner || (isPalette ? 'Design ops' : 'Brand team'),
      usage: uploadForm.usage || (isPalette ? 'Tokens & themes' : 'Digital + print'),
      description:
        uploadForm.description.trim() ||
        (isPalette
          ? `Approved brand color palette tokens (${paletteSwatches.map((s) => s.name).join(', ')}).`
          : 'Approved brand asset.'),
      imageUrl: uploadFile?.dataUrl || null,
      swatches: isPalette ? paletteSwatches : undefined,
      isCustom: true,
    }

    setAssetsList((prev) => {
      const next = [newAsset, ...prev]
      saveStoredBrandAssets(brandKey, next)
      return next
    })
    toast(`Asset "${newAsset.title}" added to library.`, 'good')
    setUploadOpen(false)
    setUploadFile(null)
    setExtractedThumb(null)
    setUploadForm({
      title: '',
      kind: 'logos',
      type: 'SVG',
      description: '',
      usage: 'Digital + print',
      owner: `${currentBrand.brand_name || 'Brand'} team`,
    })
  }

  // Open asset drawer
  const handleOpenAsset = (asset) => {
    setSelected(asset)
    setIsEditing(false)
    setEditSwatches(
      asset.swatches && asset.swatches.length > 0
        ? [...asset.swatches]
        : asset.kind === 'colour'
          ? [...swatches]
          : []
    )
    setEditForm({
      title: asset.title,
      kind: asset.kind,
      type: asset.type,
      size: asset.size,
      updated: asset.updated,
      owner: asset.owner || (asset.kind === 'colour' ? 'Design ops' : 'Brand team'),
      usage: asset.usage || (asset.kind === 'colour' ? 'Tokens & themes' : 'Digital and print'),
      description: asset.description || '',
      imageUrl: asset.imageUrl || null,
      swatches: asset.swatches ? [...asset.swatches] : undefined,
    })
  }

  // Save edited asset
  const handleSaveEdit = (e) => {
    e?.preventDefault?.()
    if (!editForm.title.trim()) {
      toast('Title cannot be empty.', 'warn')
      return
    }

    const isPalette = editForm.kind === 'colour'
    const finalSwatches = isPalette && editSwatches.length > 0 ? editSwatches : undefined
    const finalSize = isPalette && editSwatches.length > 0 ? `${editSwatches.length} tokens` : editForm.size

    setAssetsList((prev) => {
      const next = prev.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              ...editForm,
              title: editForm.title.trim(),
              description: editForm.description.trim(),
              swatches: finalSwatches,
              size: finalSize,
              updated: 'Today',
            }
          : item,
      )
      saveStoredBrandAssets(brandKey, next)
      return next
    })

    setSelected((prev) => ({
      ...prev,
      ...editForm,
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      swatches: finalSwatches,
      size: finalSize,
      updated: 'Today',
    }))

    setIsEditing(false)
    toast('Asset updated.', 'good')
  }

  // Delete asset
  const handleDeleteAsset = (id) => {
    setAssetsList((prev) => {
      const next = prev.filter((item) => item.id !== id)
      saveStoredBrandAssets(brandKey, next)
      return next
    })
    setSelected(null)
    toast('Asset removed from library.', 'good')
  }

  // Reset to original default library for current brand
  const handleResetDefaults = () => {
    const defaults = getBrandAssets(currentBrand)
    setAssetsList(defaults)
    setSelected(null)
    saveStoredBrandAssets(brandKey, defaults)
    toast(`Asset library for ${currentBrand.brand_name} reset to defaults.`, 'good')
  }

  // Download asset (real file or serialized SVG)
  const handleDownload = (asset) => {
    if (asset.imageUrl) {
      const a = document.createElement('a')
      a.href = asset.imageUrl
      const slug = asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const ext = (asset.type || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
      a.download = `${slug}.${ext || 'png'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast(`Downloaded ${asset.title}.`, 'good')
      return
    }

    if (drawerPreviewRef.current) {
      const svg = drawerPreviewRef.current.querySelector('svg')
      if (svg) {
        const serializer = new XMLSerializer()
        const source = serializer.serializeToString(svg)
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${asset.id}.svg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast(`Downloaded ${asset.title} as SVG.`, 'good')
        return
      }
    }

    toast(`Downloaded ${asset.title}.`, 'good')
  }

  return (
    <div className="assets-page">
      {/* Global Drag-and-Drop Overlay */}
      {isDraggingPage && (
        <div className="asset-global-overlay">
          <div className="asset-global-overlay__box">
            <UploadCloud size={48} style={{ color: 'var(--sage)' }} />
            <h3>Drop brand file to upload</h3>
            <p>Release anywhere to add directly to the {currentBrand.brand_name} asset library</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <section className="page-head">
        <div>
          <h1>Brand assets</h1>
          <p>
            Approved marks, palette, typography, and plates for{' '}
            <strong style={{ color: 'var(--ink)' }}>{currentBrand.brand_name}</strong>. Switch brands from the sidebar.
          </p>
        </div>
        <div className="page-head__actions">
          <div className="asset-stat-group">
            <span className="asset-stat">
              <Layers size={15} /> {assetsList.length} approved assets
            </span>
            <button
              type="button"
              className="asset-reset-btn"
              onClick={handleResetDefaults}
              title={`Restore default ${currentBrand.brand_name} assets`}
            >
              Reset library
            </button>
          </div>
          <Button icon={Upload} variant="primary" onClick={() => setUploadOpen(true)}>
            Upload asset
          </Button>
        </div>
      </section>

      {/* Category Tabs & Note */}
      <div className="asset-toolbar">
        <Segmented label="Filter assets" value={filter} onChange={setFilter} options={filters} />
        <span className="asset-toolbar__note">
          <Check size={14} /> Every asset is linked to a guideline
        </span>
      </div>

      {/* Asset Cards Grid */}
      {visible.length ? (
        <div ref={gridRef} className="asset-grid">
          {visible.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className={cx('asset-card', asset.kind === 'campaign' && 'asset-card--campaign')}
              onClick={() => handleOpenAsset(asset)}
            >
              <span className="asset-card__preview">{renderAssetPreview(asset, false, currentBrand)}</span>
              <span className="asset-card__foot">
                <span>
                  <strong>
                    <MiddleTruncate filename={asset.title} />
                  </strong>
                  <small>
                    {asset.type} · {asset.size}
                  </small>
                </span>
                <span className="asset-card__open">
                  <ArrowUpRight size={15} />
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Images}
          title="No assets in this category"
          description="Drag and drop brand files or choose another category to browse."
          action={
            <Button variant="secondary" onClick={() => setFilter('all')}>
              Show all assets
            </Button>
          }
        />
      )}

      {/* Core Palette Section */}
      <section className="palette-section">
        <div className="palette-section__head">
          <div>
            <h2>Core palette · {currentBrand.brand_name}</h2>
            <p>Click any swatch to copy its hex value.</p>
          </div>
          <span>
            <Palette size={15} /> {(currentBrand.swatches || swatches).length} tokens
          </span>
        </div>
        <div className="swatch-grid">
          {(currentBrand.swatches || swatches).map((swatch) => (
            <button
              key={swatch.hex}
              type="button"
              className="swatch"
              onClick={() => copy(swatch.hex, swatch.name)}
              aria-label={`Copy ${swatch.name} ${swatch.hex}`}
            >
              <span className="swatch__chip" style={{ background: swatch.hex }} aria-hidden="true" />
              <span className="swatch__meta">
                <strong>{swatch.name}</strong>
                <span>{swatch.hex}</span>
                <Copy size={12} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Asset Guidelines Link Section */}
      <section className="asset-guidelines">
        <div>
          <span className="asset-guidelines__icon">
            <Sparkles size={18} />
          </span>
          <h2>One source, one identity.</h2>
          <p>
            Assets stay linked to the guideline that governs them. When a rule changes, the library shows what
            needs to be replaced before an old export reaches a channel.
          </p>
        </div>
        <div className="asset-guidelines__links">
          <button type="button" onClick={() => copy(`${currentBrand.brand_name} primary lockup`, 'Asset name')}>
            <Image size={15} /> Copy asset reference
          </button>
          <button type="button" onClick={() => copy(`${currentBrand.displayFont || 'Bricolage Grotesque'} / ${currentBrand.bodyFont || 'Manrope'}`, 'Type pairing')}>
            <Type size={15} /> Copy type pairing
          </button>
          <button type="button" onClick={() => copy((currentBrand.swatches || swatches).map(s => s.hex).join(', '), 'Palette')}>
            <Palette size={15} /> Copy palette tokens
          </button>
        </div>
      </section>

      {/* Upload New Asset Drawer */}
      <Drawer
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false)
          setUploadFile(null)
        }}
        title="Upload new brand asset"
        description="Add a logo, campaign plate, typography specimen, or color palette to the workspace library."
        width="620px"
        footer={
          <div className="drawer__actions drawer__actions--between">
            <Button
              variant="ghost"
              onClick={() => {
                setUploadOpen(false)
                setUploadFile(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" icon={Plus} onClick={handleCreateAsset}>
              Add to library
            </Button>
          </div>
        }
      >
        <form className="asset-edit-form" onSubmit={handleCreateAsset}>
          <div className="asset-form-grid">
            <Field label="Category / Kind" htmlFor="upload-kind">
              <Select
                id="upload-kind"
                value={uploadForm.kind}
                options={categoryOptions}
                onChange={(val) => {
                  setUploadForm((prev) => ({
                    ...prev,
                    kind: val,
                    type: val === 'colour' ? 'Palette · Tokens' : (prev.type === 'Palette · Tokens' ? 'SVG' : prev.type),
                  }))
                }}
              />
            </Field>

            <Field label="Format / Type" htmlFor="upload-type">
              <input
                id="upload-type"
                type="text"
                className="asset-form-input"
                value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                placeholder={uploadForm.kind === 'colour' ? 'Palette · Tokens' : 'SVG, PNG 2x, etc.'}
              />
            </Field>
          </div>

          {/* If Colour & Palettes is selected, show Palette Studio */}
          {uploadForm.kind === 'colour' ? (
            <div className="palette-studio">
              <div className="palette-studio__header">
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Palette Studio</strong>
                  <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '2px 0 0' }}>
                    Visual swatches, paste tokens/CSS, or auto-extract from moodboard
                  </p>
                </div>
                <Segmented
                  label="Palette Studio Mode"
                  value={paletteTab}
                  onChange={setPaletteTab}
                  options={[
                    { value: 'builder', label: 'Visual Builder', icon: Palette },
                    { value: 'paste', label: 'Paste Code / CSS', icon: Code },
                    { value: 'extract', label: 'Extract from Image', icon: Pipette },
                  ]}
                />
              </div>

              {paletteTab === 'builder' && (
                <div className="palette-builder-pane">
                  <div className="palette-swatches-header">
                    <span>Color</span>
                    <span>Hex</span>
                    <span>Token Name</span>
                    <span>Role / Usage</span>
                    <span aria-hidden="true" />
                  </div>
                  <div className="palette-swatches-list">
                    {paletteSwatches.map((swatch, idx) => (
                      <div key={idx} className="palette-swatch-row">
                        <div
                          className="palette-swatch-chip"
                          style={{ background: swatch.hex }}
                          title="Click to pick color"
                        >
                          <input
                            type="color"
                            aria-label={`Color picker for ${swatch.name || 'token'}`}
                            value={normalizeHex(swatch.hex) || '#298EE4'}
                            onChange={(e) => handleUpdateSwatch(idx, 'hex', e.target.value.toUpperCase())}
                          />
                        </div>
                        <input
                          type="text"
                          className="palette-swatch-input palette-swatch-input--hex"
                          value={swatch.hex}
                          onChange={(e) => handleUpdateSwatch(idx, 'hex', e.target.value)}
                          placeholder="#298EE4"
                          maxLength={7}
                          aria-label="Hex color code"
                        />
                        <input
                          type="text"
                          className="palette-swatch-input"
                          value={swatch.name}
                          onChange={(e) => handleUpdateSwatch(idx, 'name', e.target.value)}
                          placeholder="Color name"
                          aria-label="Token name"
                        />
                        <input
                          type="text"
                          className="palette-swatch-input"
                          value={swatch.role}
                          onChange={(e) => handleUpdateSwatch(idx, 'role', e.target.value)}
                          placeholder="Role (e.g. Primary)"
                          aria-label="Token role"
                        />
                        <button
                          type="button"
                          className="palette-swatch-delete"
                          disabled={paletteSwatches.length <= 1}
                          onClick={() => handleRemoveSwatch(idx)}
                          title="Remove swatch"
                          aria-label={`Remove swatch ${swatch.name || idx + 1}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="palette-studio__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={Plus}
                      onClick={handleAddSwatch}
                      style={{ height: '30px', fontSize: '12px' }}
                    >
                      Add color swatch
                    </Button>

                    <div className="palette-studio__presets">
                      <span className="palette-studio__presets-label">Presets:</span>
                      <button
                        type="button"
                        className="palette-studio__preset-tag"
                        onClick={() => handleApplyPreset('core')}
                      >
                        {currentBrand.brand_name} Core
                      </button>
                      <button
                        type="button"
                        className="palette-studio__preset-tag"
                        onClick={() => handleApplyPreset('earth')}
                      >
                        Warm Earth
                      </button>
                      <button
                        type="button"
                        className="palette-studio__preset-tag"
                        onClick={() => handleApplyPreset('modern')}
                      >
                        Modern Blue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paletteTab === 'paste' && (
                <div className="palette-paste-pane">
                  <textarea
                    className="palette-paste-textarea"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste comma-separated hex codes, CSS variables, JSON tokens, or Tailwind colors...&#10;&#10;Examples:&#10;#F6F1E6, #3B2418, #298EE4, #A97A32&#10;&#10;Or CSS variables:&#10;--color-cream: #F6F1E6;&#10;--color-ink: #3B2418;&#10;--color-sage: #298EE4;&#10;&#10;Or JSON:&#10;{ &quot;cream&quot;: &quot;#F6F1E6&quot;, &quot;ink&quot;: &quot;#3B2418&quot; }"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button
                      type="button"
                      variant="primary"
                      icon={Wand2}
                      onClick={handleApplyPaste}
                      style={{ height: '32px', fontSize: '12px' }}
                    >
                      Parse &amp; Apply Tokens
                    </Button>
                  </div>
                </div>
              )}

              {paletteTab === 'extract' && (
                <div className="palette-extract-pane">
                  <input
                    ref={extractInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleExtractImage(e.target.files[0])
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <div
                    className="palette-extract-dropzone"
                    onClick={() => extractInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                        handleExtractImage(e.dataTransfer.files[0])
                      }
                    }}
                  >
                    <Pipette size={24} style={{ color: 'var(--sage)' }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                      Drop any moodboard or brand image here
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      HTML5 Canvas will sample pixels and extract 4–6 prominent colors into swatches
                    </div>
                  </div>

                  {extractedThumb && (
                    <div className="palette-extract-preview">
                      <img src={extractedThumb} alt="Extracted source" className="palette-extract-thumb" />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '12px', display: 'block', color: 'var(--ink)' }}>
                          Colors Extracted
                        </strong>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          {paletteSwatches.map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                background: s.hex,
                                display: 'inline-block',
                                border: '1px solid rgba(0,0,0,0.1)',
                              }}
                              title={`${s.name}: ${s.hex}`}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setPaletteTab('builder')}
                        style={{ height: '28px', fontSize: '11px' }}
                      >
                        Edit swatches
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Live Preview Plate */}
              <div className="palette-live-preview-wrap">
                <div className="palette-live-preview__header">
                  <span className="palette-live-preview__title">Live Plate Preview</span>
                  <span className="palette-live-preview__meta">{paletteSwatches.length} tokens defined</span>
                </div>
                <div className="palette-live-preview">
                  <DynamicPalettePlate
                    swatches={paletteSwatches}
                    title={uploadForm.title || 'Brand Palette'}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Standard File Dropzone for Logos, Typography, Campaigns */
            <div
              className={cx('asset-dropzone', isDraggingDropzone && 'is-dragover')}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingDropzone(true)
              }}
              onDragLeave={() => setIsDraggingDropzone(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingDropzone(false)
                if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                  processFile(e.dataTransfer.files[0])
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg,.pdf,.ase,.woff,.woff2,.ttf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0])
                  }
                }}
                style={{ display: 'none' }}
              />

              {uploadFile?.dataUrl ? (
                <div className="asset-dropzone__preview" onClick={(e) => e.stopPropagation()}>
                  <img src={uploadFile.dataUrl} alt="Upload preview" />
                  <div className="asset-dropzone__filename">
                    <MiddleTruncate filename={uploadFile.name || uploadForm.title} />
                  </div>
                  <button
                    type="button"
                    className="asset-dropzone__clear-btn"
                    title="Remove file"
                    onClick={() => setUploadFile(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="asset-dropzone__icon-wrap">
                    <FileUp size={22} />
                  </div>
                  <div className="asset-dropzone__title">
                    Drag &amp; drop your file here, or <span style={{ color: 'var(--sage)' }}>browse</span>
                  </div>
                  <div className="asset-dropzone__hint">Supports SVG, PNG, JPG, WebP, PDF, ASE palettes</div>
                </>
              )}
            </div>
          )}

          <Field label="Asset Title" htmlFor="upload-title">
            <input
              id="upload-title"
              type="text"
              className="asset-form-input"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder={uploadForm.kind === 'colour' ? 'e.g. Summer Campaign Palette' : 'e.g. Autumn 2026 Hero Banner'}
              required
            />
          </Field>

          <div className="asset-form-grid">
            <Field label="Approved Usage" htmlFor="upload-usage">
              <input
                id="upload-usage"
                type="text"
                className="asset-form-input"
                value={uploadForm.usage}
                onChange={(e) => setUploadForm({ ...uploadForm, usage: e.target.value })}
                placeholder="e.g. Digital + print"
              />
            </Field>

            <Field label="Owner / Team" htmlFor="upload-owner">
              <input
                id="upload-owner"
                type="text"
                className="asset-form-input"
                value={uploadForm.owner}
                onChange={(e) => setUploadForm({ ...uploadForm, owner: e.target.value })}
                placeholder="e.g. Brand team"
              />
            </Field>
          </div>

          <Field label="Description &amp; Guidelines" htmlFor="upload-desc">
            <textarea
              id="upload-desc"
              className="asset-form-textarea"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Provide context or rules on when and how this asset should be used..."
            />
          </Field>
        </form>
      </Drawer>

      {/* Asset Details & Edit Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null)
          setIsEditing(false)
        }}
        title={isEditing ? `Edit ${selected?.title}` : selected?.title || 'Asset'}
        description={isEditing ? 'Update asset metadata, rules, or replace the artwork.' : selected?.description}
        width="620px"
        footer={
          selected ? (
            <div className="asset-drawer__actions-bar">
              <div className="asset-drawer__left-meta">
                {isEditing ? (
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => handleDeleteAsset(selected.id)}
                    style={{ color: 'var(--danger)' }}
                  >
                    Delete asset
                  </Button>
                ) : (
                  <span>
                    {selected.type} · {selected.size} · Updated {selected.updated}
                  </span>
                )}
              </div>
              <div className="asset-drawer__right-actions">
                {isEditing ? (
                  <>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" icon={Check} onClick={handleSaveEdit}>
                      Save changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" icon={Edit3} onClick={() => setIsEditing(true)}>
                      Edit asset
                    </Button>
                    <Button variant="secondary" icon={Copy} onClick={() => copy(selected.title, 'Asset reference')}>
                      Copy reference
                    </Button>
                    <Button variant="primary" icon={Download} onClick={() => handleDownload(selected)}>
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selected ? (
          isEditing ? (
            /* Edit Mode */
            <form className="asset-edit-form" onSubmit={handleSaveEdit}>
              {/* If editing color palette, provide swatch editor */}
              {editForm.kind === 'colour' ? (
                <div className="palette-studio">
                  <div className="palette-studio__header">
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Palette Swatches</strong>
                      <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: '2px 0 0' }}>
                        Modify token names, hex codes, or add new swatches
                      </p>
                    </div>
                  </div>

                  <div className="palette-builder-pane">
                    <div className="palette-swatches-header">
                      <span>Color</span>
                      <span>Hex</span>
                      <span>Token Name</span>
                      <span>Role / Usage</span>
                      <span aria-hidden="true" />
                    </div>
                    <div className="palette-swatches-list">
                    {editSwatches.map((swatch, idx) => (
                      <div key={idx} className="palette-swatch-row">
                        <div
                          className="palette-swatch-chip"
                          style={{ background: swatch.hex }}
                          title="Click to pick color"
                        >
                          <input
                            type="color"
                            value={normalizeHex(swatch.hex) || '#298EE4'}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase()
                              setEditSwatches((prev) => {
                                const next = [...prev]
                                next[idx] = { ...next[idx], hex: val }
                                return next
                              })
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          className="palette-swatch-input palette-swatch-input--hex"
                          value={swatch.hex}
                          onChange={(e) => {
                            const val = e.target.value
                            setEditSwatches((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], hex: val }
                              return next
                            })
                          }}
                          placeholder="#298EE4"
                          maxLength={7}
                        />
                        <input
                          type="text"
                          className="palette-swatch-input"
                          value={swatch.name}
                          onChange={(e) => {
                            const val = e.target.value
                            setEditSwatches((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], name: val }
                              return next
                            })
                          }}
                          placeholder="Color name"
                        />
                        <input
                          type="text"
                          className="palette-swatch-input"
                          value={swatch.role}
                          onChange={(e) => {
                            const val = e.target.value
                            setEditSwatches((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], role: val }
                              return next
                            })
                          }}
                          placeholder="Role"
                        />
                        <button
                          type="button"
                          className="palette-swatch-delete"
                          disabled={editSwatches.length <= 1}
                          onClick={() => setEditSwatches((prev) => prev.filter((_, i) => i !== idx))}
                          title="Remove swatch"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="palette-studio__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      icon={Plus}
                      onClick={() =>
                        setEditSwatches((prev) => [
                          ...prev,
                          { name: 'New Token', hex: '#298EE4', role: 'Accent' },
                        ])
                      }
                      style={{ height: '30px', fontSize: '12px' }}
                    >
                      Add color swatch
                    </Button>
                  </div>
                </div>
              </div>
              ) : (
                /* Replace file area for image assets */
                <div
                  className="asset-dropzone"
                  onClick={() => replaceInputRef.current?.click()}
                >
                  <input
                    ref={replaceInputRef}
                    type="file"
                    accept="image/*,.svg,.pdf,.ase"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0], true)
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <div className="asset-dropzone__icon-wrap">
                    <Upload size={18} />
                  </div>
                  <div className="asset-dropzone__title">Click or drop to replace asset artwork</div>
                  <div className="asset-dropzone__hint">Will update thumbnail and download file</div>
                </div>
              )}

              <Field label="Title" htmlFor="edit-title">
                <input
                  id="edit-title"
                  type="text"
                  className="asset-form-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </Field>

              <div className="asset-form-grid">
                <Field label="Category" htmlFor="edit-kind">
                  <Select
                    id="edit-kind"
                    value={editForm.kind}
                    options={categoryOptions}
                    onChange={(val) => setEditForm({ ...editForm, kind: val })}
                  />
                </Field>

                <Field label="Format / Type" htmlFor="edit-type">
                  <input
                    id="edit-type"
                    type="text"
                    className="asset-form-input"
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  />
                </Field>
              </div>

              <div className="asset-form-grid">
                <Field label="Usage Scope" htmlFor="edit-usage">
                  <input
                    id="edit-usage"
                    type="text"
                    className="asset-form-input"
                    value={editForm.usage}
                    onChange={(e) => setEditForm({ ...editForm, usage: e.target.value })}
                  />
                </Field>

                <Field label="Owner" htmlFor="edit-owner">
                  <input
                    id="edit-owner"
                    type="text"
                    className="asset-form-input"
                    value={editForm.owner}
                    onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Description &amp; Guidelines" htmlFor="edit-desc">
                <textarea
                  id="edit-desc"
                  className="asset-form-textarea"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </Field>
            </form>
          ) : (
            /* View Mode */
            <div key={selected.id} className="asset-drawer asset-drawer--animated">
              <div
                ref={drawerPreviewRef}
                className={cx('asset-drawer__preview', selected.kind === 'campaign' && 'is-campaign')}
              >
                {renderAssetPreview(selected, true, currentBrand)}
              </div>

              {/* Palette Interactive Tokens Grid & Export Bar */}
              {(selected.kind === 'colour' || (selected.swatches && selected.swatches.length > 0)) && (
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Token Swatches (Click to copy)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      {(selected.swatches || currentBrand.swatches || swatches).length} tokens
                    </span>
                  </div>

                  <div className="palette-tokens-grid">
                    {(selected.swatches || currentBrand.swatches || swatches).map((swatch, idx) => {
                      const rgb = hexToRgb(swatch.hex).str
                      return (
                        <div
                          key={`${swatch.hex}-${idx}`}
                          className="palette-token-card"
                          onClick={() => copy(swatch.hex, `${swatch.name} (${swatch.hex})`)}
                          title="Click to copy hex"
                        >
                          <div className="palette-token-chip" style={{ background: swatch.hex }}>
                            <span
                              style={{
                                background: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                fontSize: '10px',
                                padding: '2px 5px',
                                borderRadius: '3px',
                                fontWeight: 700,
                              }}
                            >
                              {swatch.hex}
                            </span>
                          </div>
                          <div className="palette-token-body">
                            <span className="palette-token-name">{swatch.name}</span>
                            <span className="palette-token-role">{swatch.role || `Token ${idx + 1}`}</span>
                            <span className="palette-token-copy">
                              <Copy size={10} /> {rgb}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="palette-export-bar" style={{ marginTop: '16px' }}>
                    <Button
                      variant="secondary"
                      icon={Code}
                      onClick={() =>
                        copy(generateCssVariables(selected.swatches || currentBrand.swatches || swatches), 'CSS variables')
                      }
                    >
                      Copy CSS (:root)
                    </Button>
                    <Button
                      variant="secondary"
                      icon={FileCode}
                      onClick={() =>
                        copy(generateTailwindConfig(selected.swatches || currentBrand.swatches || swatches), 'Tailwind config')
                      }
                    >
                      Copy Tailwind
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Copy}
                      onClick={() =>
                        copy(generateTokensJson(selected.swatches || currentBrand.swatches || swatches), 'Tokens JSON')
                      }
                    >
                      Copy JSON
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Download}
                      onClick={() => {
                        const cssContent = generateCssVariables(selected.swatches || swatches)
                        const blob = new Blob([cssContent], { type: 'text/css' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tokens.css`
                        a.click()
                        URL.revokeObjectURL(url)
                        toast('Downloaded CSS token variables.', 'good')
                      }}
                    >
                      Export .css
                    </Button>
                  </div>

                  <CodeBlock
                    filename={`${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tokens.css`}
                    language="css"
                    code={generateCssVariables(selected.swatches || swatches)}
                  />
                </div>
              )}

              <div className="asset-drawer__facts" style={{ marginTop: '16px' }}>
                <div>
                  <span>Approved</span>
                  <strong>{selected.updated || '12 Nov 2026'}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{selected.owner || 'Brand team'}</strong>
                </div>
                <div>
                  <span>Usage</span>
                  <strong>{selected.usage || 'Digital + print'}</strong>
                </div>
              </div>
              <div className="asset-drawer__note">
                <Check size={15} />
                <p>This asset is verified and governed by active brand guidelines. No stale export can drift.</p>
              </div>
            </div>
          )
        ) : null}
      </Drawer>
    </div>
  )
}
