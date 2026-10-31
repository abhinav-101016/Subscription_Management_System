# THE CADENCE LEDGER — DESIGN SYSTEM ARCHITECTURE

## 1. Aesthetic Direction: "The Ledger"
A printed statement and financial ledger turned interactive. Editorial, restrained, and information-dense with disciplined breathing room.

- **Theme & Palette:**
  - **Light (Default):** Warm Paper (`#F6F3EC`) background, Crisp White (`#FFFFFF`) raised cards, Deep Ink (`#17160F`) typography, Hairline rules (`#E4DFD3`).
  - **Night Ledger (Dark):** Night Paper (`#0E0F0C`), Soft Ink (`#E9E5D8`), Dark Hairlines (`#2B2E24`), Deep Surface (`#1B1D17`).
  - **Signature Accent:** Deep Oxblood / Vermilion (`#B3361F` in light, `#D4482E` in dark) used exclusively for primary calls to action, focus rings, and critical financial highlights.
  - **Restrained Status Colors:**
    - Active: Moss Green (`#2A6B48` / `#48A370`)
    - Pending / Quotation: Ochre (`#A06A18` / `#D49835`)
    - Draft: Slate Grey (`#5A6270` / `#8B94A0`)
    - Overdue / Danger: Brick Red (`#A32A2A` / `#E05353`)

---

## 2. Typography Hierarchy & Numerals
- **Display & Large Numerals:** *Fraunces* / *Instrument Serif* high-contrast optical serif. Used for signature KPI numbers and document letterheads.
- **Interface UI:** *Inter* / *Geist* clean sans-serif for labels, table headers, and navigation items.
- **Financial Numerals & Identifiers:** *JetBrains Mono* / *Geist Mono* with `font-variant-numeric: tabular-nums slashed-zero`. Money figures, dates, and contract codes are right-aligned.

---

## 3. Ruled Layout Language
- Single KPI **Ledger Strip**: instead of isolated rounded card soups, key financial metrics sit in a unified container partitioned by vertical rules.
- **40px Dense Tables:** Hairline row dividers, sticky headers, subtle left accent indicators on hover, right-aligned monetary quantities.
- **Paper Document Centering:** Invoices render as authentic physical statements centered on the desk background with subtle watermark stamps (`SETTLED IN FULL`, `PAST DUE ARREARS`).

---

## 4. Component Catalogue
1. **`Button`**: Primary (Oxblood), Secondary (Ruled paper), Ghost, and Danger variants with integrated loading spinner.
2. **`MoneyText`**: Tabular numeral formatter using configurable currency (default `INR`, locale `en-IN`).
3. **`StatusPill`**: Minimalist dot and label status indicators without oversized heavy pills.
4. **`ResourcePicker`**: Real database queries for customer accounts and product catalog variants.
5. **`RecordPaymentDialog`**: Client validation (> 0, ≤ amount due), live remaining balance calculation, and inline server error handling.
6. **`Sidebar` (`⌘B`)**: Collapsible 64px/256px navigation rail strictly filtered by authenticated JWT role.
7. **`CommandPalette` (`⌘K`)**: Omnibox search across subscription numbers, invoice numbers, and system actions.
8. **`ErrorBoundary`**: Graceful failure protection rendering an editorial recovery card.
