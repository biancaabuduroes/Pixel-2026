// TEMPORARY demo data for the buyer flow + seller dashboard (products, open groups, history, wallet).
// Generates prisma/seed-demo.sql:  node prisma/demo-seed.mjs > prisma/seed-demo.sql
// Run the SQL once after prisma/seed.sql (Claude session: Supabase Management API; locally: psql -f).
// Idempotent (fixed ids + ON CONFLICT DO NOTHING); never run during the Vercel build.
// Times are relative to when the SQL runs, so groups are open right after seeding.
// Every amount is integer bani and every ledger transaction sums to 0 (checked by the database).

const NOW = `(now() AT TIME ZONE 'UTC')`;
const at = (hours) => `${NOW} ${hours < 0 ? "-" : "+"} interval '${Math.abs(hours) * 60} minutes'`;
const q = (s) => `'${String(s).replaceAll("'", "''")}'`;

const LOCATIONS = [
  { id: "seed-loc-romana", name: "Magazin partener Romana", address: "Piața Romană 5, București", hours: "L–V 9–20, S 10–16" },
  { id: "seed-loc-dorobanti", name: "Magazin partener Dorobanți", address: "Calea Dorobanților 18, București", hours: "L–S 8–21" },
  { id: "seed-loc-penny", name: "Penny", address: "Șoseaua Pantelimon 245, București", hours: "L–D 8–22" },
];

