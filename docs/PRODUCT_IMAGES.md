# BunDeals – Product Images

## Treatment (decision 2026-11-07)
- Square studio photo, background **#FFF1EC** (= `--bg-brand-soft`), soft natural light, minimal soft shadow, product centred with a margin.
- Unbranded packaging: no text, logos, labels or watermarks. No unrelated stock photos.
- Baskets: every listed item, neatly arranged in one simple natural wicker basket, each item recognisable.
- One component everywhere: `src/components/ds/product-image.tsx` (`ProductImage`) — `object-fit: contain` on the same #FFF1EC, so cards (wide), the Pool hero and thumbnails keep their Figma sizes. No photo → Figma bag icon (fallback). Never a stand-in photo.

## Files
- `public/products/<product-id>.webp` (800×800) and `<product-id>-thumb.webp` (160×160, list thumbnails), served as static files (no image-optimisation quota).
- Make them from any source photo (ideally on a plain white/light background):
  `scripts/prepare-product-image.sh <photo> <product-id> [fuzz %]` — needs ImageMagick (dev machine only, not an app dependency). It turns the background into #FFF1EC, trims, centres and writes both WebP files.
- `Product.imageUrl` (existing column) is set by `prisma/demo-seed.mjs` only when the file exists; regenerate `prisma/seed-demo.sql` and run it.

## Where images appear
Home deal cards, Pool page hero, Search rows and "Propuse pentru tine", Profile order cards (buyer); seller dashboard product and group cards (`feat/seller-dashboard`).

## Status and prompts
Generation must be free (decision 2026-11-07). The anonymous free tier of Pollinations.ai was tried and **rejected**: forced watermark, background colour ignored, basket contents not recognisable, 1 image / 45 s. Images are added when a free source that meets the treatment is available (e.g. a free account on an image tool, or real photos).

Shared prompt suffix: *"professional e-commerce studio photograph, centered, square composition, seamless plain light background, soft natural studio lighting, minimal soft shadow, sharp, photorealistic, unbranded plain packaging, no text, no logo, no label, no watermark"*

| Product id | Prompt (+ suffix) | Status |
|---|---|---|
| seed-scutece | a stacked large pack of baby diapers size 4 in plain white soft plastic packaging | missing |
| seed-ulei | a single 5 liter clear PET bottle of golden sunflower oil with a yellow cap and handle | missing |
| seed-lapte | a single 800 g white metal tin of infant follow-on milk formula with a scoop beside it | missing |
| seed-servetele | a neat stack of 12 soft packs of baby wet wipes with plain white packaging | missing |
| seed-miere | a 1 kg glass jar of golden polyfloral honey with a plain lid and a wooden honey dipper | missing |
| seed-detergent | a 5 liter plain white plastic canister of dishwashing liquid with a green cap | missing |
| seed-cos-baza | a natural wicker basket containing 2 bottles of sunflower oil 1 L, 2 paper bags of white flour 1 kg, a bag of sugar 1 kg, a bag of rice 1 kg, 3 packs of dry pasta 500 g and 2 cans of tomato passata | missing |
| seed-cos-ingrijire | a natural wicker basket containing a shampoo bottle, 2 shower gel bottles, 2 toothpaste tubes, a liquid soap pump bottle and a deodorant spray | missing |
| seed-cos-premium | a natural wicker basket containing a bottle of extra virgin olive oil 750 ml, a wedge of Parmigiano Reggiano, 2 packs of artisan pasta, a bag of coffee beans 1 kg and 2 bars of dark chocolate | missing |
| paine (seller demo) | a round rustic sourdough bread loaf | missing |
| ulei (seller demo) | a 1 liter glass bottle of extra virgin olive oil | missing |
| cafea (seller demo) | a 1 kg plain kraft bag of roasted coffee beans with a few beans in front | missing |
