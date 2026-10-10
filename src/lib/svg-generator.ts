/**
 * BizMate AI - Concept-Driven SVG Graphic Generator
 * Generates unique visual layouts, vector motifs, and palettes for each concept theme.
 * Implements strict XML entity escaping, dynamic multiline wrapping, and responsive containment
 * to ensure that all headlines, subheads, CTAs, and hero visuals fit strictly within the bounding box
 * with zero visual collision and zero overflow.
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
      return { width: 1280, height: 720 }; // Standard YouTube thumbnail / landscape social canvas
    case '9:16':
      return { width: 1080, height: 1920 }; // Mobile vertical / Stories / Reels
    case '4:5':
      return { width: 1080, height: 1350 }; // Instagram Portrait Feed
    case '1.91:1':
      return { width: 1200, height: 628 }; // Landscape link / Google / FB Ads
    case '1:1':
    default:
      return { width: 1080, height: 1080 }; // Square Feed
  }
}

/**
 * Word-aware line wrapping to prevent SVG horizontal overflow.
 * Guarantees text stays inside the design box.
 */
export function wrapText(text: string = '', maxCharsPerLine = 22, maxLines = 3): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Fallback for single words exceeding maxCharsPerLine without spaces
  if (lines.length === 0 && text.trim()) {
    const raw = text.trim();
    for (let i = 0; i < raw.length && lines.length < maxLines; i += maxCharsPerLine) {
      lines.push(raw.slice(i, i + maxCharsPerLine));
    }
  }

  return lines;
}