// tiers: [minQty, unitPrice in bani]; perBuyerCap < second tier minQty (pricing rule 4).
// groups: [durationHours, hoursSinceOpen, simulated units (each simulated buyer joins with up to `cap` units)]
const PRODUCTS = [
  { id: "seed-scutece", name: "Scutece Premium Care nr. 4, 104 buc", desc: "104 bucăți · mărimea 4 (9–14 kg) · pachet lunar", cat: "scutece-bebelusi", loc: 0, cap: 3,
    tiers: [[1, 12499], [20, 9499], [50, 8699]], groups: [[24, 20, 17], [72, 10, 26], [168, 30, 12]] },
  { id: "seed-ulei", name: "Ulei de floarea-soarelui 5 L", desc: "Bidon 5 L · presat la rece · producător local", cat: "ulei-camara", loc: 2, cap: 4,
    tiers: [[1, 5499], [15, 4999], [30, 4499], [60, 3999]], groups: [[48, 6, 21], [168, 40, 9]] },
  { id: "seed-lapte", name: "Lapte praf de continuare 2, 800 g", desc: "800 g · de la 6 luni", cat: "scutece-bebelusi", loc: 2, cap: 3,
    tiers: [[1, 6999], [10, 6499], [25, 5999]], groups: [[96, 30, 11]] },
  { id: "seed-servetele", name: "Șervețele umede, 12 × 64 buc", desc: "12 pachete × 64 bucăți · fără parfum", cat: "ingrijire-personala", loc: 1, cap: 5,
    tiers: [[1, 7999], [20, 5999], [40, 4999]], groups: [[24, 3, 9], [72, 22, 31]] },
  { id: "seed-miere", name: "Miere polifloră 1 kg, de la apicultor", desc: "Borcan 1 kg · recolta 2026", cat: "alimente", loc: 2, cap: 2,
    tiers: [[1, 4999], [15, 3999], [30, 3499]], groups: [[120, 50, 13]] },
  { id: "seed-detergent", name: "Detergent de vase 5 L", desc: "Canistră 5 L · concentrat", cat: "curatenie", loc: 2, cap: 3,
    tiers: [[1, 3999], [25, 3299], [50, 2999]], groups: [[24, 12, 14], [168, 70, 30]] },
  // Seller-defined baskets (kind BASKET): sold as one unit; `items` is what the basket contains.
  { id: "seed-cos-baza", kind: "BASKET", name: "Coș alimente de bază", desc: "Cămara pe o lună pentru 2 persoane", cat: "alimente", loc: 2, cap: 2,
    tiers: [[1, 14999], [15, 12999], [30, 11499]], groups: [[48, 20, 12], [168, 30, 7]],
    items: [["Ulei de floarea-soarelui 1 L", 2], ["Făină albă 1 kg", 2], ["Zahăr 1 kg", 1], ["Orez 1 kg", 1], ["Paste 500 g", 3], ["Roșii în bulion 400 g", 2]] },
  { id: "seed-cos-ingrijire", kind: "BASKET", name: "Coș îngrijire personală", desc: "Esențialele de baie pentru o lună", cat: "ingrijire-personala", loc: 1, cap: 2,
    tiers: [[1, 9999], [12, 8499], [25, 7499]], groups: [[72, 24, 9]],
    items: [["Șampon 400 ml", 1], ["Gel de duș 500 ml", 2], ["Pastă de dinți 75 ml", 2], ["Săpun lichid 500 ml", 1], ["Deodorant 150 ml", 1]] },
  { id: "seed-cos-premium", kind: "BASKET", name: "Coș alimente premium", desc: "Produse gourmet selectate de vânzător", cat: "alimente", loc: 0, cap: 1,
    tiers: [[1, 29999], [10, 26999], [20, 24999]], groups: [[120, 40, 8]],
    items: [["Ulei de măsline extravirgin 750 ml", 1], ["Parmigiano Reggiano 300 g", 1], ["Paste artizanale 500 g", 2], ["Cafea boabe 1 kg", 1], ["Ciocolată neagră 85% 100 g", 2]] },
  // Birotică sits after the baskets so HISTORY indexes 0–7 stay on the original products.
  { id: "seed-pix-albastru", name: "Pixuri albastre, 50 buc", desc: "50 pixuri · vârf 0,7 mm · cerneală albastră · cutie de birou", cat: "birotica", loc: 0, cap: 4,
    tiers: [[1, 1999], [15, 1699], [40, 1399]], groups: [[24, 18, 11], [72, 8, 6]] },
  { id: "seed-pix-negru", name: "Pixuri negre cu gel, 12 buc", desc: "12 pixuri gel · vârf 0,5 mm · scriere fină", cat: "birotica", loc: 1, cap: 4,
    tiers: [[1, 1499], [12, 1199], [30, 999]], groups: [[72, 20, 8]] },
  { id: "seed-pix-rosu", name: "Pixuri roșii, 10 buc", desc: "10 pixuri · cerneală roșie · pentru corecturi și marcaje", cat: "birotica", loc: 0, cap: 3,
    tiers: [[1, 1299], [10, 999], [25, 799]], groups: [[24, 6, 4]] },
  { id: "seed-creion-hb", name: "Creioane HB, 12 buc", desc: "12 creioane grafit HB · lemn · ascuțite", cat: "birotica", loc: 1, cap: 4,
    tiers: [[1, 999], [12, 799], [30, 649]], groups: [[48, 10, 6]] },
  { id: "seed-marker-perm", name: "Markere permanente, set 4", desc: "Set 4 culori · negru, albastru, roșu, verde · vârf rotund", cat: "birotica", loc: 0, cap: 3,
    tiers: [[1, 2499], [10, 2199], [24, 1899]], groups: [[72, 30, 14]] },
  { id: "seed-marker-evid", name: "Evidențiatoare, set 6", desc: "6 culori pastel · vârf lat · nu trec prin hârtie", cat: "birotica", loc: 1, cap: 3,
    tiers: [[1, 1899], [10, 1599], [24, 1299]], groups: [[24, 8, 7]] },
  { id: "seed-hartie-a4", name: "Hârtie A4 80 g, 500 coli", desc: "Top 500 coli · A4 · 80 g/mp · albă, pentru imprimantă", cat: "birotica", loc: 0, cap: 3,
    tiers: [[1, 3499], [10, 2999], [25, 2699]], groups: [[72, 24, 16], [168, 20, 8]] },
  { id: "seed-hartie-a4-rec", name: "Hârtie A4 reciclată, 500 coli", desc: "Top 500 coli · A4 · 80 g/mp · hârtie reciclată", cat: "birotica", loc: 1, cap: 3,
    tiers: [[1, 2999], [10, 2599], [25, 2299]], groups: [[168, 40, 9]] },
  { id: "seed-hartie-a5", name: "Hârtie A5 80 g, 500 coli", desc: "Top 500 coli · A5 · 80 g/mp · pentru notițe", cat: "birotica", loc: 0, cap: 4,
    tiers: [[1, 2499], [12, 2099], [30, 1799]], groups: [[48, 12, 5]] },
  { id: "seed-caiet-dictando", name: "Caiet A4 dictando, 80 file", desc: "A4 · 80 file · dictando · copertă carton", cat: "birotica", loc: 1, cap: 5,
    tiers: [[1, 899], [15, 749], [40, 599]], groups: [[24, 4, 8]] },
  { id: "seed-caiet-mate", name: "Caiet A5 matematică, 60 file", desc: "A5 · 60 file · matematică · spirală", cat: "birotica", loc: 0, cap: 5,
    tiers: [[1, 699], [15, 599], [40, 499]], groups: [[72, 16, 12]] },
  { id: "seed-agenda", name: "Agendă nedatată A5", desc: "A5 · 192 pagini · nedatată · copertă tare", cat: "birotica", loc: 1, cap: 2,
    tiers: [[1, 3999], [8, 3499], [20, 2999]], groups: [[120, 36, 6]] },
  { id: "seed-dosar", name: "Dosare carton A4, 10 buc", desc: "10 dosare · A4 · carton 250 g · culoare natur", cat: "birotica", loc: 0, cap: 4,
    tiers: [[1, 1599], [12, 1299], [30, 1099]], groups: [[48, 18, 10]] },
  { id: "seed-biblioraft", name: "Biblioraft A4, 7 cm", desc: "A4 · cotor 7 cm · 2 inele · etichetă pe cotor", cat: "birotica", loc: 1, cap: 2,
    tiers: [[1, 1899], [8, 1599], [20, 1399]], groups: [[72, 20, 5]] },
  { id: "seed-folii", name: "Folii transparente A4, 100 buc", desc: "100 folii · A4 · 40 microni · deschidere sus", cat: "birotica", loc: 0, cap: 3,
    tiers: [[1, 2199], [10, 1899], [25, 1599]], groups: [[24, 10, 9]] },
  { id: "seed-capsator", name: "Capsator metalic și 1000 capse", desc: "Capsator de birou · capse 24/6 · include 1000 capse", cat: "birotica", loc: 1, cap: 2,
    tiers: [[1, 2799], [8, 2399], [20, 2099]], groups: [[168, 48, 7]] },
  { id: "seed-capse", name: "Capse 24/6, 1000 buc", desc: "Cutie 1000 capse · 24/6 · pentru capsator de birou", cat: "birotica", loc: 0, cap: 6,
    tiers: [[1, 799], [20, 649], [50, 499]], groups: [[24, 5, 14]] },
  { id: "seed-foarfeca", name: "Foarfecă de birou, 21 cm", desc: "21 cm · lame oțel · mâner moale", cat: "birotica", loc: 1, cap: 3,
    tiers: [[1, 1499], [10, 1299], [25, 1099]], groups: [[72, 12, 4]] },
  { id: "seed-banda", name: "Bandă adezivă, 8 role", desc: "8 role · 19 mm × 33 m · transparentă", cat: "birotica", loc: 0, cap: 4,
    tiers: [[1, 1699], [12, 1399], [30, 1199]], groups: [[48, 14, 11]] },
  { id: "seed-notes", name: "Notes autoadezive, 12 blocuri", desc: "12 blocuri × 100 file · 76 × 76 mm · culori mixte", cat: "birotica", loc: 1, cap: 4,
    tiers: [[1, 1299], [12, 999], [30, 849]], groups: [[24, 16, 10]] },
];

