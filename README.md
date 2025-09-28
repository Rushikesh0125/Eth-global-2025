# zk-express — privacy-first checkout & cross-platform delivery reputation

**Short tagline:** Buy without leaking your history. A privacy-first checkout that decouples PII from merchants, gives users a portable, CIBIL‑style reputation, and lets logistics compete for orders while keeping addresses confidential.

---

## Story (problem we solve)

Imagine John Doe, a young D2C founder in Mumbai, tweeting about a great shopper — Rahul from South Bombay — who bought 32 sneakers. John has good intent, but a month later a breach at John’s company leaks millions of customer records. This happens too often in India and worldwide.

Why does every merchant need to permanently store critical user PII (addresses, phone numbers, order history)? In many flows the only party that _ever needs_ the address is the logistics provider. If we could decouple PII from merchants and give users a portable, privacy-preserving reputation that logistics can trust — everybody benefits.

Enter **zk-express**: a checkout button (next to Add to cart / Buy now) that routes the purchase through a privacy layer. The merchant receives a payment confirmation and a pseudonymous order; logistics receive the (encrypted / selectively disclosed) address and compete to deliver the package. Users keep control over what is shared and earn a cross‑platform reputation score for good behaviour (low returns, successful deliveries, few disputes) — a secretive bureau like CIBIL but for delivery reliability.

---

## High-level product idea

1. User clicks **Buy with zk-express** on a merchant page.
2. zk-express UI (Stripe-style) appears and the user authenticates with a zk‑capable Web3 identity (`self` / Web3 wallet). A pseudonymous persistent identity is created for cross-platform reputation.
3. User completes checkout; merchant gets a minimal payment confirmation (no PII stored by merchant).
4. Order metadata (product, pseudonymous id, pincode, delivery constraints) is published to a logistics pool. The **full address is never published publicly**.
5. Logistics providers bid/compete in an auction. Bids consider price, estimated success, and the buyer's reputation.
6. Winner is chosen. The winner obtains the encrypted address using a selective disclosure / attribute-based decryption scheme only after proving they operate in that pincode (or via a trusted attestation).
7. Delivery completes, logistics posts an attestation (signed delivery event) to zk‑express.
8. The reputation authority updates the user’s reputation (off‑chain), and issues a new ZK‑credential or signed commitment that the user can present as proof of a rep threshold.

---

## Where this helps (value props)

- **Users:** Keep PII private, carry a reputation across platforms, better delivery experience for high‑rep users.
- **Merchants:** Lower RTO (return to origin) and dispute costs because logistics can prefer higher‑quality customers; no need to store sensitive PII long‑term.
- **Logistics:** Get better matching quality; compete for high‑rep orders; better resource planning.

---

# Technical design (focused parts)

> The sections below drill into the _reputation system_, _logistics auction/matching_, and _address privacy / selective disclosure_ — the three design challenges you asked me to expand.

## 1) Reputation system — "CIBIL for deliveries"

**Core idea:** A privacy-preserving reputation bureau that aggregates delivery‑related events across merchants and logistics, issues _signed, revocable credentials_ about a user’s delivery reliability, and allows users to prove attributes about their rep (e.g., `rep >= 750` or `last-6-months-deliveries >= 50`) using zero‑knowledge proofs — without revealing raw order history.

### Goals

- **Privacy:** No raw order history is revealed to verifying parties.
- **Portability:** Reputation follows the pseudonymous identity (backed by `self`) across merchants.
- **Verifiable:** Logistics/merchants can cryptographically verify reputation proofs.
- **Non-transferable:** Reputation must be tied to a persistent pseudonymous identity and non-transferable.
- **Freshness & revocation:** Ability to update/decay and revoke credentials when disputes are proven.

### Data model (conceptual)

```json
UserRecord {
  pseudonym: "did:self:0xabc...",
  commitments: {
    deliveries_total: CMT1,
    deliveries_success: CMT2,
    disputes_count: CMT3,
    returns_count: CMT4,
    last_updated: timestamp
  },
  signed_attestations: [ Attestation1, Attestation2, ... ]
}

Attestation {
  issuer: LogisticsProviderOrMerchant,
  event_type: "DELIVERED" | "RETURNED" | "DISPUTE_RESOLVED",
  metadata_commitment: H(address_commitment || order_hash || slot),
  signature: Sig_issuer
}
```

