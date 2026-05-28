<template>
  <div class="obl-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div class="header-text">
        <h1 class="page-title">My Obligations</h1>
        <p class="page-sub">Your personal billing and payment summary</p>
      </div>
      <div class="header-badge" v-if="!loading">
        <span class="sdot" :class="overallStatus" />
        {{ overallStatusLabel }}
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="full-loading">
      <div class="mini-spinner" />
      <p>Loading your obligations…</p>
    </div>

    <template v-else>

      <!-- ── ANALYTICS STRIP ── -->
      <div class="analytics-strip">

        <div class="acard acard-total">
          <div class="acard-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="acard-body">
            <div class="acard-label">Total Obligations</div>
            <div class="acard-value">{{ obligations.length }}</div>
            <div class="acard-sub">items assigned</div>
          </div>
        </div>

        <div class="acard acard-amount">
          <div class="acard-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 7v1m0 8v1M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 2.5S9.5 13 9.5 14.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="acard-body">
            <div class="acard-label">Total Amount</div>
            <div class="acard-value amount-val">₱ {{ fmt(totalAmount) }}</div>
            <div class="acard-sub">across all items</div>
          </div>
        </div>

        <div class="acard acard-paid">
          <div class="acard-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </div>
          <div class="acard-body">
            <div class="acard-label">Paid</div>
            <div class="acard-value green-val">₱ {{ fmt(paidAmount) }}</div>
            <div class="acard-sub">{{ paidCount }} item{{ paidCount !== 1 ? 's' : '' }} settled</div>
          </div>
        </div>

        <div class="acard acard-unpaid">
          <div class="acard-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="acard-body">
            <div class="acard-label">Remaining Balance</div>
            <div class="acard-value red-val">₱ {{ fmt(unpaidAmount) }}</div>
            <div class="acard-sub">{{ unpaidCount }} item{{ unpaidCount !== 1 ? 's' : '' }} pending</div>
          </div>
        </div>

      </div>

      <!-- ── PROGRESS CARD ── -->
      <div class="progress-card" v-if="obligations.length > 0">
        <div class="progress-top">
          <div>
            <div class="progress-label">Payment Progress</div>
            <div class="progress-sub">{{ paidCount }} of {{ obligations.length }} obligations settled</div>
          </div>
          <div class="progress-pct" :class="pctClass">{{ progressPct }}%</div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :class="pctClass" :style="{ width: progressPct + '%' }" />
        </div>
        <div class="progress-legend">
          <span class="leg-item"><span class="leg-dot green" />Paid · ₱ {{ fmt(paidAmount) }}</span>
          <span class="leg-item"><span class="leg-dot red" />Unpaid · ₱ {{ fmt(unpaidAmount) }}</span>
        </div>
      </div>

      <!-- ── TOOLBAR ── -->
      <div class="toolbar">
        <div class="search-wrap">
          <svg class="search-icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#94a3b8" stroke-width="2"/>
            <path d="m16.5 16.5 4 4" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input v-model="search" class="search-input" placeholder="Search obligation…" />
          <button v-if="search" class="search-clear" @click="search = ''">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="filter-tabs">
          <button
            v-for="f in filters" :key="f.value"
            class="ftab" :class="{ active: activeFilter === f.value }"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
            <span class="ftab-count">{{ filterCount(f.value) }}</span>
          </button>
        </div>
      </div>

      <!-- ── OBLIGATIONS LIST ── -->
      <div v-if="filteredObligations.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="empty-title">No obligations found</p>
        <p class="empty-sub">{{ activeFilter !== 'all' ? 'Try switching the filter above' : 'You have no obligations assigned yet' }}</p>
      </div>

      <div v-else class="obl-list">
        <div
          v-for="(obl, idx) in filteredObligations"
          :key="obl.id"
          class="obl-card"
          :class="{ 'obl-paid': obl._paid, 'obl-unpaid': !obl._paid }"
          :style="{ animationDelay: (idx * 0.045) + 's' }"
        >
          <!-- Accent bar -->
          <div class="obl-accent" :class="obl._paid ? 'accent-paid' : 'accent-unpaid'" />

          <!-- Icon -->
          <div class="obl-icon-wrap" :class="obl._paid ? 'icon-paid-bg' : 'icon-unpaid-bg'">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path v-if="obl._paid" d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-if="obl._paid" d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" stroke="currentColor" stroke-width="1.8"/>
              <path v-if="!obl._paid" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Content -->
          <div class="obl-content">
            <div class="obl-reason" :class="{ 'obl-reason-paid': obl._paid }">{{ obl.reason }}</div>
            <div class="obl-meta">
              <span class="obl-date" v-if="obl.date">{{ formatDate(obl.date) }}</span>
              <span class="obl-status-chip" :class="obl._paid ? 'chip-paid' : 'chip-unpaid'">
                <span class="sdot" :class="obl._paid ? 'paid' : 'unpaid'" />
                {{ obl._paid ? 'Paid' : 'Unpaid' }}
              </span>
            </div>
          </div>

          <!-- Amount -->
          <div class="obl-amount-wrap">
            <div class="obl-amount" :class="obl._paid ? 'amount-paid' : 'amount-unpaid'">
              ₱ {{ fmt(obl.amount) }}
            </div>
            <div class="obl-label" :class="obl._paid ? 'label-paid' : 'label-unpaid'">
              {{ obl._paid ? 'Settled' : 'Due' }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── SUMMARY FOOTER ── -->
      <div class="summary-footer" v-if="filteredObligations.length > 0">
        <span class="sf-count">
          Showing {{ filteredObligations.length }} of {{ obligations.length }} obligation{{ obligations.length !== 1 ? 's' : '' }}
        </span>
        <div class="sf-totals">
          <span class="sf-item sf-paid">
            <span class="leg-dot green" />
            Paid: ₱ {{ fmt(filteredObligations.filter(o=>o._paid).reduce((s,o)=>s+o.amount,0)) }}
          </span>
          <span class="sf-divider" />
          <span class="sf-item sf-unpaid">
            <span class="leg-dot red" />
            Unpaid: ₱ {{ fmt(filteredObligations.filter(o=>!o._paid).reduce((s,o)=>s+o.amount,0)) }}
          </span>
        </div>
      </div>

    </template>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const config = useRuntimeConfig();
const BASE   = config.public.apiBase;

const auth = useAuthStore();
const { user } = storeToRefs(auth);

const loading     = ref(true);
const obligations = ref([]);

const fetchMyObligations = async () => {
  loading.value = true;
  try {
    const userId = user.value?.id ?? user.value?.user?.id;
    if (!userId) {
      console.warn("No authenticated user ID found.");
      obligations.value = [];
      return;
    }

    // GET /api/obligations?user_id=<id>
    // Returns either an array or { obligations: [...] }
    const data = await $fetch(`${BASE}/api/obligations`, {
      params: { user_id: userId },
    });

    const list = Array.isArray(data) ? data : (data.obligations ?? []);

    // Filter client-side as a safety net in case API ignores the param
    obligations.value = list
      .filter(o => Number(o.user_id) === Number(userId))
      .map(o => ({
        id:     o.id,
        reason: o.reason,
        amount: Number(o.amount),
        _paid:  Boolean(o.is_paid),
        date:   o.created_at ?? o.date ?? null,
      }));
  } catch (e) {
    console.error("Failed to load obligations:", e);
    obligations.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchMyObligations);

/* ── Computed ─────────────────────────────────────── */
const totalAmount  = computed(() => obligations.value.reduce((s, o) => s + o.amount, 0));
const paidAmount   = computed(() => obligations.value.filter(o => o._paid).reduce((s, o) => s + o.amount, 0));
const unpaidAmount = computed(() => obligations.value.filter(o => !o._paid).reduce((s, o) => s + o.amount, 0));
const paidCount    = computed(() => obligations.value.filter(o => o._paid).length);
const unpaidCount  = computed(() => obligations.value.filter(o => !o._paid).length);

const progressPct = computed(() => {
  if (!obligations.value.length || !totalAmount.value) return 0;
  return Math.round((paidAmount.value / totalAmount.value) * 100);
});
const pctClass = computed(() => {
  const p = progressPct.value;
  if (p === 100) return 'pct-full';
  if (p >= 50)   return 'pct-half';
  return 'pct-low';
});
const overallStatus = computed(() => {
  if (unpaidCount.value === 0 && obligations.value.length > 0) return 'paid';
  if (paidCount.value === 0)   return 'unpaid';
  return 'partial';
});
const overallStatusLabel = computed(() => ({
  paid: 'Fully Settled', unpaid: 'Pending Payment', partial: 'Partially Paid',
}[overallStatus.value]));

/* ── Filter / search ─────────────────────────────── */
const search       = ref("");
const activeFilter = ref("all");
const filters      = [
  { value: "all",    label: "All"    },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid",   label: "Paid"   },
];
const filterCount = (val) => {
  if (val === "all")    return obligations.value.length;
  if (val === "paid")   return paidCount.value;
  if (val === "unpaid") return unpaidCount.value;
  return 0;
};
const filteredObligations = computed(() =>
  obligations.value.filter(o => {
    const matchFilter =
      activeFilter.value === "all"    ||
      (activeFilter.value === "paid"   &&  o._paid) ||
      (activeFilter.value === "unpaid" && !o._paid);
    const q = search.value.toLowerCase();
    return matchFilter && (!q || o.reason.toLowerCase().includes(q));
  })
);

/* ── Helpers ─────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "";
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
/* ─────────────────────────────────────────────────
   BASE
───────────────────────────────────────────────── */
* { box-sizing: border-box; }

.obl-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  width: 100%;
  padding-bottom: 32px;
}

/* ─────────────────────────────────────────────────
   HEADER
───────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 14px;
  flex-wrap: wrap;
}
.page-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.6rem; font-weight: 400; color: #0f172a; margin: 0;
}
.page-sub { font-size: 0.78rem; color: #94a3b8; margin: 4px 0 0; }

.header-badge {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 16px; border-radius: 99px;
  font-size: 0.78rem; font-weight: 600;
  background: white; border: 1.5px solid #e2e8f0;
  color: #475569; flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  white-space: nowrap;
}

/* ─────────────────────────────────────────────────
   LOADING
───────────────────────────────────────────────── */
.full-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 20px;
  color: #94a3b8; font-size: 0.85rem;
}
.mini-spinner {
  width: 24px; height: 24px;
  border: 2.5px solid #e2e8f0; border-top-color: #0369a1;
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─────────────────────────────────────────────────
   ANALYTICS STRIP
───────────────────────────────────────────────── */
.analytics-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
  width: 100%;
}

