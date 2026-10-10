/**
 * BizMate AI - Concept-Driven SVG Graphic Generator
 * Generates unique visual layouts, vector motifs, and palettes for each concept theme.
 * Implements strict XML entity escaping to guarantee error-free local file exports.
 */

import { ConceptStyle } from '../server/types/index.ts';

export interface PosterData {
  headline?: string;
  subhead?: string;
  body?: string;
  cta?: string;
  badgeText?: string;
  badgeColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5' | '1.91:1';
  conceptStyle?: ConceptStyle;
  brandName?: string;
  logoUrl?: string;
  productImageUrl?: string;
}

export function escapeXml(unsafe: string = ''): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function getCanvasDimensions(aspectRatio: string = '1:1'): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '4:5':
      return { width: 1080, height: 1350 };
    case '1.91:1':
      return { width: 1200, height: 628 };
    case '1:1':
    default:
      return { width: 1080, height: 1080 };
  }
}

export function generatePosterSVG(data: PosterData): string {
  const { width, height } = getCanvasDimensions(data.aspectRatio);
  const concept = data.conceptStyle || 'festive_heritage';
  const rawBrand = (data.brandName || 'CHAIR & APPAREL').toUpperCase();
  const rawHeadline = data.headline || 'SPECIAL ANNOUNCEMENT';
  const rawSubhead = data.subhead || 'Exclusive Limited Edition Offer';
  const rawBody = data.body || 'Discover premium handcrafted quality and festive celebration discounts.';
  const rawCta = data.cta || 'ORDER NOW ON WHATSAPP';
  const rawBadge = data.badgeText || 'SPECIAL OFFER';

  // Strict XML entity escaping to prevent any export parsing errors
  const brand = escapeXml(rawBrand);
  const headline = escapeXml(rawHeadline);
  const subhead = escapeXml(rawSubhead);
  const body = escapeXml(rawBody);
  const cta = escapeXml(rawCta);
  const badgeText = escapeXml(rawBadge);

  const cx = width / 2;

  // Uploaded Logo rendering
  const logoBlock = data.logoUrl
    ? `
  <!-- Uploaded Brand Logo Block -->
  <g transform="translate(${cx - 90}, ${height * 0.035})">
    <rect width="180" height="70" rx="14" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
    <image href="${escapeXml(data.logoUrl)}" xlink:href="${escapeXml(data.logoUrl)}" x="10" y="8" width="160" height="54" preserveAspectRatio="xMidYMid meet" />
  </g>`
    : '';

  // Uploaded Product Image Showcase Frame
  const productBlock = data.productImageUrl
    ? `
  <!-- Uploaded Product Image Showcase Frame -->
  <g transform="translate(${cx - 170}, ${height * 0.54})">
    <rect width="340" height="190" rx="16" fill="#09090b" stroke="${escapeXml(data.accentColor || '#f59e0b')}" stroke-width="3" />
    <clipPath id="prodClip_${Math.round(cx)}">
      <rect width="340" height="190" rx="16" />
    </clipPath>
    <image href="${escapeXml(data.productImageUrl)}" xlink:href="${escapeXml(data.productImageUrl)}" width="340" height="190" preserveAspectRatio="xMidYMid slice" clip-path="url(#prodClip_${Math.round(cx)})" />
  </g>`
    : '';

  // Render concept-specific artwork & layout
  switch (concept) {
    case 'neon_cyber': {
      const bg = data.backgroundColor || '#09090b';
      const cyan = '#06b6d4';
      const purple = '#8b5cf6';
      const text = data.textColor || '#ffffff';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cyan}" />
      <stop offset="100%" stop-color="${purple}" />
    </linearGradient>
    <pattern id="cyberGrid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(6,182,212,0.12)" stroke-width="1.5"/>
    </pattern>
  </defs>

  <!-- Background & Grid -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />

  <!-- Neon Tech Border -->
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="url(#cyberGlow)" stroke-width="3" rx="16" />
  <circle cx="40" cy="40" r="7" fill="${cyan}" />
  <circle cx="${width - 40}" cy="40" r="7" fill="${purple}" />
  <circle cx="40" cy="${height - 40}" r="7" fill="${purple}" />
  <circle cx="${width - 40}" cy="${height - 40}" r="7" fill="${cyan}" />

  ${logoBlock}

  <!-- Telemetry Header -->
  <text x="${cx}" y="${data.logoUrl ? height * 0.15 : height * 0.12}" font-family="monospace, sans-serif" font-size="22" font-weight="800" letter-spacing="8" fill="${cyan}" text-anchor="middle">
    // ${brand} //
  </text>

  <!-- Cyber Badge -->
  <g transform="translate(${cx - 180}, ${height * 0.18})">
    <path d="M 20 0 L 340 0 L 360 32 L 340 64 L 20 64 L 0 32 Z" fill="${cyan}" />
    <text x="180" y="40" font-family="monospace, sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
      ⚡ ${badgeText}
    </text>
  </g>

  <!-- Main Headline -->
  <text x="${cx}" y="${height * 0.40}" font-family="system-ui, sans-serif" font-size="${width < 1200 ? 52 : 68}" font-weight="900" fill="${text}" text-anchor="middle" letter-spacing="1">
    ${headline.toUpperCase()}
  </text>

  <!-- Subhead -->
  <text x="${cx}" y="${height * 0.48}" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="${cyan}" text-anchor="middle" letter-spacing="2">
    ${subhead}
  </text>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.52 : height * 0.58}" font-family="system-ui, sans-serif" font-size="22" fill="#cbd5e1" text-anchor="middle" opacity="0.9">
    ${body.slice(0, 65)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.62}" font-family="system-ui, sans-serif" font-size="22" fill="#cbd5e1" text-anchor="middle" opacity="0.9">
    ${body.slice(65, 130)}
  </text>`}

  ${productBlock}

  <!-- CTA Button -->
  <g transform="translate(${cx - 280}, ${height * 0.78})">
    <rect width="560" height="90" rx="14" fill="url(#cyberGlow)" />
    <text x="280" y="54" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'minimalist_bauhaus': {
      const bg = data.backgroundColor || '#18181b';
      const orange = '#ea580c';
      const text = data.textColor || '#ffffff';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${bg}" />

  <!-- Bauhaus Asymmetrical Geometry -->
  <rect x="${width * 0.08}" y="0" width="${width * 0.02}" height="${height}" fill="${orange}" />
  <circle cx="${width * 0.85}" cy="${height * 0.18}" r="${width * 0.12}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />

  ${logoBlock}

  <!-- Brand -->
  <text x="${width * 0.16}" y="${height * 0.14}" font-family="system-ui, sans-serif" font-size="22" font-weight="900" letter-spacing="6" fill="${text}">
    ${brand}
  </text>

  <!-- Minimalist Stamp Badge -->
  <rect x="${width * 0.16}" y="${height * 0.18}" width="280" height="48" rx="8" fill="${orange}" />
  <text x="${width * 0.16 + 140}" y="${height * 0.18 + 31}" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">
    ${badgeText}
  </text>

  <!-- Editorial Headline -->
  <text x="${width * 0.16}" y="${height * 0.38}" font-family="system-ui, sans-serif" font-size="${width < 1200 ? 52 : 64}" font-weight="900" fill="${text}" letter-spacing="-1">
    ${headline.toUpperCase()}
  </text>

  <!-- Subhead -->
  <text x="${width * 0.16}" y="${height * 0.46}" font-family="system-ui, sans-serif" font-size="26" font-weight="600" fill="${orange}">
    ${subhead}
  </text>

  <!-- Clean Rule Divider -->
  <line x1="${width * 0.16}" y1="${height * 0.51}" x2="${width * 0.88}" y2="${height * 0.51}" stroke="rgba(255,255,255,0.2)" stroke-width="2" />

  <!-- Body -->
  <text x="${width * 0.16}" y="${data.productImageUrl ? height * 0.54 : height * 0.58}" font-family="system-ui, sans-serif" font-size="22" fill="#94a3b8" font-weight="400">
    ${body.slice(0, 60)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${width * 0.16}" y="${height * 0.63}" font-family="system-ui, sans-serif" font-size="22" fill="#94a3b8" font-weight="400">
    ${body.slice(60, 125)}
  </text>`}

  ${productBlock}

  <!-- Bold Modern Button -->
  <g transform="translate(${width * 0.16}, ${height * 0.78})">
    <rect width="480" height="84" rx="8" fill="#ffffff" />
    <text x="240" y="50" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#18181b" text-anchor="middle" letter-spacing="2">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'luxury_royale': {
      const bg = data.backgroundColor || '#064e3b';
      const gold = '#fbbf24';
      const text = data.textColor || '#fffbeb';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="luxGlow" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#022c22" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#luxGlow)" />

  <!-- Filigree Double Borders -->
  <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="${gold}" stroke-width="3" />
  <rect x="62" y="62" width="${width - 124}" height="${height - 124}" fill="none" stroke="${gold}" stroke-width="1" stroke-dasharray="10 5" opacity="0.6"/>

  <!-- Corner Filigree Knots -->
  <polygon points="50,50 80,50 50,80" fill="${gold}" opacity="0.5" />
  <polygon points="${width - 50},50 ${width - 80},50 ${width - 50},80" fill="${gold}" opacity="0.5" />
  <polygon points="50,${height - 50} 80,${height - 50} 50,${height - 80}" fill="${gold}" opacity="0.5" />
  <polygon points="${width - 50},${height - 50} ${width - 80},${height - 50} ${width - 50},${height - 80}" fill="${gold}" opacity="0.5" />

  ${logoBlock}

  <!-- Brand & Crown Crest -->
  <path d="M ${cx - 24} ${height * 0.11} L ${cx} ${height * 0.08} L ${cx + 24} ${height * 0.11} L ${cx + 14} ${height * 0.14} L ${cx - 14} ${height * 0.14} Z" fill="${gold}" />
  <text x="${cx}" y="${data.logoUrl ? height * 0.17 : height * 0.19}" font-family="serif, Georgia, Times" font-size="26" font-weight="700" letter-spacing="8" fill="${gold}" text-anchor="middle">
    ${brand}
  </text>

  <!-- Royal Ribbon Badge -->
  <g transform="translate(${cx - 190}, ${height * 0.23})">
    <rect width="380" height="64" rx="4" fill="${gold}" />
    <text x="190" y="40" font-family="serif, Georgia" font-size="24" font-weight="900" fill="#022c22" text-anchor="middle" letter-spacing="3">
      👑 ${badgeText}
    </text>
  </g>

  <!-- Serif Headline -->
  <text x="${cx}" y="${height * 0.42}" font-family="serif, Georgia" font-size="${width < 1200 ? 50 : 64}" font-weight="900" fill="${text}" text-anchor="middle" letter-spacing="1">
    ${headline}
  </text>

  <!-- Subhead -->
  <text x="${cx}" y="${height * 0.49}" font-family="serif, Georgia" font-size="28" font-style="italic" fill="${gold}" text-anchor="middle">
    ${subhead}
  </text>

  <!-- Stippled Divider -->
  <line x1="${cx - 200}" y1="${height * 0.53}" x2="${cx + 200}" y2="${height * 0.53}" stroke="${gold}" stroke-width="1.5" opacity="0.7"/>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.55 : height * 0.60}" font-family="system-ui, sans-serif" font-size="22" fill="${text}" text-anchor="middle" opacity="0.9">
    ${body.slice(0, 65)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.65}" font-family="system-ui, sans-serif" font-size="22" fill="${text}" text-anchor="middle" opacity="0.9">
    ${body.slice(65, 130)}
  </text>`}

  ${productBlock}

  <!-- CTA Button -->
  <g transform="translate(${cx - 260}, ${height * 0.79})">
    <rect width="520" height="88" rx="8" fill="${gold}" />
    <text x="260" y="52" font-family="serif, Georgia" font-size="26" font-weight="900" fill="#022c22" text-anchor="middle" letter-spacing="2">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'retail_impact': {
      const red = '#b91c1c';
      const yellow = '#facc15';
      const text = '#ffffff';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Background with Speed Stripes -->
  <rect width="${width}" height="${height}" fill="${red}" />
  <polygon points="0,0 ${width * 0.4},0 0,${height * 0.6}" fill="#991b1b" opacity="0.6"/>
  <polygon points="${width},${height * 0.4} ${width},${height} ${width * 0.6},${height}" fill="#991b1b" opacity="0.6"/>

  <!-- Hazard Dashed Border -->
  <rect x="35" y="35" width="${width - 70}" height="${height - 70}" fill="none" stroke="${yellow}" stroke-width="6" stroke-dasharray="24 12" />

  ${logoBlock}

  <!-- Brand -->
  <text x="${cx}" y="${data.logoUrl ? height * 0.16 : height * 0.13}" font-family="system-ui, sans-serif" font-size="26" font-weight="900" letter-spacing="6" fill="${yellow}" text-anchor="middle">
    ${brand}
  </text>

  <!-- Big Starburst Deal Badge -->
  <g transform="translate(${cx - 200}, ${height * 0.18})">
    <rect width="400" height="74" rx="8" fill="${yellow}" stroke="#000000" stroke-width="3" />
    <text x="200" y="48" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
      💥 ${badgeText} 💥
    </text>
  </g>

  <!-- High-Energy Bold Headline -->
  <text x="${cx}" y="${height * 0.40}" font-family="system-ui, sans-serif" font-size="${width < 1200 ? 56 : 72}" font-weight="900" fill="${text}" text-anchor="middle" letter-spacing="-1">
    ${headline.toUpperCase()}
  </text>

  <!-- Subhead -->
  <text x="${cx}" y="${height * 0.48}" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="${yellow}" text-anchor="middle">
    ${subhead}
  </text>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.52 : height * 0.58}" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="${text}" text-anchor="middle">
    ${body.slice(0, 60)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.63}" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="${text}" text-anchor="middle">
    ${body.slice(60, 120)}
  </text>`}

  ${productBlock}

  <!-- Impact CTA Button -->
  <g transform="translate(${cx - 280}, ${height * 0.77})">
    <rect width="560" height="96" rx="14" fill="${yellow}" stroke="#000000" stroke-width="4" />
    <text x="280" y="60" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'artisan_organic': {
      const bg = data.backgroundColor || '#2e4a36';
      const cream = '#fef3c7';
      const sage = '#86efac';
      const text = data.textColor || '#ffffff';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Soft Botanical Earthy Canvas -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <circle cx="${width * 0.1}" cy="${height * 0.9}" r="${width * 0.2}" fill="rgba(134,239,172,0.06)" />
  <circle cx="${width * 0.9}" cy="${height * 0.1}" r="${width * 0.18}" fill="rgba(254,243,199,0.06)" />

  <!-- Organic Double Border -->
  <rect x="44" y="44" width="${width - 88}" height="${height - 88}" fill="none" stroke="${sage}" stroke-width="2.5" rx="20" />
  <rect x="56" y="56" width="${width - 112}" height="${height - 112}" fill="none" stroke="${cream}" stroke-width="1.5" stroke-dasharray="12 6" rx="14" opacity="0.6"/>

  ${logoBlock}

  <!-- Leaf Botanical Motif -->
  <g transform="translate(${cx}, ${data.logoUrl ? height * 0.15 : height * 0.11}) scale(1.2)">
    <path d="M 0 -16 Q 16 -8 0 16 Q -16 -8 0 -16 Z" fill="${sage}" />
    <line x1="0" y1="-12" x2="0" y2="14" stroke="${bg}" stroke-width="1.5" />
  </g>

  <!-- Brand -->
  <text x="${cx}" y="${data.logoUrl ? height * 0.19 : height * 0.18}" font-family="serif, Georgia, sans-serif" font-size="24" font-weight="700" letter-spacing="6" fill="${cream}" text-anchor="middle">
    ${brand}
  </text>

  <!-- Artisan Badge -->
  <g transform="translate(${cx - 170}, ${height * 0.22})">
    <rect width="340" height="58" rx="29" fill="${sage}" />
    <text x="170" y="37" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#14532d" text-anchor="middle" letter-spacing="2">
      🌿 ${badgeText} 🌿
    </text>
  </g>

  <!-- Handcrafted Headline -->
  <text x="${cx}" y="${height * 0.41}" font-family="serif, Georgia" font-size="${width < 1200 ? 50 : 64}" font-weight="900" fill="${text}" text-anchor="middle">
    ${headline}
  </text>

  <!-- Subhead -->
  <text x="${cx}" y="${height * 0.49}" font-family="serif, Georgia" font-size="28" font-style="italic" fill="${cream}" text-anchor="middle">
    ${subhead}
  </text>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.54 : height * 0.59}" font-family="system-ui, sans-serif" font-size="22" fill="#dcfce7" text-anchor="middle">
    ${body.slice(0, 65)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.64}" font-family="system-ui, sans-serif" font-size="22" fill="#dcfce7" text-anchor="middle">
    ${body.slice(65, 130)}
  </text>`}

  ${productBlock}

  <!-- Earth Tone CTA -->
  <g transform="translate(${cx - 260}, ${height * 0.78})">
    <rect width="520" height="88" rx="44" fill="${cream}" />
    <text x="260" y="53" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#14532d" text-anchor="middle" letter-spacing="1">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'tech_minimal': {
      const bg = '#0f172a';
      const blue = '#38bdf8';
      const indigo = '#6366f1';
      const text = '#f8fafc';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- Modern Tech Obsidian Canvas -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <circle cx="${cx}" cy="${height * 0.4}" r="${width * 0.35}" fill="none" stroke="rgba(56,189,248,0.08)" stroke-width="2" />
  <circle cx="${cx}" cy="${height * 0.4}" r="${width * 0.25}" fill="none" stroke="rgba(99,102,241,0.06)" stroke-width="1.5" />

  <!-- Code Bracket Corner Notches -->
  <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="${blue}" stroke-width="3" />
  <path d="M ${width - 70} 40 L ${width - 40} 40 L ${width - 40} 70" fill="none" stroke="${blue}" stroke-width="3" />
  <path d="M 40 ${height - 70} L 40 ${height - 40} L 70 ${height - 40}" fill="none" stroke="${blue}" stroke-width="3" />
  <path d="M ${width - 70} ${height - 40} L ${width - 40} ${height - 40} L ${width - 40} ${height - 70}" fill="none" stroke="${blue}" stroke-width="3" />

  ${logoBlock}

  <!-- Tech Indicator -->
  <text x="${cx}" y="${data.logoUrl ? height * 0.16 : height * 0.13}" font-family="monospace, sans-serif" font-size="20" font-weight="700" letter-spacing="4" fill="${blue}" text-anchor="middle">
    [ SYSTEM // ${brand} ]
  </text>

  <!-- Tag Pill -->
  <g transform="translate(${cx - 160}, ${height * 0.18})">
    <rect width="320" height="52" rx="26" fill="rgba(56,189,248,0.15)" stroke="${blue}" stroke-width="1.5" />
    <text x="160" y="33" font-family="monospace, sans-serif" font-size="20" font-weight="800" fill="${blue}" text-anchor="middle">
      ◆ ${badgeText}
    </text>
  </g>

  <!-- Clean Title -->
  <text x="${cx}" y="${height * 0.39}" font-family="system-ui, sans-serif" font-size="${width < 1200 ? 50 : 64}" font-weight="900" fill="${text}" text-anchor="middle" letter-spacing="-0.5">
    ${headline.toUpperCase()}
  </text>

  <!-- Subtitle -->
  <text x="${cx}" y="${height * 0.47}" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="${blue}" text-anchor="middle">
    ${subhead}
  </text>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.52 : height * 0.57}" font-family="system-ui, sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">
    ${body.slice(0, 65)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.62}" font-family="system-ui, sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">
    ${body.slice(65, 130)}
  </text>`}

  ${productBlock}

  <!-- Action Button -->
  <g transform="translate(${cx - 260}, ${height * 0.78})">
    <rect width="520" height="88" rx="14" fill="${blue}" />
    <text x="260" y="53" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'streetwear_bold': {
      const bg = '#000000';
      const lime = '#a3e635';
      const text = '#ffffff';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <!-- High Contrast Brutalist Blackout Canvas -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <rect x="0" y="0" width="${width}" height="28" fill="${lime}" />
  <rect x="0" y="${height - 28}" width="${width}" height="28" fill="${lime}" />

  ${logoBlock}

  <!-- Barcode & Brand Sticker -->
  <g transform="translate(${cx - 150}, ${data.logoUrl ? height * 0.16 : height * 0.09})">
    <!-- Faux Barcode Lines -->
    <rect x="0" y="0" width="8" height="24" fill="${lime}" />
    <rect x="14" y="0" width="4" height="24" fill="${lime}" />
    <rect x="24" y="0" width="12" height="24" fill="${lime}" />
    <rect x="42" y="0" width="6" height="24" fill="${lime}" />
    <rect x="54" y="0" width="16" height="24" fill="${lime}" />
    <rect x="76" y="0" width="8" height="24" fill="${lime}" />
    <rect x="90" y="0" width="12" height="24" fill="${lime}" />
    <text x="120" y="19" font-family="monospace, sans-serif" font-size="16" font-weight="900" fill="${lime}">
      ${brand}
    </text>
  </g>

  <!-- Acid Lime Sticker Badge -->
  <g transform="translate(${cx - 190}, ${height * 0.18})">
    <rect width="380" height="66" rx="0" fill="${lime}" transform="rotate(-1.5 190 33)" />
    <text x="190" y="43" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
      ★ ${badgeText} ★
    </text>
  </g>

  <!-- Massive Headline -->
  <text x="${cx}" y="${height * 0.40}" font-family="system-ui, sans-serif" font-size="${width < 1200 ? 54 : 70}" font-weight="900" fill="${text}" text-anchor="middle" letter-spacing="-1">
    ${headline.toUpperCase()}
  </text>

  <!-- Subhead -->
  <text x="${cx}" y="${height * 0.48}" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="${lime}" text-anchor="middle">
    ${subhead.toUpperCase()}
  </text>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.52 : height * 0.58}" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#e2e8f0" text-anchor="middle">
    ${body.slice(0, 65)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.63}" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#e2e8f0" text-anchor="middle">
    ${body.slice(65, 130)}
  </text>`}

  ${productBlock}

  <!-- Brutalist CTA Box -->
  <g transform="translate(${cx - 280}, ${height * 0.78})">
    <rect width="560" height="92" rx="0" fill="${lime}" />
    <text x="280" y="58" font-family="system-ui, sans-serif" font-size="30" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'festive_heritage':
    default: {
      const bg = data.backgroundColor || '#881337';
      const gold = '#fbbf24';
      const amber = '#f59e0b';
      const text = data.textColor || '#fffbeb';

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="festiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#4c0519" />
    </linearGradient>
  </defs>

  <!-- Rich Festive Background -->
  <rect width="${width}" height="${height}" fill="url(#festiveGrad)" />

  <!-- Zari Ornate Borders -->
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="none" stroke="${gold}" stroke-width="5" rx="16" />
  <rect x="52" y="52" width="${width - 104}" height="${height - 104}" fill="none" stroke="${gold}" stroke-width="2" stroke-dasharray="16 8" opacity="0.7"/>

  ${logoBlock}

  <!-- Festive Diya Oil Lamp Vector at Top -->
  <g transform="translate(${cx}, ${data.logoUrl ? height * 0.15 : height * 0.08}) scale(1.4)">
    <!-- Diya Base -->
    <path d="M -24 0 Q 0 16 24 0 Q 20 18 -20 18 Z" fill="${amber}" />
    <!-- Flame -->
    <path d="M 0 -22 Q -8 -6 0 0 Q 8 -6 0 -22 Z" fill="${gold}" />
    <circle cx="0" cy="-6" r="3" fill="#ffffff" />
  </g>

  <!-- Brand -->
  <text x="${cx}" y="${data.logoUrl ? height * 0.19 : height * 0.17}" font-family="system-ui, serif" font-size="26" font-weight="800" letter-spacing="6" fill="${gold}" text-anchor="middle">
    ${brand}
  </text>

  <!-- Festive Badge -->
  <g transform="translate(${cx - 180}, ${height * 0.22})">
    <rect width="360" height="70" rx="35" fill="${amber}" />
    <text x="180" y="44" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#18181b" text-anchor="middle">
      🪔 ${badgeText} 🪔
    </text>
  </g>

  <!-- Grand Festive Headline -->
  <text x="${cx}" y="${height * 0.42}" font-family="system-ui, serif" font-size="${width < 1200 ? 54 : 68}" font-weight="900" fill="${text}" text-anchor="middle">
    ${headline.toUpperCase()}
  </text>

  <!-- Subhead -->
  <text x="${cx}" y="${height * 0.50}" font-family="system-ui, sans-serif" font-size="30" font-weight="700" fill="${gold}" text-anchor="middle">
    ${subhead}
  </text>

  <!-- Body -->
  <text x="${cx}" y="${data.productImageUrl ? height * 0.55 : height * 0.60}" font-family="system-ui, sans-serif" font-size="24" fill="${text}" text-anchor="middle" opacity="0.95">
    ${body.slice(0, 65)}
  </text>
  ${data.productImageUrl ? '' : `
  <text x="${cx}" y="${height * 0.65}" font-family="system-ui, sans-serif" font-size="24" fill="${text}" text-anchor="middle" opacity="0.95">
    ${body.slice(65, 130)}
  </text>`}

  ${productBlock}

  <!-- Call to action button -->
  <g transform="translate(${cx - 280}, ${height * 0.78})">
    <rect width="560" height="92" rx="20" fill="${gold}" />
    <text x="280" y="55" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#18181b" text-anchor="middle" letter-spacing="1">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }
  }
}