All counts and aggregates are stored as commitments or encrypted counters. The reputation authority aggregates attestations and computes a canonical score while keeping per‑order data secret.

### How reputation is computed (example)

A simple weighted score:

```
score = 700
+ w1 * normalized(success_rate)
- w2 * normalized(return_rate)
- w3 * normalized(dispute_rate)
- decay_over_time
```

The authority keeps internal parameters, then issues a signed credential that commits to `score` and a ZK circuit is available so a user can prove `score >= threshold` without revealing `score` or underlying data.

### Credentials & proofs

- Reputation authority issues **ZK‑credentials** (or BLS/ECDSA-signed commitments + a zk circuit). Users store their credential locally (in the wallet).
- When a verifier (logistics) needs to validate a threshold, the user generates a zk proof: `PoK: (I hold a credential signed by Authority) and (score >= X)`.
- This avoids sharing order history or actual numeric score.

### Revocation / freshness

- Use short-lived credentials plus a revocation registry (e.g., an on‑chain or off‑chain merkle revocation list maintained by the authority).
- On disputes, issue a new credential after recomputation.

### Dispute & governance

- Provide a dispute window and a way for users/merchants/logistics to contest events (signed attestations). A lightweight arbitration process will be necessary to avoid oracle manipulation.

## 2) Logistics auction & matching

Design the marketplace where logistics providers compete for orders.

### Objectives

- Let logistics competitively bid for orders (price, earliest pickup, SLA) while taking user reputation into account.
- Let users reduce cost by selecting cheaper options or letting algorithm pick cheapest that meets constraints.

### Auction models (options)

1. **Sealed-bid scoring auction (recommended):** Logistics submit sealed bids (price + metadata + claimed coverage). The platform computes a score: `score = α * price_score + β * (1 - distance_norm) + γ * rep_weight` and picks the best bidder. The formula can be tuned so reputation acts as a positive multiplier for the buyer’s attractiveness.

2. **Second-price sealed-bid:** Encourages honest bidding; winner pays second lowest price adjusted by reputation multiplier.

3. **Continuous market / Marketplace:** Publish orders and let logistics pick them in a first-come-first-served or short-window bidding. Can lead to race conditions.

**Recommendation:** Use a sealed scoring auction where the platform ranks bids by a composite utility and picks the seller minimizing delivery cost + failure risk.

### Example matching function

```
utility_for_order = price * (1 - rep_influence * normalize(rep_score)) + distance_penalty + capacity_penalty
choose provider with min(utility_for_order)
```

`rep_influence` controls how much reputation decreases effective price (high rep means cheaper effective cost because lower expected failure).

### Incentives

- Logistics win better, lower-risk customers by performing well and increasing their margin via lower costs (RTO savings).
- Merchants see fewer returns and better fulfillment KPIs.

## 3) Address privacy & selective disclosure (your main concern)

You’re right: users still enter contact & address on the checkout form. The goal is that only the logistics provider who will actually deliver (and only those who can _prove_ they operate in that pincode/area) can see the full address — and only after winning the auction.

### High-level approaches (pick one or combine)

1. **Envelope encryption + attribute-based release (practical):**

   - User encrypts the full address under an ephemeral symmetric key.
   - The symmetric key is encrypted to an attribute: `coverage:pincode:400001` using **Proxy Re‑Encryption (PRE)** or **Attribute‑Based Encryption (ABE)**.
   - Logistics providers get _attributes_ from a trusted Coverage Authority (e.g., a registry maintained by regional logistics hubs / the platform after vetting). If provider has attribute `coverage:400001`, they can request re‑encryption or obtain the key to decrypt the envelope _only after_ the order is awarded to them.
   - The re‑encryption step can be gated by the platform: the platform issues a re‑encrypt token when awarding an order.

2. **Selective disclosure via attestation + ephemeral keys (simple):**

   - Platform keeps the encrypted address. When an award is decided, the platform verifies winner’s coverage claim (by checking their certificate/registry) and then sends the decrypted address to the winner over a secure channel. This is simplest but requires trusting the platform to gate disclosure.

3. **ZK proximity proof / geofence attestations (advanced):**

   - Logistics prove they operate within or near a pincode by presenting a signed attestation from a local hub or regulator. That attestation is then verified, and if valid, access to the address is granted.
   - You can combine: logistics present attestation; platform mints a temporary decryption token.