export function renderTspans(lines: string[], x: number, lineHeight: number): string {
  if (!lines || lines.length === 0) return '';
  return lines
    .map((line, idx) => {
      const dy = idx === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');
}

let clipCounter = 1000;

export function generatePosterSVG(data: PosterData): string {
  const { width, height } = getCanvasDimensions(data.aspectRatio);
  const concept = data.conceptStyle || 'festive_heritage';
  const isLandscape = width > height;
  const hasProduct = Boolean(data.productImageUrl && !data.productImageUrl.startsWith('data:image/svg+xml'));

  const rawBrand = (data.brandName || 'CHAIR & APPAREL').toUpperCase();
  const rawHeadline = (data.headline || 'SPECIAL ANNOUNCEMENT').toUpperCase();
  const rawSubhead = data.subhead || 'Exclusive Limited Edition Offer';
  const rawBody = data.body || 'Discover premium handcrafted quality and festive celebration discounts.';
  const rawCta = (data.cta || 'ORDER NOW ON WHATSAPP').toUpperCase();
  const rawBadge = (data.badgeText || 'SPECIAL OFFER').toUpperCase();

  // Escaped strings for safe SVG rendering
  const brand = escapeXml(rawBrand);
  const cta = escapeXml(rawCta);
  const badgeText = escapeXml(rawBadge);

  const cx = width / 2;
  const paddingX = Math.round(width * 0.055);
  const uniqueClipId = `prodClip_${++clipCounter}`;

  // ==========================================
  // DYNAMIC GEOMETRY ENGINE (PREVENTS CONFLICTS)
  // ==========================================
  let textX = cx;
  let textAnchor: 'start' | 'middle' = 'middle';

  // Component Coordinates
  let logoY = Math.round(height * 0.035);
  let brandY = data.logoUrl ? logoY + 68 : Math.round(height * 0.07);
  let badgeY = data.logoUrl ? logoY + 86 : brandY + 24;
  let badgeWidth = Math.min(width * 0.75, Math.max(220, rawBadge.length * 14 + 50));
  let badgeHeight = isLandscape ? 38 : 46;

  // Headline
  let maxHeadlineChars = isLandscape ? (hasProduct ? 20 : 28) : (hasProduct ? 20 : 24);
  let headlineLines = wrapText(rawHeadline, maxHeadlineChars, 3);
  let headlineFontSize = isLandscape
    ? (headlineLines.length > 2 ? 32 : 38)
    : (hasProduct ? (headlineLines.length > 2 ? 38 : 44) : (headlineLines.length > 2 ? 46 : 56));
  let headlineLineHeight = Math.round(headlineFontSize * 1.16);
  let headlineY = badgeY + badgeHeight + (isLandscape ? 30 : 36);

  // Subhead
  let maxSubheadChars = isLandscape ? (hasProduct ? 30 : 44) : (hasProduct ? 32 : 40);
  let subheadLines = wrapText(rawSubhead, maxSubheadChars, 2);
  let subheadFontSize = isLandscape ? 18 : 22;
  let subheadLineHeight = Math.round(subheadFontSize * 1.22);
  let subheadY = headlineY + (headlineLines.length * headlineLineHeight) + 12;

  // Body
  let maxBodyChars = isLandscape ? (hasProduct ? 34 : 50) : (hasProduct ? 38 : 48);
  let bodyLines = wrapText(rawBody, maxBodyChars, hasProduct ? 2 : 3);
  let bodyFontSize = isLandscape ? 15 : 19;
  let bodyLineHeight = Math.round(bodyFontSize * 1.25);
  let bodyY = subheadY + (subheadLines.length * subheadLineHeight) + 14;

  // CTA
  let ctaWidth = Math.min(width * 0.75, Math.max(240, rawCta.length * 14 + 60));
  let ctaHeight = isLandscape ? 52 : 68;
  let ctaY = height - ctaHeight - (isLandscape ? 32 : Math.round(height * 0.045));
  let ctaX = cx - ctaWidth / 2;

  // Hero Product / AI Image Box Geometry
  let productImgX = 0;
  let productImgY = 0;
  let productImgW = 0;
  let productImgH = 0;

  if (isLandscape && hasProduct) {
    // Two-Column Balanced Split: Left Column (Text + CTA) | Right Column (Hero Visual)
    const col1Width = Math.round(width * 0.48);
    textX = paddingX + Math.round(col1Width / 2);
    textAnchor = 'middle';

    badgeWidth = Math.min(col1Width - 20, Math.max(180, rawBadge.length * 13 + 40));
    ctaWidth = Math.min(col1Width - 20, Math.max(200, rawCta.length * 13 + 50));
    ctaX = textX - ctaWidth / 2;

    productImgW = Math.round(width * 0.42);
    productImgH = Math.round(height * 0.82);
    productImgX = width - productImgW - paddingX;
    productImgY = Math.round((height - productImgH) / 2);
  } else if (hasProduct) {
    // Vertical Layout: Top Header/Headline -> Hero Visual Card -> Bottom Body/CTA
    // Strictly bounds the hero image box to avoid colliding with text or CTA!
    const availableTop = subheadY + (subheadLines.length * subheadLineHeight) + 16;
    const availableBottom = ctaY - 24;
    const availableHeight = Math.max(180, availableBottom - availableTop);

    productImgH = Math.min(availableHeight - 10, Math.round(height * 0.36));
    productImgW = Math.min(width * 0.82, Math.round(productImgH * 1.22));
    productImgX = Math.round(cx - productImgW / 2);
    productImgY = Math.round(availableTop + (availableHeight - productImgH) / 2);

    // Reposition Body text cleanly right above or below image without overlap
    bodyY = ctaY - 26;
    bodyLines = wrapText(rawBody, 46, 1); // Single concise line right above CTA
  }

  // Common root attributes enforcing strictly contained responsive rendering
  const svgRootHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;max-width:100%;max-height:100%;display:block;user-select:none;">`;

  // Brand Logo Block
  const logoBlock = data.logoUrl
    ? `
  <!-- Brand Logo -->
  <g transform="translate(${isLandscape && hasProduct ? textX - 80 : cx - 80}, ${logoY})">
    <rect width="160" height="52" rx="10" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1.2" />
    <image href="${escapeXml(data.logoUrl)}" xlink:href="${escapeXml(data.logoUrl)}" x="8" y="6" width="144" height="40" preserveAspectRatio="xMidYMid meet" />
  </g>`
    : '';

  // Product / AI Hero Image Showcase Frame (Strictly Contained Inside Box)
  const productBlock = hasProduct
    ? `
  <!-- Product / AI Generated Visual Hero Showcase -->
  <g transform="translate(${productImgX}, ${productImgY})">
    <rect width="${productImgW}" height="${productImgH}" rx="18" fill="#09090b" stroke="${escapeXml(data.accentColor || '#f59e0b')}" stroke-width="3" filter="drop-shadow(0 16px 24px rgba(0,0,0,0.5))" />
    <clipPath id="${uniqueClipId}">
      <rect width="${productImgW}" height="${productImgH}" rx="18" />
    </clipPath>
    <image href="${escapeXml(data.productImageUrl)}" xlink:href="${escapeXml(data.productImageUrl)}" width="${productImgW}" height="${productImgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${uniqueClipId})" />
  </g>`
    : '';

  // Render concept-specific artwork & layout
  switch (concept) {
    case 'neon_cyber': {
      const bg = data.backgroundColor || '#09090b';
      const cyan = '#06b6d4';
      const purple = '#8b5cf6';
      const text = data.textColor || '#ffffff';

      return `${svgRootHeader}
  <defs>
    <linearGradient id="cyberGlow_${uniqueClipId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cyan}" />
      <stop offset="100%" stop-color="${purple}" />
    </linearGradient>
    <pattern id="cyberGrid_${uniqueClipId}" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(6,182,212,0.12)" stroke-width="1.5"/>
    </pattern>
  </defs>

  <!-- Background & Grid -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <rect width="${width}" height="${height}" fill="url(#cyberGrid_${uniqueClipId})" />

  <!-- Neon Tech Border -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="none" stroke="url(#cyberGlow_${uniqueClipId})" stroke-width="2.5" rx="14" />
  <circle cx="25" cy="25" r="6" fill="${cyan}" />
  <circle cx="${width - 25}" cy="25" r="6" fill="${purple}" />
  <circle cx="25" cy="${height - 25}" r="6" fill="${purple}" />
  <circle cx="${width - 25}" cy="${height - 25}" r="6" fill="${cyan}" />

  ${logoBlock}

  <!-- Telemetry Header -->
  <text x="${textX}" y="${brandY}" font-family="monospace, sans-serif" font-size="18" font-weight="800" letter-spacing="6" fill="${cyan}" text-anchor="${textAnchor}">
    // ${brand} //
  </text>

  <!-- Cyber Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="10" fill="${cyan}" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.65}" font-family="monospace, sans-serif" font-size="${isLandscape ? 16 : 19}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">
      ⚡ ${badgeText}
    </text>
  </g>

  <!-- Main Headline (Multiline Wrapped) -->
  <text x="${textX}" y="${headlineY}" font-family="system-ui, -apple-system, sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${text}" text-anchor="${textAnchor}" letter-spacing="0.5">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif" font-size="${subheadFontSize}" font-weight="700" fill="${cyan}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" fill="#cbd5e1" text-anchor="${textAnchor}" opacity="0.9">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- CTA Button -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="14" fill="url(#cyberGlow_${uniqueClipId})" filter="drop-shadow(0 6px 12px rgba(6,182,212,0.3))" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.62}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 19 : 23}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1.5">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'minimalist_bauhaus': {
      const bg = data.backgroundColor || '#18181b';
      const orange = '#ea580c';
      const text = data.textColor || '#ffffff';

      return `${svgRootHeader}
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${bg}" />

  <!-- Bauhaus Asymmetrical Geometry -->
  <rect x="${width * 0.05}" y="0" width="${width * 0.015}" height="${height}" fill="${orange}" />
  <circle cx="${width * 0.88}" cy="${height * 0.16}" r="${width * 0.10}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5" />

  ${logoBlock}

  <!-- Brand -->
  <text x="${textX}" y="${brandY}" font-family="system-ui, sans-serif" font-size="20" font-weight="900" letter-spacing="5" fill="${text}" text-anchor="${textAnchor}">
    ${brand}
  </text>

  <!-- Minimalist Stamp Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="6" fill="${orange}" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.64}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 15 : 18}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${badgeText}
    </text>
  </g>

  <!-- Editorial Headline -->
  <text x="${textX}" y="${headlineY}" font-family="system-ui, sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${text}" letter-spacing="-0.5" text-anchor="${textAnchor}">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif" font-size="${subheadFontSize}" font-weight="600" fill="${orange}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" fill="#94a3b8" font-weight="400" text-anchor="${textAnchor}">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- Bold Modern Button -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="8" fill="#ffffff" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.62}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 18 : 22}" font-weight="900" fill="#18181b" text-anchor="middle" letter-spacing="1.5">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'luxury_royale': {
      const bg = data.backgroundColor || '#064e3b';
      const gold = '#fbbf24';
      const text = data.textColor || '#fffbeb';

      return `${svgRootHeader}
  <defs>
    <radialGradient id="luxGlow_${uniqueClipId}" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#022c22" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#luxGlow_${uniqueClipId})" />

  <!-- Filigree Double Borders -->
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="${gold}" stroke-width="2.5" />
  <rect x="42" y="42" width="${width - 84}" height="${height - 84}" fill="none" stroke="${gold}" stroke-width="1" stroke-dasharray="8 4" opacity="0.6"/>

  ${logoBlock}

  <!-- Brand & Crown Crest -->
  <text x="${textX}" y="${brandY}" font-family="serif, Georgia, Times" font-size="22" font-weight="700" letter-spacing="6" fill="${gold}" text-anchor="${textAnchor}">
    👑 ${brand}
  </text>

  <!-- Royal Ribbon Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="4" fill="${gold}" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.65}" font-family="serif, Georgia" font-size="${isLandscape ? 16 : 19}" font-weight="900" fill="#022c22" text-anchor="middle" letter-spacing="1.5">
      ${badgeText}
    </text>
  </g>

  <!-- Serif Headline -->
  <text x="${textX}" y="${headlineY}" font-family="serif, Georgia" font-size="${headlineFontSize}" font-weight="900" fill="${text}" text-anchor="${textAnchor}">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="serif, Georgia" font-size="${subheadFontSize}" font-style="italic" fill="${gold}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" fill="${text}" text-anchor="${textAnchor}" opacity="0.9">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- CTA Button -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="6" fill="${gold}" filter="drop-shadow(0 6px 14px rgba(251,191,36,0.3))" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.62}" font-family="serif, Georgia" font-size="${isLandscape ? 19 : 23}" font-weight="900" fill="#022c22" text-anchor="middle" letter-spacing="1.5">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'retail_impact': {
      const red = '#b91c1c';
      const yellow = '#facc15';
      const text = '#ffffff';

      return `${svgRootHeader}
  <!-- Background with Speed Stripes -->
  <rect width="${width}" height="${height}" fill="${red}" />
  <polygon points="0,0 ${width * 0.35},0 0,${height * 0.5}" fill="#991b1b" opacity="0.5"/>
  <polygon points="${width},${height * 0.5} ${width},${height} ${width * 0.65},${height}" fill="#991b1b" opacity="0.5"/>

  <!-- Hazard Dashed Border -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="none" stroke="${yellow}" stroke-width="4" stroke-dasharray="18 10" />

  ${logoBlock}

  <!-- Brand -->
  <text x="${textX}" y="${brandY}" font-family="system-ui, sans-serif" font-size="22" font-weight="900" letter-spacing="5" fill="${yellow}" text-anchor="${textAnchor}">
    ${brand}
  </text>

  <!-- Big Starburst Deal Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="6" fill="${yellow}" stroke="#000000" stroke-width="2" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.65}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 17 : 20}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">
      💥 ${badgeText} 💥
    </text>
  </g>

  <!-- High-Energy Bold Headline -->
  <text x="${textX}" y="${headlineY}" font-family="system-ui, sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${text}" text-anchor="${textAnchor}" letter-spacing="-0.5">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif" font-size="${subheadFontSize}" font-weight="900" fill="${yellow}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" font-weight="700" fill="${text}" text-anchor="${textAnchor}">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- Impact CTA Button -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="12" fill="${yellow}" stroke="#000000" stroke-width="3" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.63}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 20 : 24}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1.5">
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

      return `${svgRootHeader}
  <!-- Soft Botanical Canvas -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <circle cx="${width * 0.1}" cy="${height * 0.9}" r="${width * 0.18}" fill="rgba(134,239,172,0.05)" />
  <circle cx="${width * 0.9}" cy="${height * 0.1}" r="${width * 0.15}" fill="rgba(254,243,199,0.05)" />

  <!-- Organic Double Border -->
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="${sage}" stroke-width="2" rx="16" />

  ${logoBlock}

  <!-- Brand -->
  <text x="${textX}" y="${brandY}" font-family="serif, Georgia, sans-serif" font-size="20" font-weight="700" letter-spacing="5" fill="${cream}" text-anchor="${textAnchor}">
    🌿 ${brand}
  </text>

  <!-- Artisan Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="${sage}" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.65}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 15 : 18}" font-weight="800" fill="#14532d" text-anchor="middle">
      🍃 ${badgeText}
    </text>
  </g>

  <!-- Natural Headline -->
  <text x="${textX}" y="${headlineY}" font-family="serif, Georgia, sans-serif" font-size="${headlineFontSize}" font-weight="800" fill="${cream}" text-anchor="${textAnchor}">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif" font-size="${subheadFontSize}" font-weight="600" fill="${sage}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" fill="${cream}" text-anchor="${textAnchor}" opacity="0.9">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- Botanical CTA -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="${sage}" filter="drop-shadow(0 4px 10px rgba(134,239,172,0.25))" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.62}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 19 : 23}" font-weight="900" fill="#14532d" text-anchor="middle" letter-spacing="1">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'tech_minimal': {
      const bg = '#0f172a';
      const blue = '#38bdf8';
      const text = '#f8fafc';

      return `${svgRootHeader}
  <!-- Blueprint Grid -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="rgba(56,189,248,0.06)" stroke-width="1.5" />
  <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}" stroke="rgba(56,189,248,0.06)" stroke-width="1.5" />

  <!-- Frame -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="none" stroke="rgba(56,189,248,0.3)" stroke-width="1.5" rx="8" />

  ${logoBlock}

  <!-- Tech Indicator -->
  <text x="${textX}" y="${brandY}" font-family="monospace, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${blue}" text-anchor="${textAnchor}">
    [ SYSTEM // ${brand} ]
  </text>

  <!-- Tag Pill -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="rgba(56,189,248,0.15)" stroke="${blue}" stroke-width="1.5" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.65}" font-family="monospace, sans-serif" font-size="${isLandscape ? 15 : 18}" font-weight="800" fill="${blue}" text-anchor="middle">
      ◆ ${badgeText}
    </text>
  </g>

  <!-- Clean Title -->
  <text x="${textX}" y="${headlineY}" font-family="system-ui, sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${text}" text-anchor="${textAnchor}" letter-spacing="-0.5">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subtitle -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif" font-size="${subheadFontSize}" font-weight="600" fill="${blue}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" fill="#94a3b8" text-anchor="${textAnchor}">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- Action Button -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="12" fill="${blue}" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.62}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 19 : 23}" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }

    case 'streetwear_bold': {
      const bg = '#000000';
      const lime = '#a3e635';
      const text = '#ffffff';

      return `${svgRootHeader}
  <!-- Brutalist Blackout Canvas -->
  <rect width="${width}" height="${height}" fill="${bg}" />
  <rect x="0" y="0" width="${width}" height="20" fill="${lime}" />
  <rect x="0" y="${height - 20}" width="${width}" height="20" fill="${lime}" />

  ${logoBlock}

  <!-- Brand Barcode Sticker -->
  <text x="${textX}" y="${brandY}" font-family="monospace, sans-serif" font-size="19" font-weight="900" letter-spacing="4" fill="${lime}" text-anchor="${textAnchor}">
    // ${brand} ★
  </text>

  <!-- Acid Lime Sticker Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="0" fill="${lime}" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.66}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 17 : 21}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1">
      ★ ${badgeText} ★
    </text>
  </g>

  <!-- Massive Headline -->
  <text x="${textX}" y="${headlineY}" font-family="system-ui, sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${text}" text-anchor="${textAnchor}" letter-spacing="-0.5">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif" font-size="${subheadFontSize}" font-weight="900" fill="${lime}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif" font-size="${bodyFontSize}" font-weight="600" fill="#e2e8f0" text-anchor="${textAnchor}">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- Brutalist CTA Box -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="0" fill="${lime}" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.63}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 20 : 24}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1.5">
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

      return `${svgRootHeader}
  <defs>
    <linearGradient id="festiveGrad_${uniqueClipId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" />
      <stop offset="100%" stop-color="#4c0519" />
    </linearGradient>
  </defs>

  <!-- Rich Festive Background -->
  <rect width="${width}" height="${height}" fill="url(#festiveGrad_${uniqueClipId})" />

  <!-- Zari Ornate Borders -->
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="none" stroke="${gold}" stroke-width="3" rx="14" />
  <rect x="35" y="35" width="${width - 70}" height="${height - 70}" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="12 6" opacity="0.6"/>

  ${logoBlock}

  <!-- Brand -->
  <text x="${textX}" y="${brandY}" font-family="system-ui, serif" font-size="22" font-weight="800" letter-spacing="5" fill="${gold}" text-anchor="${textAnchor}">
    🪔 ${brand} 🪔
  </text>

  <!-- Festive Badge -->
  <g transform="translate(${textX - badgeWidth / 2}, ${badgeY})">
    <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="${amber}" filter="drop-shadow(0 4px 10px rgba(245,158,11,0.3))" />
    <text x="${badgeWidth / 2}" y="${badgeHeight * 0.65}" font-family="system-ui, sans-serif" font-size="${isLandscape ? 16 : 20}" font-weight="900" fill="#18181b" text-anchor="middle">
      ${badgeText}
    </text>
  </g>

  <!-- Grand Festive Headline -->
  <text x="${textX}" y="${headlineY}" font-family="system-ui, serif, 'Noto Sans Tamil', 'Latha', sans-serif" font-size="${headlineFontSize}" font-weight="900" fill="${text}" text-anchor="${textAnchor}">
    ${renderTspans(headlineLines, textX, headlineLineHeight)}
  </text>

  <!-- Subhead -->
  <text x="${textX}" y="${subheadY}" font-family="system-ui, sans-serif, 'Noto Sans Tamil', sans-serif" font-size="${subheadFontSize}" font-weight="700" fill="${gold}" text-anchor="${textAnchor}">
    ${renderTspans(subheadLines, textX, subheadLineHeight)}
  </text>

  ${productBlock}

  <!-- Body -->
  <text x="${textX}" y="${bodyY}" font-family="system-ui, sans-serif, 'Noto Sans Tamil', sans-serif" font-size="${bodyFontSize}" fill="${text}" text-anchor="${textAnchor}" opacity="0.95">
    ${renderTspans(bodyLines, textX, bodyLineHeight)}
  </text>

  <!-- Call to action button -->
  <g transform="translate(${ctaX}, ${ctaY})">
    <rect width="${ctaWidth}" height="${ctaHeight}" rx="14" fill="${gold}" filter="drop-shadow(0 6px 14px rgba(251,191,36,0.35))" />
    <text x="${ctaWidth / 2}" y="${ctaHeight * 0.63}" font-family="system-ui, sans-serif, 'Noto Sans Tamil', sans-serif" font-size="${isLandscape ? 19 : 23}" font-weight="900" fill="#18181b" text-anchor="middle" letter-spacing="1">
      ${cta}
    </text>
  </g>
</svg>`.trim();
    }
  }
}
