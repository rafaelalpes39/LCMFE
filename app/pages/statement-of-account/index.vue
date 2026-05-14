<template>
  <div class="soa-page">

    <!-- MEMBER HEADER CARD -->
    <div class="member-card">
      <div class="member-info">
        <div class="member-avatar" :style="{ background: avatarColor(member.name) }">
          {{ initials(member.name) }}
        </div>
        <div>
          <h2 class="member-name">{{ member.name }}</h2>
          <p class="member-role">{{ member.role }} &nbsp;·&nbsp; {{ member.email }}</p>
        </div>
      </div>
      <div class="soa-summary">
        <div class="summary-item">
          <span class="summary-label">Total Penalties</span>
          <span class="summary-value">{{ penalties.length }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">Total Amount</span>
          <span class="summary-value amount">₱{{ totalAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">Unpaid</span>
          <span class="summary-value unpaid">₱{{ unpaidAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">Paid</span>
          <span class="summary-value paid">₱{{ paidAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="search-wrap">
        <v-icon size="16" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
        <input v-model="search" class="search-input" placeholder="Search penalties…" />
        <button v-if="search" class="search-clear" @click="search = ''">
          <v-icon size="13">mdi-close</v-icon>
        </button>
      </div>
      <div class="filter-chips">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-chip"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-card">
      <table class="soa-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Mass Schedule</th>
            <th>Violation</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(pen, index) in filteredPenalties"
            :key="pen.id"
            class="pen-row"
            :class="{ paid: pen.status === 'paid' }"
          >
            <td class="idx-cell">{{ index + 1 }}</td>
            <td class="date-cell">{{ pen.date }}</td>
            <td class="mass-cell">{{ pen.mass }}</td>
            <td>
              <span class="violation-tag" :class="pen.type">
                <v-icon size="12" class="mr-1">{{ violationIcon(pen.type) }}</v-icon>
                {{ violationLabel(pen.type) }}
              </span>
            </td>
            <td class="amount-cell">₱{{ pen.amount.toFixed(2) }}</td>
            <td>
              <span class="status-tag" :class="pen.status">
                <span class="status-dot" />
                {{ pen.status === 'paid' ? 'Paid' : 'Unpaid' }}
              </span>
            </td>
          </tr>

          <tr v-if="filteredPenalties.length === 0">
            <td colspan="6" class="empty-cell">
              <v-icon size="40" color="#cbd5e1">mdi-clipboard-check-outline</v-icon>
              <p>No penalties found</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- TOTALS ROW -->
      <div class="totals-row" v-if="filteredPenalties.length > 0">
        <span class="totals-label">
          Showing {{ filteredPenalties.length }} record{{ filteredPenalties.length !== 1 ? 's' : '' }}
        </span>
        <div class="totals-right">
          <span class="totals-item paid-total">
            Paid: <strong>₱{{ filteredPaid.toFixed(2) }}</strong>
          </span>
          <span class="totals-sep">·</span>
          <span class="totals-item unpaid-total">
            Unpaid: <strong>₱{{ filteredUnpaid.toFixed(2) }}</strong>
          </span>
          <span class="totals-sep">·</span>
          <span class="totals-item grand-total">
            Total: <strong>₱{{ filteredTotal.toFixed(2) }}</strong>
          </span>
        </div>
      </div>
    </div>


    <!-- LEGEND -->
    <div class="legend">
      <span class="legend-title">Violation Types:</span>
      <div class="legend-items">
        <span v-for="v in violations" :key="v.type" class="violation-tag sm" :class="v.type">
          <v-icon size="11" class="mr-1">{{ violationIcon(v.type) }}</v-icon>
          {{ v.label }} — ₱{{ v.amount.toFixed(2) }}
        </span>
      </div>
    </div>

  </div>
</template>


<script setup>
import { ref, computed } from "vue";
definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

/* ── Member (replace with logged-in user data) ───── */
const member = ref({
  name:  "Maria Santos",
  role:  "Lector",
  email: "m.santos@sjb.org",
});

/* ── Violation types with fixed amounts ──────────── */
const violations = [
  { type: "late",               label: "Late",               amount: 20.00 },
  { type: "absent",             label: "Absent",             amount: 50.00 },
  { type: "subbed",             label: "Subbed",             amount: 30.00 },
  { type: "incomplete-uniform", label: "Incomplete Uniform", amount: 25.00 },
  { type: "no-tshirt",         label: "No T-Shirt",         amount: 15.00 },
];

const violationLabel = (type) => violations.find(v => v.type === type)?.label ?? type;
const violationIcon  = (type) => ({
  "late":               "mdi-clock-alert-outline",
  "absent":             "mdi-account-off-outline",
  "subbed":             "mdi-account-switch-outline",
  "incomplete-uniform": "mdi-tshirt-crew-outline",
  "no-tshirt":          "mdi-tshirt-v-outline",
}[type] ?? "mdi-alert-circle-outline");

/* ── Penalties data ──────────────────────────────── */
const penalties = ref([
  { id: 1,  date: "Jan 7, 2025",  mass: "8:00 AM Sunday",  type: "late",               amount: 20.00, status: "paid"   },
  { id: 2,  date: "Jan 14, 2025", mass: "6:00 AM Sunday",  type: "absent",             amount: 50.00, status: "unpaid" },
  { id: 3,  date: "Jan 21, 2025", mass: "10:00 AM Sunday", type: "incomplete-uniform", amount: 25.00, status: "paid"   },
  { id: 4,  date: "Feb 2, 2025",  mass: "8:00 AM Sunday",  type: "no-tshirt",          amount: 15.00, status: "unpaid" },
  { id: 5,  date: "Feb 9, 2025",  mass: "6:00 AM Sunday",  type: "subbed",             amount: 30.00, status: "unpaid" },
  { id: 6,  date: "Feb 16, 2025", mass: "8:00 AM Sunday",  type: "late",               amount: 20.00, status: "paid"   },
  { id: 7,  date: "Feb 23, 2025", mass: "10:00 AM Sunday", type: "absent",             amount: 50.00, status: "unpaid" },
  { id: 8,  date: "Mar 2, 2025",  mass: "8:00 AM Sunday",  type: "incomplete-uniform", amount: 25.00, status: "unpaid" },
  { id: 9,  date: "Mar 9, 2025",  mass: "6:00 AM Sunday",  type: "late",               amount: 20.00, status: "paid"   },
  { id: 10, date: "Mar 16, 2025", mass: "10:00 AM Sunday", type: "no-tshirt",          amount: 15.00, status: "unpaid" },
]);

/* ── Summary totals ──────────────────────────────── */
const totalAmount  = computed(() => penalties.value.reduce((s, p) => s + p.amount, 0));
const paidAmount   = computed(() => penalties.value.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0));
const unpaidAmount = computed(() => penalties.value.filter(p => p.status === "unpaid").reduce((s, p) => s + p.amount, 0));

/* ── Search & filter ─────────────────────────────── */
const search       = ref("");
const activeFilter = ref("all");

const filters = [
  { value: "all",               label: "All" },
  { value: "unpaid",            label: "Unpaid" },
  { value: "paid",              label: "Paid" },
  { value: "late",              label: "Late" },
  { value: "absent",            label: "Absent" },
  { value: "subbed",            label: "Subbed" },
  { value: "incomplete-uniform",label: "Incomplete Uniform" },
  { value: "no-tshirt",         label: "No T-Shirt" },
];

const filteredPenalties = computed(() => {
  let list = penalties.value;
  if (activeFilter.value === "paid" || activeFilter.value === "unpaid") {
    list = list.filter(p => p.status === activeFilter.value);
  } else if (activeFilter.value !== "all") {
    list = list.filter(p => p.type === activeFilter.value);
  }
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(p =>
      violationLabel(p.type).toLowerCase().includes(q) ||
      p.date.toLowerCase().includes(q) ||
      p.mass.toLowerCase().includes(q)
    );
  }
  return list;
});

const filteredTotal  = computed(() => filteredPenalties.value.reduce((s, p) => s + p.amount, 0));
const filteredPaid   = computed(() => filteredPenalties.value.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0));
const filteredUnpaid = computed(() => filteredPenalties.value.filter(p => p.status === "unpaid").reduce((s, p) => s + p.amount, 0));

/* ── Avatar helpers ──────────────────────────────── */
const palette     = ["#0369a1", "#0891b2", "#0c4a6e", "#0e7490", "#075985"];
const avatarColor = (name) => palette[name.charCodeAt(0) % palette.length];
const initials    = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.soa-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  display: flex; flex-direction: column; gap: 18px;
}

/* ── Member card ─────────────────────────────────── */
.member-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}
.member-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(to right, #0c4a6e, #38bdf8);
}

.member-info { display: flex; align-items: center; gap: 14px; }
.member-avatar {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; font-weight: 700; color: white; flex-shrink: 0;
}
.member-name {
  font-family: "DM Serif Display", serif;
  font-size: 1.15rem; font-weight: 400; color: #0f172a; margin: 0;
}
.member-role { font-size: 0.78rem; color: #94a3b8; margin: 3px 0 0; }

/* Summary */
.soa-summary {
  display: flex; align-items: center; gap: 0;
  background: #f8fafc; border-radius: 12px;
  border: 1px solid #f1f5f9; overflow: hidden;
}
.summary-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 12px 20px; gap: 3px;
}
.summary-label { font-size: 0.68rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.summary-value { font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.summary-value.amount  { color: #0f172a; }
.summary-value.unpaid  { color: #dc2626; }
.summary-value.paid    { color: #15803d; }
.summary-divider { width: 1px; background: #e2e8f0; align-self: stretch; }

/* ── Toolbar ─────────────────────────────────────── */
.toolbar {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
}
.search-wrap {
  position: relative; flex: 1; min-width: 200px;
  display: flex; align-items: center;
}
.search-icon { position: absolute; left: 12px; pointer-events: none; }
.search-input {
  width: 100%; padding: 9px 34px 9px 36px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif;
  color: #0f172a; background: white; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus { border-color: #0369a1; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.search-input::placeholder { color: #cbd5e1; }
.search-clear {
  position: absolute; right: 10px; background: none; border: none;
  cursor: pointer; color: #94a3b8; display: flex; align-items: center;
}
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip {
  padding: 6px 13px; border: 1.5px solid #e2e8f0; border-radius: 20px;
  background: white; font-size: 0.78rem; font-weight: 500; color: #475569;
  cursor: pointer; transition: all 0.15s; font-family: "DM Sans", sans-serif;
  white-space: nowrap;
}
.filter-chip:hover  { border-color: #0369a1; color: #0369a1; }
.filter-chip.active { border-color: #0369a1; background: #eff6ff; color: #0369a1; font-weight: 600; }

/* ── Table ───────────────────────────────────────── */
.table-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0; overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.soa-table { width: 100%; border-collapse: collapse; }
.soa-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.soa-table th {
  padding: 11px 18px; text-align: left;
  font-size: 0.7rem; font-weight: 700; color: #64748b;
  letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap;
}
.soa-table td { padding: 13px 18px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.pen-row { transition: background 0.1s; }
.pen-row:hover { background: #fafcff; }
.pen-row.paid  { opacity: 0.65; }
.pen-row:last-child td { border-bottom: none; }

.idx-cell  { color: #cbd5e1; font-size: 0.78rem; width: 36px; }
.date-cell { font-size: 0.82rem; color: #475569; white-space: nowrap; }
.mass-cell { font-size: 0.82rem; color: #64748b; white-space: nowrap; }
.amount-cell { font-size: 0.9rem; font-weight: 700; color: #0f172a; white-space: nowrap; }

/* Violation tags */
.violation-tag {
  display: inline-flex; align-items: center;
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 700; white-space: nowrap;
  letter-spacing: 0.02em;
}
.violation-tag.late               { background: #fefce8; color: #a16207; border: 1px solid #fde68a; }
.violation-tag.absent             { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.violation-tag.subbed             { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.violation-tag.incomplete-uniform { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.violation-tag.no-tshirt          { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.violation-tag.sm { font-size: 0.68rem; padding: 3px 8px; }

/* Status tags */
.status-tag {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 700;
}
.status-tag.paid   { background: #dcfce7; color: #15803d; }
.status-tag.unpaid { background: #fef2f2; color: #dc2626; }
.status-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.status-tag.paid   .status-dot { background: #22c55e; }
.status-tag.unpaid .status-dot { background: #ef4444; }

/* Totals row */
.totals-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-top: 1px solid #f1f5f9;
  background: #fafcff; flex-wrap: wrap; gap: 8px;
}
.totals-label { font-size: 0.78rem; color: #94a3b8; }
.totals-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.totals-item  { font-size: 0.78rem; color: #64748b; }
.totals-item strong { font-weight: 700; }
.paid-total strong   { color: #15803d; }
.unpaid-total strong { color: #dc2626; }
.grand-total strong  { color: #0f172a; }
.totals-sep { color: #cbd5e1; font-size: 0.78rem; }

/* Empty */
.empty-cell { text-align: center; padding: 48px !important; color: #94a3b8; }
.empty-cell p { margin: 10px 0 0; font-size: 0.875rem; }

/* ── Legend ──────────────────────────────────────── */
.legend {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap; padding: 14px 18px;
  background: white; border-radius: 12px;
  border: 1px solid #f1f5f9;
}
.legend-title {
  font-size: 0.75rem; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.legend-items { display: flex; gap: 8px; flex-wrap: wrap; }
</style>