.acard {
  background: white; border-radius: 14px;
  border: 1px solid #f1f5f9;
  padding: 16px 18px;
  display: flex; gap: 12px; align-items: flex-start;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.15s;
}
.acard:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); }

.acard-icon {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.acard-total  .acard-icon { background: #eff6ff; color: #0369a1; }
.acard-amount .acard-icon { background: #f5f3ff; color: #7c3aed; }
.acard-paid   .acard-icon { background: #f0fdf4; color: #15803d; }
.acard-unpaid .acard-icon { background: #fef2f2; color: #dc2626; }

.acard-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.acard-label {
  font-size: 0.67rem; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.acard-value {
  font-size: 1.25rem; font-weight: 700; color: #0f172a;
  line-height: 1.2; margin-top: 4px;
}
.acard-sub { font-size: 0.68rem; color: #94a3b8; margin-top: 3px; }

.amount-val { font-size: 1.05rem; color: #7c3aed; }
.green-val  { font-size: 1.05rem; color: #15803d; }
.red-val    { font-size: 1.05rem; color: #dc2626; }

/* ─────────────────────────────────────────────────
   PROGRESS CARD
───────────────────────────────────────────────── */
.progress-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 18px 22px; margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; gap: 12px;
  width: 100%;
}
.progress-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
}
.progress-label { font-size: 0.875rem; font-weight: 700; color: #334155; }
.progress-sub   { font-size: 0.72rem; color: #94a3b8; margin-top: 3px; }
.progress-pct {
  font-size: 1.5rem; font-weight: 700; flex-shrink: 0;
  font-family: "DM Serif Display", serif; line-height: 1;
}
.pct-full { color: #15803d; }
.pct-half { color: #0369a1; }
.pct-low  { color: #dc2626; }

.progress-track {
  width: 100%; height: 10px;
  background: #f1f5f9; border-radius: 99px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 99px;
  transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 4px;
}
.progress-fill.pct-full { background: linear-gradient(90deg, #16a34a, #22c55e); }
.progress-fill.pct-half { background: linear-gradient(90deg, #0369a1, #0ea5e9); }
.progress-fill.pct-low  { background: linear-gradient(90deg, #b91c1c, #ef4444); }

.progress-legend {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
}
.leg-item {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.76rem; font-weight: 600; color: #64748b;
}
.leg-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  display: inline-block;
}
.leg-dot.green { background: #22c55e; }
.leg-dot.red   { background: #ef4444; }

/* ─────────────────────────────────────────────────
   TOOLBAR
───────────────────────────────────────────────── */
.toolbar {
  display: flex; gap: 10px; margin-bottom: 12px;
  align-items: center; flex-wrap: wrap; width: 100%;
}
.search-wrap {
  position: relative; flex: 1; min-width: 200px;
  display: flex; align-items: center;
}
.search-icon-svg {
  position: absolute; left: 12px; pointer-events: none; flex-shrink: 0;
}
.search-input {
  width: 100%; padding: 10px 36px 10px 38px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif;
  color: #0f172a; background: white; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus {
  border-color: #0369a1;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}
.search-input::placeholder { color: #cbd5e1; }
.search-clear {
  position: absolute; right: 11px; background: none; border: none;
  cursor: pointer; color: #94a3b8; display: flex; align-items: center;
  padding: 2px; border-radius: 4px;
  transition: color 0.15s;
}
.search-clear:hover { color: #475569; }

.filter-tabs { display: flex; gap: 5px; flex-shrink: 0; }
.ftab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 15px; border: 1.5px solid #e2e8f0; border-radius: 20px;
  background: white; font-size: 0.78rem; font-weight: 500; color: #475569;
  cursor: pointer; font-family: "DM Sans", sans-serif; transition: all 0.15s;
  white-space: nowrap;
}
.ftab:hover  { border-color: #93c5fd; color: #0369a1; background: #f8fbff; }
.ftab.active { border-color: #0369a1; background: #eff6ff; color: #0369a1; font-weight: 700; }

.ftab-count {
  background: #f1f5f9; color: #64748b;
  font-size: 0.66rem; font-weight: 700;
  padding: 2px 7px; border-radius: 99px;
  min-width: 20px; text-align: center;
  line-height: 1.4;
  transition: background 0.15s, color 0.15s;
}
.ftab.active .ftab-count { background: #bfdbfe; color: #1e40af; }

/* ─────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; padding: 64px 20px;
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0;
}
.empty-icon  { opacity: 0.35; margin-bottom: 4px; }
.empty-title { font-size: 0.9rem; font-weight: 600; color: #94a3b8; margin: 0; }
.empty-sub   { font-size: 0.78rem; color: #cbd5e1; margin: 0; }

/* ─────────────────────────────────────────────────
   OBLIGATIONS LIST
───────────────────────────────────────────────── */
.obl-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.obl-card {
  background: white;
  border-radius: 13px;
  border: 1px solid #e2e8f0;
  display: flex; align-items: stretch;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  animation: slideIn 0.28s ease both;
  transition: box-shadow 0.15s, transform 0.15s, opacity 0.15s;
}
.obl-card:hover {
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.obl-paid           { opacity: 0.68; border-color: #e2e8f0; }
.obl-paid:hover     { opacity: 1; }
.obl-unpaid         { border-color: #fed7aa; background: #fffcf9; }
.obl-unpaid:hover   { border-color: #fdba74; }

/* ── Accent bar ── */
.obl-accent {
  width: 5px; flex-shrink: 0; align-self: stretch;
}
.accent-paid   { background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%); }
.accent-unpaid { background: linear-gradient(180deg, #fb923c 0%, #ef4444 100%); }

/* ── Icon ── */
.obl-icon-wrap {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  margin: auto 14px;
}
.icon-paid-bg   { background: #f0fdf4; color: #15803d; }
.icon-unpaid-bg { background: #fff7ed; color: #c2410c; }

/* ── Content ── */
.obl-content {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center;
  gap: 5px; padding: 15px 8px 15px 0;
}
.obl-reason {
  font-size: 0.9rem; font-weight: 600; color: #0f172a;
  line-height: 1.3; word-break: break-word;
}
.obl-reason-paid { text-decoration: line-through; color: #94a3b8; font-weight: 500; }

.obl-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.obl-date  { font-size: 0.7rem; color: #94a3b8; }

.obl-status-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.66rem; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
}
.chip-paid   { background: #f0fdf4; border: 1px solid #86efac; color: #15803d; }
.chip-unpaid { background: #fff7ed; border: 1px solid #fdba74; color: #c2410c; }

/* ── Amount ── */
.obl-amount-wrap {
  display: flex; flex-direction: column; align-items: flex-end;
  justify-content: center;
  gap: 3px; padding: 15px 18px 15px 10px; flex-shrink: 0;
}
.obl-amount {
  font-size: 1.05rem; font-weight: 700; white-space: nowrap;
  font-family: "DM Serif Display", serif;
}
.amount-paid   { color: #15803d; }
.amount-unpaid { color: #c2410c; }

.obl-label { font-size: 0.65rem; font-weight: 700; text-align: right; letter-spacing: 0.03em; }
.label-paid   { color: #4ade80; }
.label-unpaid { color: #fb923c; }

/* ─────────────────────────────────────────────────
   SUMMARY FOOTER
───────────────────────────────────────────────── */
.summary-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding: 11px 16px;
  background: white; border-radius: 10px;
  border: 1px solid #f1f5f9;
  gap: 10px; flex-wrap: wrap;
}
.sf-count { font-size: 0.76rem; color: #94a3b8; }
.sf-totals { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sf-item {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.76rem; font-weight: 600; color: #64748b;
}
.sf-divider {
  width: 1px; height: 14px; background: #e2e8f0; flex-shrink: 0;
}

/* ─────────────────────────────────────────────────
   STATUS DOT
───────────────────────────────────────────────── */
.sdot {
  width: 7px; height: 7px; border-radius: 50%;
  flex-shrink: 0; display: inline-block;
}
.sdot.paid    { background: #22c55e; }
.sdot.unpaid  { background: #ef4444; }
.sdot.partial { background: #eab308; }

/* ─────────────────────────────────────────────────
   RESPONSIVE — TABLET  ≤ 768px
───────────────────────────────────────────────── */
@media (max-width: 768px) {
  .analytics-strip { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}

/* ─────────────────────────────────────────────────
   RESPONSIVE — MOBILE  ≤ 600px
───────────────────────────────────────────────── */
@media (max-width: 600px) {
  .obl-page { padding-bottom: 24px; }

  .page-title  { font-size: 1.3rem; }
  .page-header { margin-bottom: 14px; gap: 10px; }
  .header-badge { font-size: 0.73rem; padding: 6px 12px; }

  .analytics-strip { gap: 8px; margin-bottom: 12px; }
  .acard { padding: 12px 13px; gap: 9px; border-radius: 12px; }
  .acard-icon { width: 34px; height: 34px; border-radius: 9px; }
  .acard-value { font-size: 1.05rem; margin-top: 2px; }
  .amount-val, .green-val, .red-val { font-size: 0.9rem; }
  .acard-label { font-size: 0.63rem; }
  .acard-sub   { font-size: 0.63rem; }

  .progress-card { padding: 14px 15px; margin-bottom: 12px; gap: 10px; }
  .progress-pct  { font-size: 1.2rem; }
  .progress-label { font-size: 0.82rem; }

  .toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .search-wrap { min-width: unset; }
  .filter-tabs { display: flex; gap: 6px; }
  .ftab { flex: 1; justify-content: center; padding: 8px 8px; font-size: 0.75rem; }

  .obl-card { border-radius: 11px; }
  .obl-accent { width: 4px; }
  .obl-icon-wrap { width: 34px; height: 34px; margin: auto 10px; border-radius: 9px; }
  .obl-reason { font-size: 0.84rem; }
  .obl-content { padding: 12px 6px 12px 0; gap: 4px; }
  .obl-amount { font-size: 0.95rem; }
  .obl-amount-wrap { padding: 12px 13px 12px 6px; }
  .obl-label { font-size: 0.62rem; }
  .obl-date  { font-size: 0.67rem; }

  .summary-footer { flex-direction: column; align-items: flex-start; gap: 5px; padding: 10px 13px; }
  .sf-totals { gap: 8px; flex-wrap: wrap; }
  .sf-divider { display: none; }
}

/* ─────────────────────────────────────────────────
   RESPONSIVE — SMALL MOBILE  ≤ 400px
───────────────────────────────────────────────── */
@media (max-width: 400px) {
  .page-title { font-size: 1.15rem; }

  .acard { padding: 10px 11px; gap: 7px; }
  .acard-icon { width: 30px; height: 30px; border-radius: 8px; }
  .acard-value { font-size: 0.95rem; }
  .amount-val, .green-val, .red-val { font-size: 0.82rem; }
  .acard-label { font-size: 0.58rem; letter-spacing: 0.04em; }
  .acard-sub { display: none; }

  .obl-icon-wrap { display: none; }
  .obl-content { padding: 12px 0; }
  .obl-amount-wrap { padding: 12px 11px 12px 4px; }
  .obl-amount { font-size: 0.88rem; }

  .ftab-count { display: none; }
  .ftab { font-size: 0.72rem; padding: 7px 6px; }
}
</style>