const SIM_BUYERS = 30;
const SIM_TOPUP = 300_000; // 3.000 RON each, enough for every simulated commitment
const DEMO_BUYER = "demo-buyer"; // prisma/seed.sql
const DEMO_TOPUP = 50_000; // 500 RON

const tierPrice = (tiers, qty) => tiers.filter(([min]) => min <= Math.max(qty, 1)).at(-1)[1];

const out = [];
const sql = (s) => out.push(s);
const accounts = new Set();
const account = (owner, type) => {
  const id = `seed-acct-${owner}-${type}`;
  if (!accounts.has(id)) {
    accounts.add(id);
    sql(`INSERT INTO "LedgerAccount" (id, "ownerUserId", type, currency) VALUES (${q(id)}, ${q(owner)}, ${q(type)}, 'RON') ON CONFLICT DO NOTHING;`);
  }
  // An account may already exist under another id (created by the app): resolve by owner + type.
  return `(SELECT id FROM "LedgerAccount" WHERE "ownerUserId" = ${q(owner)} AND type = ${q(type)} AND currency = 'RON')`;
};
const FUNDING = `(SELECT id FROM "LedgerAccount" WHERE "ownerUserId" IS NULL AND type = 'EXTERNAL_FUNDING' AND currency = 'RON')`;

