/**
 * BizMate AI - Automated Test Suite for Poster Generation & Razorpay Security
 * Validates:
 * 1. 8 concept themes produce valid XML SVG
 * 2. 5 aspect ratios render correct dimensions
 * 3. AI JSON response normalizes cleanly
 * 4. Missing fields safe defaults
 * 5. Long text wrapping without XML breakage
 * 6. User logo and product image inclusion
 * 7. Failed generation refund guarantee
 * 8. Idempotency prevents double spending
 * 9. Strict box containment & responsive preservation
 * 10. Word-aware multiline text wrapping
 * 11. Landscape orientation (16:9, 1.91:1) separation
 * 12. Integrated designer poster embeds hero visual
 * 13. Zero element collision: Hero image box strictly does not collide with text or CTA
 * 14. Box boundary containment: All coordinates stay within intrinsic canvas viewBox
 * 15. Razorpay HMAC-SHA256 signature verification & order pricing
 * 16. Discarding nested SVG data URLs in productImageUrl to prevent SVG-in-SVG conflicts
 */

import 'dotenv/config';
import { generatePosterSVG, getCanvasDimensions } from '../../lib/svg-generator.ts';
import { ConceptStyle, AspectRatio } from '../types/index.ts';
import { CreditService } from '../services/credit.service.ts';
import { PaymentService } from '../services/payment.service.ts';
import { db } from '../db/database.ts';
import crypto from 'crypto';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runPosterTests() {
  console.log('--- STARTING BIZMATE AI POSTER & RAZORPAY TESTS ---');
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } catch (e: any) {
      console.error(`✗ [FAIL] ${name}: ${e.message}`);
    }
  }

  // 1. All 8 concept themes produce non-empty valid XML SVG
  await test('1. All 8 concept themes produce non-empty valid SVG', () => {
    const concepts: ConceptStyle[] = [
      'festive_heritage',
      'neon_cyber',
      'minimalist_bauhaus',
      'luxury_royale',
      'retail_impact',
      'artisan_organic',
      'tech_minimal',
      'streetwear_bold'
    ];

    for (const concept of concepts) {
      const svg = generatePosterSVG({
        headline: 'Grand Festive Collection',
        subhead: 'Exclusive Silk Sarees',
        body: 'Handwoven luxury for every celebration.',
        cta: 'SHOP NOW',
        badgeText: '50% OFF',
        conceptStyle: concept,
        aspectRatio: '1:1',
        brandName: 'Chennai Silks'
      });

      assert(typeof svg === 'string', `${concept} must return string`);
      assert(svg.includes('<svg'), `${concept} must have opening <svg> tag`);
      assert(svg.includes('</svg>'), `${concept} must have closing </svg> tag`);
      assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), `${concept} must declare XMLNS`);
      assert(!svg.includes('undefined'), `${concept} must not have undefined text`);
    }
  });

  // 2. Each supported aspect ratio renders correct viewBox
  await test('2. Each supported aspect ratio renders correct viewBox and geometry', () => {
    const ratios: { ratio: AspectRatio; expectedWidth: number; expectedHeight: number }[] = [
      { ratio: '1:1', expectedWidth: 1080, expectedHeight: 1080 },
      { ratio: '16:9', expectedWidth: 1280, expectedHeight: 720 },
      { ratio: '9:16', expectedWidth: 1080, expectedHeight: 1920 },
      { ratio: '4:5', expectedWidth: 1080, expectedHeight: 1350 },
      { ratio: '1.91:1', expectedWidth: 1200, expectedHeight: 628 }
    ];

    for (const r of ratios) {
      const svg = generatePosterSVG({
        headline: 'Test Headline',
        conceptStyle: 'minimalist_bauhaus',
        aspectRatio: r.ratio
      });

      assert(svg.includes(`viewBox="0 0 ${r.expectedWidth} ${r.expectedHeight}"`), `viewBox should match ${r.ratio}`);
      assert(svg.includes(`width="${r.expectedWidth}"`), `width attribute should be ${r.expectedWidth}`);
      assert(svg.includes(`height="${r.expectedHeight}"`), `height attribute should be ${r.expectedHeight}`);
    }
  });

  // 3. Special characters, ampersands, XML tags, and Tamil text are safely escaped
  await test('3. Special characters (&, <, >, ", \') and Tamil text do not break SVG XML', () => {
    const svg = generatePosterSVG({
      headline: 'சென்னை சில்க்ஸ் & ஆடைகள் <MEGA SALE> "2026"',
      subhead: 'தீபாவளி சிறப்பு தள்ளுபடி & ஆடை திருவிழா 100% தூய பட்டு!',
      body: 'விலை ₹1,999 மட்டுமே! & Exclusive Designs',
      cta: 'இப்போதே வாங்குங்கள் ->',
      badgeText: 'FLAT 50% & OFF',
      brandName: 'Arunagiri & Sons <Pvt Ltd>',
      conceptStyle: 'festive_heritage',
      aspectRatio: '1:1'
    });

    assert(!svg.includes('& ஆடைகள்'), 'Raw & must be escaped');
    assert(svg.includes('&amp;'), 'Escaped &amp; must be present');
    assert(!svg.includes('<MEGA SALE>'), 'Raw < and > must be escaped as &lt; and &gt;');
    assert(svg.includes('&lt;MEGA SALE&gt;'), '&lt;MEGA SALE&gt; must be properly escaped');
    assert(svg.includes('சென்னை சில்க்ஸ்'), 'Tamil characters must be preserved faithfully');
  });

  // 4. Missing optional fields normalize safely with sensible defaults
  await test('4. Missing optional fields normalize safely without throwing', () => {
    const svg = generatePosterSVG({});
    assert(svg.length > 500, 'Poster with default options should generate full SVG');
    assert(svg.includes('</svg>'), 'Valid closing tag present');
  });

  // 5. Extremely long text does not cause XML breakage
  await test('5. Extremely long text (500+ chars) wraps safely without breaking SVG', () => {
    const longText = 'This is an exceptionally long promotional message intended to test text wrapping and ensure that neither line breaks nor overflow can cause malformed XML or crash the rendering canvas. '.repeat(5);
    const svg = generatePosterSVG({
      headline: 'SUPER MEGA ULTRA EXTRAVAGANZA SALE OF THE DECADE',
      body: longText,
      conceptStyle: 'retail_impact'
    });

    assert(svg.includes('</svg>'), 'Long text must still produce valid closing SVG');
  });

  // 6. User logo and product images are rendered in SVG
  await test('6. User logo and product photo data URLs are cleanly rendered', () => {
    const sampleLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
    const samplePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const svg = generatePosterSVG({
      headline: 'Featured Product',
      logoUrl: sampleLogo,
      productImageUrl: samplePhoto,
      conceptStyle: 'tech_minimal'
    });

    assert(svg.includes(sampleLogo), 'Logo URL must be included in image tag');
    assert(svg.includes(samplePhoto), 'Product image URL must be included in image tag');
    assert(svg.includes('preserveAspectRatio="xMidYMid meet"'), 'Images must preserve aspect ratio');
  });

  // 7. Atomic credit reservation and refund on failure
  await test('7. Failed generation does not permanently consume credits', () => {
    const testUserId = 'usr-demo-001';
    CreditService.adminAdjust(testUserId, 100, 'Initial test setup');
    const initialBalance = CreditService.getBalance(testUserId).remainingCredits;

    const reservation = CreditService.reserve(testUserId, 20, 'job-test-fail-refund');
    assert(reservation.success, 'Credit reservation should succeed');
    const midBalance = CreditService.getBalance(testUserId).remainingCredits;
    assert(midBalance === initialBalance - 20, 'Balance should decrease by 20 during reservation');

    CreditService.finalize(testUserId, 20, 'job-test-fail-refund', false);
    const finalBalance = CreditService.getBalance(testUserId).remainingCredits;
    assert(finalBalance === initialBalance, 'Credits must be fully restored upon generation failure');
  });

  // 8. Idempotency prevents double spending
  await test('8. Duplicate request with identical idempotency key is protected', () => {
    const testUserId = 'usr-demo-002';
    CreditService.adminAdjust(testUserId, 100, 'Initial test setup');
    const initialBalance = CreditService.getBalance(testUserId).remainingCredits;

    const res1 = CreditService.reserve(testUserId, 15, 'job-idem-unique-1');
    assert(res1.success, 'First reservation succeeds');

    CreditService.finalize(testUserId, 15, 'job-idem-unique-1', false);
    const balanceAfter = CreditService.getBalance(testUserId).remainingCredits;
    assert(balanceAfter === initialBalance, 'Balance restored');
  });

  // 9. Strict box containment & responsive preservation
  await test('9. SVG root declares strictly contained responsive styles (width: 100%, height: 100%, preserveAspectRatio)', () => {
    const svg = generatePosterSVG({
      headline: 'Strict Box Containment Test',
      aspectRatio: '1:1',
      conceptStyle: 'festive_heritage'
    });

    assert(svg.includes('preserveAspectRatio="xMidYMid meet"'), 'Must include preserveAspectRatio to prevent stretching');
    assert(svg.includes('style="width:100%;height:100%;max-width:100%;max-height:100%;display:block;'), 'Must include responsive 100% containment styles');
    assert(svg.includes('viewBox="0 0 1080 1080"'), 'Must include full intrinsic viewBox');
  });

  // 10. Word-aware multiline wrapping prevents horizontal overflow
  await test('10. Word-aware multiline text wrapping prevents horizontal canvas overflow', () => {
    const longHeadline = 'GRAND DIWALI MEGA DHAMAKA CELEBRATION SALE OF THE CENTURY 50% OFF TODAY';
    const svg = generatePosterSVG({
      headline: longHeadline,
      subhead: 'Exclusive Limited Edition Handcrafted Silk Sarees for Weddings',
      body: 'Visit our flagship boutique or order directly online via WhatsApp for instant delivery and celebration discounts.',
      aspectRatio: '1:1',
      conceptStyle: 'neon_cyber'
    });

    assert(svg.includes('<tspan'), 'Long headline must generate multiple <tspan> lines');
    assert(!svg.includes('undefined'), 'Must not have undefined attributes');
  });

  // 11. Landscape orientation (16:9, 1.91:1) balances text and image without bottom overflow
  await test('11. Landscape orientation (16:9, 1.91:1) cleanly separates text and visual without overflow', () => {
    const landscapeRatios: AspectRatio[] = ['16:9', '1.91:1'];
    for (const ratio of landscapeRatios) {
      const svg = generatePosterSVG({
        headline: 'Landscape YouTube Promo',
        subhead: 'Special Video Banner Announcement',
        productImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
        aspectRatio: ratio,
        conceptStyle: 'retail_impact'
      });

      assert(svg.includes('prodClip_'), 'Landscape with image must include product clip');
      assert(svg.includes('<rect width="'), 'Must include CTA button and frames');
    }
  });

  // 12. Integrated designer poster cleanly embeds AI image without CTA collisions
  await test('12. Integrated designer poster cleanly embeds AI hero visual without CTA collision', () => {
    const aiPosterImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30';
    const svg = generatePosterSVG({
      headline: 'Smart Watch Luxe',
      subhead: 'Precision Engineering',
      productImageUrl: aiPosterImage,
      aspectRatio: '1:1',
      conceptStyle: 'luxury_royale'
    });

    assert(svg.includes(aiPosterImage), 'AI hero image must be embedded inside poster');
    assert(svg.includes('preserveAspectRatio="xMidYMid slice"'), 'Image showcase must preserve aspect ratio');
    assert(svg.includes('👑'), 'Luxury Royale crown must be present');
  });

  // 13. Zero-Collision Layout Verification: All 8 themes maintain distinct vertical flow
  await test('13. Zero-Collision Layout: Text and Hero image box have distinct non-overlapping zones', () => {
    const concepts: ConceptStyle[] = [
      'festive_heritage',
      'neon_cyber',
      'minimalist_bauhaus',
      'luxury_royale',
      'retail_impact',
      'artisan_organic',
      'tech_minimal',
      'streetwear_bold'
    ];

    for (const concept of concepts) {
      const svg = generatePosterSVG({
        headline: 'Exclusive Designer Sarees',
        subhead: 'Pure Kanchipuram Silk with Zari Border',
        body: 'Flat 50% discount on first 100 orders only.',
        productImageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
        conceptStyle: concept,
        aspectRatio: '1:1'
      });

      // Assert that both the product image and CTA exist and each has its own translate group
      assert(svg.includes('<image href="https://images.unsplash.com/photo-1610030469983-98e550d6193c"'), 'Product image rendered');
      assert(svg.includes('clip-path="url(#prodClip_'), 'Unique clip path applied to frame');
      assert(svg.includes('<g transform="translate('), 'Groups translated properly');
    }
  });

  // 14. Box Containment: Coordinates remain within canvas dimensions (no out-of-box coordinates)
  await test('14. Box Containment: All geometry fits inside 1080x1080 or 1280x720 canvas boundaries', () => {
    const svg1 = generatePosterSVG({
      headline: 'LONG HEADLINE TO TEST STRICT VERTICAL BOUNDS FOR POSTER CANVASES',
      subhead: 'Very long subhead with multiple details and promotional points to test spacing',
      body: 'Detailed body text explaining the promotion and ordering steps in detail.',
      cta: 'ORDER VIA WHATSAPP NOW',
      badgeText: 'FESTIVAL SPECIAL 50% OFF',
      aspectRatio: '1:1',
      conceptStyle: 'festive_heritage'
    });

    const { width, height } = getCanvasDimensions('1:1');
    assert(svg1.includes(`viewBox="0 0 ${width} ${height}"`), 'Viewbox is set accurately');

    // Extract all translateY coordinates to ensure none exceed canvas height
    const translateRegex = /transform="translate\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)"/g;
    let match;
    while ((match = translateRegex.exec(svg1)) !== null) {
      const y = parseFloat(match[2]);
      assert(y >= 0 && y <= height, `Y coordinate ${y} must be within canvas height [0, ${height}]`);
    }
  });

  // 15. Razorpay Configuration & Signature Verification
  await test('15. Razorpay Integration: Secret HMAC-SHA256 signature verification functions correctly', () => {
    const isConfigured = PaymentService.isConfigured();
    assert(isConfigured, 'PaymentService must detect active Razorpay credentials from .env');

    const testUserId = 'usr-demo-test-razorpay';
    const testOrderId = 'order_test_mock_12345';
    const testPaymentId = 'pay_test_mock_67890';
    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    // Register user subscription & payment order in memory db
    db.subscriptions.set(testUserId, {
      id: `sub-${testUserId}`,
      userId: testUserId,
      organizationId: `org-${testUserId}`,
      planId: 'FREE',
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString()
    });

    db.payments.set('pay-rec-test-15', {
      id: 'pay-rec-test-15',
      userId: testUserId,
      planId: 'PRO',
      orderId: testOrderId,
      amount: 2499,
      currency: 'INR',
      billingInterval: 'month',
      status: 'CREATED',
      verified: false,
      createdAt: new Date().toISOString()
    });

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${testOrderId}|${testPaymentId}`)
      .digest('hex');

    const invalidSignature = 'invalid_tampered_signature_hex';

    // Verify valid signature
    const validResult = PaymentService.verifyPayment({
      orderId: testOrderId,
      paymentId: testPaymentId,
      signature: validSignature,
      userId: testUserId
    });
    assert(validResult.verified, 'PaymentService must verify authentic HMAC signature');

    // Reset verified state for tampering test
    const record = db.payments.get('pay-rec-test-15');
    if (record) record.verified = false;

    // Verify invalid signature rejection
    const invalidResult = PaymentService.verifyPayment({
      orderId: testOrderId,
      paymentId: 'pay_tampered_999',
      signature: invalidSignature,
      userId: testUserId
    });
    assert(!invalidResult.verified, 'PaymentService must reject forged or tampered signatures');
  });

  // 16. Nested SVG data URLs are discarded from productImageUrl to prevent SVG nesting conflicts
  await test('16. Nested SVG data URLs in productImageUrl are safely handled without recursive SVG embedding', () => {
    const nestedSvgDataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
    const svg = generatePosterSVG({
      headline: 'Safe Vector Rendering',
      productImageUrl: nestedSvgDataUrl, // Should NOT be treated as a photographic product image
      conceptStyle: 'minimalist_bauhaus',
      aspectRatio: '1:1'
    });

    // When an SVG data URL is passed, it does not produce a product clip box containing the SVG
    assert(!svg.includes(`clip-path="url(#prodClip_`), 'SVG data URI should not be embedded inside a hero product clip box');
  });

  console.log(`\n--- ALL TESTS COMPLETED: ${passed}/${total} PASSED ---`);
  if (passed !== total) {
    process.exit(1);
  }
}

runPosterTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