4. **Commitment + challenge delivery (privacy-preserving fallback):**

   - The shipping provider receives a commitment to the address (hash + salt) and a small-on-demand verification flow: the provider must demonstrate physical proximity at delivery (OTP to user, geolocation check at doorstep, or proof-of-delivery signature) — but this is less friendly for automated planning and still requires the address at delivery time.

### Practical recommendation

Start with **Envelope encryption + gated disclosure**:

- Keep the logic simple and auditable: the winner must present a valid operator credential for that pincode. The platform then re-encrypts/unlocks the address for the winner for a short time window. Combine with audit logs and cryptographic signatures so the user can later see who accessed their address and when.

Longer‑term, integrate **PRE or ABE** so that the platform is not a manual gatekeeper: a re‑encryption key can be derived so winners can directly decrypt without exposing the sym key to the platform.

### Extra privacy enhancements

- **Partial disclosure:** only reveal floor/landmark initially and exact house number only to the final carrier within a short time window.
- **One‑time address reveals:** reveal a masked phone number that forwards to the user via an ephemeral proxy number; reveal full phone/address only after carrier proves coverage.
- **Ephemeral pre-signed pickup tokens:** carriers use tokens that avoid storing addresses in their DBs.

---

# Architecture & components (mapping to repo)

_This maps to the folders I saw in the repo you gave me._

- `UI/` — Frontend checkout UI (Buy with zk-express), user wallet integration (Self), order creation flow.
- `backend/` — Order processor, auction manager, attribute/coverage registry, re-encryption / gating logic, reputation authority service (or a separate `rep` microservice).
- `agent-engine/` — Worker pool that runs auctions, verifies attestation, pings logistics endpoints, and aggregates delivery attestations.
- `rep-contracts/` — Smart contracts for global commitments, revocation registries, and optionally staking / incentives for logistics or reputation anchors.
- `workshop/` — Demo scripts, tests, and example flows for hackday presentations.

---

# API sketches (examples)

These are _conceptual_ endpoints you can implement; adapt to your existing backend routes.

```
POST /api/orders/create
  payload: { pseudonym, product_id, pincode_hash, encrypted_address_blob, delivery_window }
  returns: { order_id, order_commitment }

POST /api/orders/publish
  = publish to logistics pool (no PII)

POST /api/bids
  payload: { order_id, bidder_id, encrypted_bid }

POST /api/award
  platform verifies bidder, awards order, triggers address decryption handoff to winner

POST /api/reputation/prove
  user supplies zk-proof and public inputs; verifier accepts/denies proof

POST /api/attestations/delivery
  logistics posts signed attestation of delivery -> used to update reputation
```

---

# Security, privacy & legal considerations

- **PII handling:** Even though merchants do not store addresses, the platform will. Treat it as PII and apply encryption at rest, strict access controls, and audit logs.
- **Consent:** Users must opt into zk-express and agree to make their (pseudonymous) reputation available to logistics.
- **Attestation abuse:** Logistics could attempt to fake delivery attestations. Mitigate with multi-sourced evidence (timestamps, photos, OTPs, signed PODs from the carrier's registered key).
- **Regulation:** In India, handling PII must follow relevant rules (e.g., any upcoming data protection laws). Consider legal counsel.

---

# Implementation notes & roadmap

**Short-term (MVP)**

- Implement checkout UI + pseudonymous self login
- Publish minimal order metadata (without PII) to a logistics pool
- Implement sealed-bid auction with platform-gated address reveal for winner
- Basic reputation: counts of deliveries and disputes on an off‑chain store; simple signed credential

**Medium-term**

- Implement zk‑credentials and proof circuits: allow `rep >= threshold` proofs
- Implement proxy re‑encryption for address sharing (or ABE)
- Add revocation & short‑lived credentials; dispute resolution workflow

**Longer-term**

- Decentralize reputation authority (multi‑party attestation or DAO governance)
- On‑chain commitments for revocation roots; optional token incentives
- Integrate with national logistics registries / postal hubs




# Developer Quickstart

```
cd UI && yarn install && yarn dev
cd backend && yarn install && yarn dev
cd rep-contracts && npm install && npx hardhat node
```

---

# Open questions

1. Centralized vs consortium reputation authority.
2. Strictness of coverage verification.
3. MVP complexity vs long-term ZK circuits & encryption.
4. Incentives for logistics to prefer high-rep users.

---