function ledgerTx(id, operationId, type, extra, entries, createdAt) {
  sql(
    `INSERT INTO "LedgerTransaction" (id, "operationId", type, "commitmentId", "groupId", "topUpId", "createdAt") VALUES (${q(id)}, ${q(operationId)}, ${q(type)}, ${extra.commitmentId ? q(extra.commitmentId) : "NULL"}, ${extra.groupId ? q(extra.groupId) : "NULL"}, ${extra.topUpId ? q(extra.topUpId) : "NULL"}, ${createdAt}) ON CONFLICT DO NOTHING;`,
  );
  entries.forEach(([acct, amount], i) =>
    sql(`INSERT INTO "LedgerEntry" (id, "transactionId", "accountId", amount) SELECT ${q(`${id}-e${i}`)}, ${q(id)}, ${acct}, ${amount} WHERE NOT EXISTS (SELECT 1 FROM "LedgerEntry" WHERE id = ${q(`${id}-e${i}`)});`),
  );
}

function topUp(owner, amount, createdAt) {
  const topUpId = `seed-topup-${owner}`;
  ledgerTx(`seed-tx-${topUpId}`, `topup:${topUpId}`, "TOPUP", { topUpId }, [[FUNDING, -amount], [account(owner, "BUYER_AVAILABLE"), amount]], createdAt);
}

sql("-- GENERATED by prisma/demo-seed.mjs — temporary buyer-flow + seller-dashboard demo data. Do not edit by hand.");
sql("BEGIN;");
sql(`INSERT INTO "LedgerAccount" (id, "ownerUserId", type, currency) VALUES ('seed-acct-external-funding', NULL, 'EXTERNAL_FUNDING', 'RON'), ('seed-acct-platform-revenue', NULL, 'PLATFORM_REVENUE', 'RON') ON CONFLICT DO NOTHING;`);
sql(`INSERT INTO "User" (id, email, name, role) VALUES ${Array.from({ length: SIM_BUYERS }, (_, i) => `(${q(`seed-sim-${i + 1}`)}, ${q(`sim${i + 1}@demo.bundeals.ro`)}, ${q(`Cumpărător simulat ${i + 1}`)}, 'BUYER')`).join(", ")} ON CONFLICT DO NOTHING;`);
for (const l of LOCATIONS) {
  sql(`INSERT INTO "PickupLocation" (id, "sellerId", name, address, "openingHours") SELECT ${q(l.id)}, id, ${q(l.name)}, ${q(l.address)}, ${q(l.hours)} FROM "User" WHERE email = 'vanzator@bundeals.ro' ON CONFLICT DO NOTHING;`);
}
// Extra top-up covers historical SETTLED groups for the seller dashboard (90 days).
for (let i = 1; i <= SIM_BUYERS; i++) topUp(`seed-sim-${i}`, SIM_TOPUP * 2, at(-80));
topUp(DEMO_BUYER, DEMO_TOPUP, at(-72));
const PLATFORM = `(SELECT id FROM "LedgerAccount" WHERE "ownerUserId" IS NULL AND type = 'PLATFORM_REVENUE' AND currency = 'RON')`;
const SELLER = "demo-seller";
const commissionOf = (amount) => Math.floor((amount * 500 + 5_000) / 10_000);

