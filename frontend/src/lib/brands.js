export const DEFAULT_BRANDS = [
  {
    id: 1,
    name: 'Aster & Oak',
    brand_name: 'Aster & Oak',
    code: 'KLARITY-2026',
    brand_code: 'KLARITY-2026',
    mark: 'A&O',
    color: '#298EE4',
    tagline: 'Sustainable Luxury & Craft',
    values: 'Authenticity, craft, sustainability, quiet confidence',
    displayFont: 'Bricolage Grotesque',
    bodyFont: 'Manrope',
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
    id: 2,
    name: 'Nova Athletics',
    brand_name: 'Nova Athletics',
    code: 'NOVA-4821',
    brand_code: 'NOVA-4821',
    mark: 'NA',
    color: '#E11D48',
    tagline: 'High-Performance Activewear',
    values: 'Performance, innovation, bold energy, inclusivity',
    displayFont: 'Clash Display',
    bodyFont: 'Inter',
    swatches: [
      { name: 'Crimson Red', hex: '#E11D48', role: 'Primary Accent' },
      { name: 'Carbon Black', hex: '#0F172A', role: 'Text / Ink' },
      { name: 'Signal Orange', hex: '#F97316', role: 'Highlight' },
      { name: 'Cool Slate', hex: '#64748B', role: 'Secondary' },
      { name: 'Pure White', hex: '#FFFFFF', role: 'Surface' },
      { name: 'Frost Mist', hex: '#F1F5F9', role: 'Background' },
    ],
  },
  {
    id: 3,
    name: 'Ember & Ivy',
    brand_name: 'Ember & Ivy',
    code: 'EMBER-7390',
    brand_code: 'EMBER-7390',
    mark: 'E&I',
    color: '#D97706',
    tagline: 'Artisanal Home & Botanicals',
    values: 'Warmth, heritage, natural elegance, timeless design',
    displayFont: 'Playfair Display',
    bodyFont: 'Plus Jakarta Sans',
    swatches: [
      { name: 'Warm Amber', hex: '#D97706', role: 'Primary Accent' },
      { name: 'Forest Ivy', hex: '#166534', role: 'Secondary' },
      { name: 'Espresso Wood', hex: '#352014', role: 'Text / Ink' },
      { name: 'Parchment', hex: '#FEF3C7', role: 'Background' },
      { name: 'Terracotta', hex: '#B45309', role: 'Warm Surface' },
      { name: 'Soft Cream', hex: '#FFFBEB', role: 'Highlight' },
    ],
  },
  {
    id: 4,
    name: 'Solaris Media',
    brand_name: 'Solaris Media',
    code: 'SOLAR-5147',
    brand_code: 'SOLAR-5147',
    mark: 'SM',
    color: '#8B5CF6',
    tagline: 'Next-Gen Digital Media Studio',
    values: 'Transparency, creativity, digital-first storytelling, community',
    displayFont: 'Syne',
    bodyFont: 'Space Grotesk',
    swatches: [
      { name: 'Neon Violet', hex: '#8B5CF6', role: 'Primary Accent' },
      { name: 'Cyber Cyan', hex: '#06B6D4', role: 'Highlight' },
      { name: 'Midnight Abyss', hex: '#09090B', role: 'Text / Ink' },
      { name: 'Electric Indigo', hex: '#6366F1', role: 'Secondary' },
      { name: 'Deep Slate', hex: '#1E1B4B', role: 'Dark Surface' },
      { name: 'Starlight White', hex: '#F8FAFC', role: 'Surface' },
    ],
  },
  {
    id: 5,
    name: 'Velvet Thread',
    brand_name: 'Velvet Thread',
    code: 'VELVET-6283',
    brand_code: 'VELVET-6283',
    mark: 'VT',
    color: '#059669',
    tagline: 'Modern Tailoring & Haute Couture',
    values: 'Luxury, precision, modern minimalism, artisan quality',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Satoshi',
    swatches: [
      { name: 'Emerald Green', hex: '#059669', role: 'Primary Accent' },
      { name: 'Gold Luster', hex: '#D4AF37', role: 'Highlight' },
      { name: 'Velvet Obsidian', hex: '#111827', role: 'Text / Ink' },
      { name: 'Champagne Cream', hex: '#FDFBF7', role: 'Background' },
      { name: 'Silk Taupe', hex: '#78716C', role: 'Secondary' },
      { name: 'Pearl White', hex: '#F9FAFB', role: 'Surface' },
    ],
  },
]