let commitmentNo = 0;
function commit({ groupId, productId, buyerId, quantity, unitPrice, createdAt, simulated }) {
  const id = `seed-c-${++commitmentNo}`;
  sql(
    `INSERT INTO "Commitment" (id, "groupId", "productId", "buyerId", quantity, "committedUnitPrice", "reservedAmount", status, "createdAt", "updatedAt") VALUES (${q(id)}, ${q(groupId)}, ${q(productId)}, ${q(buyerId)}, ${quantity}, ${unitPrice}, ${quantity * unitPrice}, 'ACTIVE', ${createdAt}, ${createdAt}) ON CONFLICT DO NOTHING;`,
  );
  sql(`INSERT INTO "JoinEvent" (id, "groupId", quantity, simulated, "createdAt") VALUES (${q(`seed-je-${commitmentNo}`)}, ${q(groupId)}, ${quantity}, ${simulated}, ${createdAt}) ON CONFLICT DO NOTHING;`);
  const amount = quantity * unitPrice;
  ledgerTx(`seed-tx-reserve-${id}`, `reserve:${id}`, "RESERVE", { commitmentId: id, groupId }, [[account(buyerId, "BUYER_AVAILABLE"), -amount], [account(buyerId, "BUYER_RESERVED"), amount]], createdAt);
}

/** One group with `simUnits` units from simulated buyers (+ optional demo buyer), joined evenly since it opened. */
function group(p, { id, durationHours, hoursSinceOpen, simUnits, demoQty = 0, simStart }) {
  const opensAt = at(-hoursSinceOpen);
  const closesAt = at(durationHours - hoursSinceOpen);
  const joins = [];
  for (let left = simUnits, b = simStart; left > 0; b++) {
    const qty = Math.min(left, 1 + ((b * 7) % p.cap));
    joins.push({ buyerId: `seed-sim-${b}`, quantity: qty, simulated: true });
    left -= qty;
  }
  if (demoQty) joins.splice(Math.floor(joins.length / 2), 0, { buyerId: DEMO_BUYER, quantity: demoQty, simulated: false });
  const total = joins.reduce((s, j) => s + j.quantity, 0);
  sql(`INSERT INTO "Group" (id, "productId", "durationHours", "opensAt", "closesAt", status, "totalQty") VALUES (${q(id)}, ${q(p.id)}, ${durationHours}, ${opensAt}, ${closesAt}, 'OPEN', ${total}) ON CONFLICT DO NOTHING;`);
  let qty = 0;
  joins.forEach((j, i) => {
    const hoursAgo = hoursSinceOpen * (1 - (i + 1) / (joins.length + 1));
    commit({ groupId: id, productId: p.id, buyerId: j.buyerId, quantity: j.quantity, unitPrice: tierPrice(p.tiers, qty), createdAt: at(-hoursAgo), simulated: j.simulated });
    qty += j.quantity;
  });
  if (joins.length + simStart - 1 > SIM_BUYERS) throw new Error(`Not enough simulated buyers for ${p.id}`);
  return joins.length;
}

for (const p of PRODUCTS) {
  const loc = LOCATIONS[p.loc].id;
  sql(
    `INSERT INTO "Product" (id, "sellerId", "pickupLocationId", name, description, category, kind, "stockTotal", "perBuyerCap", "pickupDeadlineDays", status) SELECT ${q(p.id)}, id, ${q(loc)}, ${q(p.name)}, ${q(p.desc)}, ${q(p.cat)}, ${q(p.kind ?? "ITEM")}, 200, ${p.cap}, 3, 'ACTIVE' FROM "User" WHERE email = 'vanzator@bundeals.ro' ON CONFLICT DO NOTHING;`,
  );
  // Inserts skip existing rows, so a later store assignment (Penny) has to be written explicitly.
  sql(`UPDATE "Product" SET "pickupLocationId" = ${q(loc)} WHERE id = ${q(p.id)};`);
  if (p.items) {
    sql(`INSERT INTO "BasketItem" (id, "productId", position, name, quantity) VALUES ${p.items.map(([name, qty], i) => `(${q(`${p.id}-i${i + 1}`)}, ${q(p.id)}, ${i + 1}, ${q(name)}, ${qty})`).join(", ")} ON CONFLICT DO NOTHING;`);
  }
  sql(`INSERT INTO "PriceTier" (id, "productId", "minQty", "unitPrice") VALUES ${p.tiers.map(([m, u]) => `(${q(`${p.id}-t${m}`)}, ${q(p.id)}, ${m}, ${u})`).join(", ")} ON CONFLICT DO NOTHING;`);
  sql(`INSERT INTO "ProductDuration" (id, "productId", "durationHours") VALUES ${p.groups.map(([h]) => `(${q(`${p.id}-d${h}`)}, ${q(p.id)}, ${h})`).join(", ")} ON CONFLICT DO NOTHING;`);
  // Each simulated buyer holds at most one ACTIVE commitment per product, so groups use distinct buyers.
  let simStart = 1;
  for (const [durationHours, hoursSinceOpen, simUnits] of p.groups) {
    const demoQty = p.id === "seed-ulei" && durationHours === 168 ? 2 : 0; // "Grupurile mele" on Home
    simStart += group(p, { id: `${p.id}-g${durationHours}`, durationHours, hoursSinceOpen, simUnits, demoQty, simStart });
  }
}

// A group of the demo buyer that closed 6 hours ago and reached the second tier. Its duration (24 h) is
// not offered for honey, so settling it (lazily, when the buyer opens Home or Profile) does not renew it.
// Result: an order "Gata de ridicare" with a pickup code, and savings on Home.
const honey = PRODUCTS.find((p) => p.id === "seed-miere");
sql(`-- Past-due group for the demo buyer (settled by the app on first visit).`);
{
  const id = "seed-miere-g24-closed";
  const joins = [{ buyerId: DEMO_BUYER, quantity: 1, simulated: false }];
  for (let b = 20; b <= 27; b++) joins.push({ buyerId: `seed-sim-${b}`, quantity: 2, simulated: true });
  const total = joins.reduce((s, j) => s + j.quantity, 0);
  sql(`INSERT INTO "Group" (id, "productId", "durationHours", "opensAt", "closesAt", status, "totalQty") VALUES (${q(id)}, ${q(honey.id)}, 24, ${at(-30)}, ${at(-6)}, 'OPEN', ${total}) ON CONFLICT DO NOTHING;`);
  let qty = 0;
  joins.forEach((j, i) => {
    commit({ groupId: id, productId: honey.id, buyerId: j.buyerId, quantity: j.quantity, unitPrice: tierPrice(honey.tiers, qty), createdAt: at(-29 + i * 2), simulated: j.simulated });
    qty += j.quantity;
  });
}

/**
 * Seller-dashboard history: settled groups + collected (or expired_paid) orders over ~90 days.
 * Ledger path matches domain rules: RESERVE → SETTLE → PAYOUT. Idempotent fixed ids.
 */