export function getBrandAssets(brand) {
  const brandName = brand.brand_name || brand.name || 'Aster & Oak'
  const brandCode = brand.brand_code || brand.code || 'KLARITY-2026'
  const mark = brand.mark || brandName.slice(0, 2).toUpperCase()
  const displayFont = brand.displayFont || 'Bricolage Grotesque'
  const bodyFont = brand.bodyFont || 'Manrope'

  return [
    {
      id: `logo-primary-${brand.id || 1}`,
      title: `${brandName} Primary Lockup`,
      kind: 'logos',
      type: 'SVG',
      size: '18 KB',
      updated: 'Today',
      owner: `${brandName} Design`,
      usage: 'Digital and print',
      description: `Official primary wordmark lockup for ${brandName}. Verified under Brand Code ${brandCode}.`,
      plateType: 'logo-primary',
    },
    {
      id: `logo-mono-${brand.id || 1}`,
      title: `${brandName} Monogram (${mark})`,
      kind: 'logos',
      type: 'SVG',
      size: '9 KB',
      updated: 'Today',
      owner: `${brandName} Design`,
      usage: 'Digital only',
      description: `Digital mark and avatar monogram for ${brandName}.`,
      plateType: 'logo-mono',
    },
    {
      id: `palette-${brand.id || 1}`,
      title: `${brandName} Core Palette`,
      kind: 'colour',
      type: 'Design tokens',
      size: `${(brand.swatches || []).length || 6} tokens`,
      updated: 'Today',
      owner: 'Design tokens ops',
      usage: 'Web, product, marketing',
      description: `Production CSS & Tailwind color tokens for ${brandName}.`,
      plateType: 'palette',
      swatches: brand.swatches || [],
    },
    {
      id: `type-${brand.id || 1}`,
      title: `${brandName} Typography Spec`,
      kind: 'typography',
      type: 'Font specimen',
      size: '2 families',
      updated: 'Today',
      owner: 'Typography team',
      usage: 'Digital products & brand editorial',
      description: `Display font ${displayFont} paired with body font ${bodyFont}.`,
      plateType: 'type',
    },
    {
      id: `campaign-${brand.id || 1}`,
      title: `${brandName} Hero Creative Plate`,
      kind: 'campaign',
      type: 'SVG artboard',
      size: '64 KB',
      updated: 'Today',
      owner: 'Creative ops',
      usage: 'Campaign hero & social',
      description: `Signature brand artboard and editorial graphic for ${brandName}.`,
      plateType: 'campaign-1',
    },
    {
      id: `social-${brand.id || 1}`,
      title: `${brandName} Social Story Template`,
      kind: 'campaign',
      type: 'SVG template',
      size: '36 KB',
      updated: 'Today',
      owner: 'Social team',
      usage: 'Instagram, LinkedIn & TikTok',
      description: `Official social story template with ${brandName} brand watermark.`,
      plateType: 'social',
    },
  ]
}

export function createDefaultBrand(name = 'My Brand', values = '', code = '') {
  const brandName = (name || 'My Brand').trim()
  const words = brandName.split(/\s+/).filter(Boolean)
  const mark =
    words.length > 1
      ? words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
      : brandName.slice(0, 2).toUpperCase() || 'MB'
  const brandCode =
    code ||
    `${brandName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'BRAND'}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`

  return {
    id: `custom-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: brandName,
    brand_name: brandName,
    code: brandCode,
    brand_code: brandCode,
    mark: mark,
    color: '#298EE4',
    tagline: 'Brand Identity & Standards',
    values: values || 'Authenticity, craft, excellence, quiet confidence',
    brand_values: values || 'Authenticity, craft, excellence, quiet confidence',
    displayFont: 'Bricolage Grotesque',
    bodyFont: 'Manrope',
    swatches: [],
  }
}