sql(`-- Historical settled groups for the seller dashboard (last ~90 days).`);
account(SELLER, "SELLER_EARNINGS");
const HISTORY = [
  // [productIndex, daysAgoClosed, durationHours, simUnits, expireLast]
  [0, 5, 24, 42, false],
  [0, 18, 72, 28, false],
  [1, 9, 48, 35, false],
  [1, 40, 168, 22, false],
  [2, 12, 96, 18, false],
  [3, 7, 24, 44, false],
  [3, 25, 72, 20, true],
  [4, 15, 120, 32, false],
  [5, 3, 24, 26, false],
  [5, 55, 168, 55, false],
  [6, 21, 48, 16, false],
  [7, 33, 72, 14, false],
];
let histBuyer = 1;
for (let hi = 0; hi < HISTORY.length; hi++) {
  const [pi, daysAgo, durationHours, simUnits, expireLast] = HISTORY[hi];
  const p = PRODUCTS[pi];
  const groupId = `seed-hist-g${hi + 1}`;
  const hoursAgoClose = daysAgo * 24;
  const opensAt = at(-(hoursAgoClose + durationHours));
  const closesAt = at(-hoursAgoClose);
  const joins = [];
  for (let left = simUnits; left > 0; ) {
    const qty = Math.min(left, 1 + ((histBuyer * 5) % p.cap));
    joins.push({ buyerId: `seed-sim-${((histBuyer - 1) % SIM_BUYERS) + 1}`, quantity: qty });
    histBuyer += 1;
    left -= qty;
  }
  const total = joins.reduce((s, j) => s + j.quantity, 0);
  const finalUnitPrice = tierPrice(p.tiers, total);
  sql(
    `INSERT INTO "Group" (id, "productId", "durationHours", "opensAt", "closesAt", status, "totalQty", "finalUnitPrice") VALUES (${q(groupId)}, ${q(p.id)}, ${durationHours}, ${opensAt}, ${closesAt}, 'SETTLED', ${total}, ${finalUnitPrice}) ON CONFLICT DO NOTHING;`,
  );
  let running = 0;
  joins.forEach((j, i) => {
    const commitmentId = `seed-hist-c${hi + 1}-${i + 1}`;
    const committedUnitPrice = tierPrice(p.tiers, running);
    const reservedAmount = j.quantity * committedUnitPrice;
    const amountCharged = j.quantity * finalUnitPrice;
    const released = reservedAmount - amountCharged;
    const createdAt = at(-(hoursAgoClose + durationHours - 1 - i));
    const status = expireLast && i === joins.length - 1 ? "EXPIRED_PAID" : "COLLECTED";
    const pickupDeadline = at(-(hoursAgoClose - 48));
    running += j.quantity;
    sql(
      `INSERT INTO "Commitment" (id, "groupId", "productId", "buyerId", quantity, "committedUnitPrice", "reservedAmount", "finalUnitPrice", "amountCharged", status, "pickupCodeHash", "pickupDeadline", "createdAt", "updatedAt") VALUES (${q(commitmentId)}, ${q(groupId)}, ${q(p.id)}, ${q(j.buyerId)}, ${j.quantity}, ${committedUnitPrice}, ${reservedAmount}, ${finalUnitPrice}, ${amountCharged}, ${q(status)}, ${q(`seed-hash-${commitmentId}`)}, ${pickupDeadline}, ${createdAt}, ${closesAt}) ON CONFLICT DO NOTHING;`,
    );
    sql(`INSERT INTO "JoinEvent" (id, "groupId", quantity, simulated, "createdAt") VALUES (${q(`seed-hist-je${hi + 1}-${i + 1}`)}, ${q(groupId)}, ${j.quantity}, true, ${createdAt}) ON CONFLICT DO NOTHING;`);
    ledgerTx(
      `seed-tx-reserve-${commitmentId}`,
      `reserve:${commitmentId}`,
      "RESERVE",
      { commitmentId, groupId },
      [
        [account(j.buyerId, "BUYER_AVAILABLE"), -reservedAmount],
        [account(j.buyerId, "BUYER_RESERVED"), reservedAmount],
      ],
      createdAt,
    );
    const settleEntries = [
      [account(j.buyerId, "BUYER_RESERVED"), -reservedAmount],
      [account(j.buyerId, "PENDING_PICKUP"), amountCharged],
    ];
    if (released > 0) settleEntries.push([account(j.buyerId, "BUYER_AVAILABLE"), released]);
    ledgerTx(`seed-tx-settle-${commitmentId}`, `settle:${commitmentId}`, "SETTLE", { commitmentId, groupId }, settleEntries, closesAt);
    const commission = commissionOf(amountCharged);
    const sellerAmount = amountCharged - commission;
    const payoutEntries = [
      [account(j.buyerId, "PENDING_PICKUP"), -amountCharged],
      [account(SELLER, "SELLER_EARNINGS"), sellerAmount],
    ];
    if (commission > 0) payoutEntries.push([PLATFORM, commission]);
    ledgerTx(`seed-tx-payout-${commitmentId}`, `payout:${commitmentId}`, "PAYOUT", { commitmentId }, payoutEntries, at(-(hoursAgoClose - 12)));
  });
}

sql("COMMIT;");
console.log(out.join("\n"));
