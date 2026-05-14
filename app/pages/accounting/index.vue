<template>
  <div class="acc-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Accounting</h1>
        <p class="page-sub">Ministry billing, penalties, and payment tracking</p>
      </div>
      <button class="btn-primary" @click="openAddPenaltyModal(null)">
        <v-icon size="16" class="mr-1">mdi-plus</v-icon>
        Add Penalty
      </button>
    </div>

    <!-- SUMMARY CARDS -->
    <div class="summary-row">
      <div class="summary-card total-card">
        <div class="sc-icon">
          <v-icon size="20" color="#0369a1">mdi-receipt-text-outline</v-icon>
        </div>
        <div class="sc-body">
          <div class="sc-label">Total Billed</div>
          <div class="sc-value">₱ {{ fmt(totalBilled) }}</div>
        </div>
      </div>
      <div class="summary-card unpaid-card">
        <div class="sc-icon">
          <v-icon size="20" color="#dc2626">mdi-alert-circle-outline</v-icon>
        </div>
        <div class="sc-body">
          <div class="sc-label">Total Unpaid</div>
          <div class="sc-value red">₱ {{ fmt(totalUnpaid) }}</div>
          <div class="sc-sub">{{ unpaidCount }} member{{ unpaidCount !== 1 ? 's' : '' }} with balance</div>
        </div>
      </div>
      <div class="summary-card paid-card">
        <div class="sc-icon">
          <v-icon size="20" color="#15803d">mdi-check-circle-outline</v-icon>
        </div>
        <div class="sc-body">
          <div class="sc-label">Total Collected</div>
          <div class="sc-value green">₱ {{ fmt(totalPaid) }}</div>
          <div class="sc-sub">{{ paidCount }} member{{ paidCount !== 1 ? 's' : '' }} fully paid</div>
        </div>
      </div>
      <div class="summary-card penalty-card">
        <div class="sc-icon">
          <v-icon size="20" color="#c2410c">mdi-gavel</v-icon>
        </div>
        <div class="sc-body">
          <div class="sc-label">Penalties Issued</div>
          <div class="sc-value orange">₱ {{ fmt(totalPenalties) }}</div>
          <div class="sc-sub">{{ penaltyCount }} active penalt{{ penaltyCount !== 1 ? 'ies' : 'y' }}</div>
        </div>
      </div>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="search-wrap">
        <v-icon size="16" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
        <input v-model="search" class="search-input" placeholder="Search member…" />
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
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-card">
      <table class="acc-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Member</th>
            <th>Role</th>
            <th>Monthly Due</th>
            <th>Penalties</th>
            <th>Total Due</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(member, index) in filteredMembers"
            :key="member.id"
            class="acc-row"
            :class="{
              'row-paid': member.status === 'paid',
              'row-unpaid': member.status === 'unpaid',
              'row-partial': member.status === 'partial',
            }"
          >
            <td class="idx-cell">{{ index + 1 }}</td>

            <!-- Member -->
            <td>
              <div class="member-cell">
                <div class="avatar" :style="{ background: avatarColor(member.name) }">
                  {{ initials(member.name) }}
                </div>
                <div class="member-info">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-email">{{ member.email }}</span>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td>
              <span class="role-badge" :class="member.role.toLowerCase()">{{ member.role }}</span>
            </td>

            <!-- Monthly due -->
            <td class="amount-cell">₱ {{ fmt(member.monthlyDue) }}</td>

            <!-- Penalties -->
            <td>
              <div class="penalty-cell">
                <span v-if="member.penalties.length === 0" class="no-penalty">—</span>
                <div v-else class="penalty-list">
                  <div v-for="p in member.penalties" :key="p.id" class="penalty-item">
                    <span class="penalty-label">{{ p.reason }}</span>
                    <span class="penalty-amt">₱ {{ fmt(p.amount) }}</span>
                    <button class="remove-penalty-btn" @click="removePenalty(member, p.id)" title="Remove penalty">
                      <v-icon size="11">mdi-close</v-icon>
                    </button>
                  </div>
                </div>
              </div>
            </td>

            <!-- Total due -->
            <td class="amount-cell total">
              ₱ {{ fmt(member.monthlyDue + member.penalties.reduce((s, p) => s + p.amount, 0)) }}
            </td>

            <!-- Status -->
            <td>
              <div class="status-wrap" v-click-outside="() => closeStatusMenu(member.id)">
                <button
                  class="status-btn"
                  :class="member.status"
                  @click.stop="toggleStatusMenu(member.id)"
                >
                  <span class="sdot" :class="member.status" />
                  {{ statusLabel(member.status) }}
                  <v-icon size="13" class="ml-1">mdi-chevron-down</v-icon>
                </button>
                <transition name="dropdown">
                  <div v-if="openStatusId === member.id" class="status-menu">
                    <button
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      class="status-opt"
                      :class="{ current: member.status === opt.value }"
                      @click="setStatus(member, opt.value)"
                    >
                      <span class="sdot" :class="opt.value" />
                      {{ opt.label }}
                      <v-icon v-if="member.status === opt.value" size="13" class="ml-auto">mdi-check</v-icon>
                    </button>
                  </div>
                </transition>
              </div>
            </td>

            <!-- Actions -->
            <td>
              <div class="action-btns">
                <button class="act-btn penalty-btn" @click="openAddPenaltyModal(member)" title="Add penalty">
                  <v-icon size="14">mdi-gavel</v-icon>
                  <span>Penalty</span>
                </button>
                <button class="act-btn view-btn" @click="openDetailModal(member)" title="View details">
                  <v-icon size="14">mdi-eye-outline</v-icon>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredMembers.length === 0">
            <td colspan="8" class="empty-cell">
              <v-icon size="38" color="#cbd5e1">mdi-account-search-outline</v-icon>
              <p>No members found</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <!-- ── ADD PENALTY MODAL ──────────────────────── -->
    <transition name="modal">
      <div v-if="showPenaltyModal" class="modal-backdrop" @click.self="showPenaltyModal = false">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Add Penalty</h2>
              <p class="modal-sub" v-if="penaltyTarget">
                For: <strong>{{ penaltyTarget.name }}</strong>
              </p>
              <p class="modal-sub" v-else>Select a member and add a penalty</p>
            </div>
            <button class="modal-close" @click="showPenaltyModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- Member selector (only when no target pre-selected) -->
            <div class="form-field" v-if="!penaltyTarget">
              <label class="field-label">Member <span class="req">*</span></label>
              <div class="select-wrap">
                <select v-model="penaltyForm.memberId" class="f-select">
                  <option value="">Select member…</option>
                  <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
                <v-icon size="15" class="select-arrow">mdi-chevron-down</v-icon>
              </div>
            </div>

            <!-- Reason -->
            <div class="form-field">
              <label class="field-label">Reason <span class="req">*</span></label>
              <input v-model="penaltyForm.reason" class="f-input" placeholder="e.g. Absent without notice" />
            </div>

            <!-- Amount -->
            <div class="form-field">
              <label class="field-label">Amount (₱) <span class="req">*</span></label>
              <div class="amount-input-wrap">
                <span class="currency-prefix">₱</span>
                <input
                  v-model.number="penaltyForm.amount"
                  type="number"
                  min="0"
                  class="f-input has-prefix"
                  placeholder="0.00"
                />
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showPenaltyModal = false">Cancel</button>
            <button
              class="btn-save penalty-save"
              @click="savePenalty"
              :disabled="!penaltyForm.reason.trim() || !penaltyForm.amount"
            >
              <v-icon size="15" class="mr-1">mdi-gavel</v-icon>
              Add Penalty
            </button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ── MEMBER DETAIL MODAL ────────────────────── -->
    <transition name="modal">
      <div v-if="showDetailModal && detailMember" class="modal-backdrop" @click.self="showDetailModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="detail-header-content">
              <div class="avatar lg" :style="{ background: avatarColor(detailMember.name) }">
                {{ initials(detailMember.name) }}
              </div>
              <div>
                <h2 class="modal-title">{{ detailMember.name }}</h2>
                <p class="modal-sub">{{ detailMember.email }} · <span class="role-badge sm" :class="detailMember.role.toLowerCase()">{{ detailMember.role }}</span></p>
              </div>
            </div>
            <button class="modal-close" @click="showDetailModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- Mini summary -->
            <div class="detail-summary">
              <div class="ds-item">
                <span class="ds-label">Monthly Due</span>
                <span class="ds-value">₱ {{ fmt(detailMember.monthlyDue) }}</span>
              </div>
              <div class="ds-item">
                <span class="ds-label">Penalties</span>
                <span class="ds-value orange">₱ {{ fmt(detailMember.penalties.reduce((s,p) => s+p.amount, 0)) }}</span>
              </div>
              <div class="ds-divider" />
              <div class="ds-item">
                <span class="ds-label total-label">Total Due</span>
                <span class="ds-value total-val">₱ {{ fmt(detailMember.monthlyDue + detailMember.penalties.reduce((s,p) => s+p.amount, 0)) }}</span>
              </div>
              <div class="ds-item">
                <span class="ds-label">Status</span>
                <span class="status-badge-inline" :class="detailMember.status">
                  {{ statusLabel(detailMember.status) }}
                </span>
              </div>
            </div>

            <!-- Penalties list -->
            <div class="detail-section">
              <div class="detail-section-header">
                <span class="detail-section-title">Penalties</span>
                <button class="link-btn" @click="showDetailModal = false; openAddPenaltyModal(detailMember)">
                  <v-icon size="13" class="mr-1">mdi-plus</v-icon>Add
                </button>
              </div>

              <div v-if="detailMember.penalties.length === 0" class="no-data">
                No penalties for this member
              </div>
              <div v-else class="detail-penalty-list">
                <div v-for="p in detailMember.penalties" :key="p.id" class="detail-penalty-row">
                  <div class="dp-left">
                    <v-icon size="14" color="#c2410c" class="mr-2">mdi-gavel</v-icon>
                    <span class="dp-reason">{{ p.reason }}</span>
                  </div>
                  <div class="dp-right">
                    <span class="dp-amount">₱ {{ fmt(p.amount) }}</span>
                    <button class="remove-penalty-btn" @click="removePenalty(detailMember, p.id)">
                      <v-icon size="12">mdi-trash-can-outline</v-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showDetailModal = false">Close</button>
            <button
              class="btn-save"
              @click="setStatus(detailMember, detailMember.status === 'paid' ? 'unpaid' : 'paid'); showDetailModal = false"
            >
              <v-icon size="15" class="mr-1">{{ detailMember.status === 'paid' ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline' }}</v-icon>
              Mark as {{ detailMember.status === 'paid' ? 'Unpaid' : 'Paid' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed } from "vue";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});
/* ── Click-outside directive ─────────────────────── */
const vClickOutside = {
  mounted(el, binding) {
    el._co = (e) => { if (!el.contains(e.target)) binding.value(e); };
    document.addEventListener("click", el._co);
  },
  unmounted(el) { document.removeEventListener("click", el._co); },
};

/* ── Status options ──────────────────────────────── */
const statusOptions = [
  { value: "unpaid",  label: "Unpaid"  },
  { value: "partial", label: "Partial" },
  { value: "paid",    label: "Paid"    },
];
const statusLabel = (s) => statusOptions.find(o => o.value === s)?.label ?? s;

/* ── Members data ────────────────────────────────── */
const members = ref([
  {
    id: 1, name: "Maria Santos",    email: "m.santos@sjb.org",   role: "Lector",        monthlyDue: 100,
    status: "paid",
    penalties: [],
  },
  {
    id: 2, name: "Jose Reyes",      email: "j.reyes@sjb.org",    role: "Commentator",   monthlyDue: 100,
    status: "unpaid",
    penalties: [{ id: 1, reason: "Absent without notice", amount: 50 }],
  },
  {
    id: 3, name: "Ana Cruz",        email: "a.cruz@sjb.org",     role: "Coordinator",   monthlyDue: 150,
    status: "partial",
    penalties: [],
  },
  {
    id: 4, name: "Pedro Dela Cruz", email: "p.delacruz@sjb.org", role: "Administrator", monthlyDue: 0,
    status: "paid",
    penalties: [],
  },
  {
    id: 5, name: "Luisa Garcia",    email: "l.garcia@sjb.org",   role: "Lector",        monthlyDue: 100,
    status: "unpaid",
    penalties: [
      { id: 2, reason: "Late submission", amount: 25 },
      { id: 3, reason: "Missed reading",  amount: 50 },
    ],
  },
  {
    id: 6, name: "Carlos Bautista", email: "c.bautista@sjb.org", role: "Commentator",   monthlyDue: 100,
    status: "paid",
    penalties: [],
  },
  {
    id: 7, name: "Rosa Mendoza",    email: "r.mendoza@sjb.org",  role: "Lector",        monthlyDue: 100,
    status: "unpaid",
    penalties: [],
  },
]);

/* ── Summary stats ───────────────────────────────── */
const totalDue      = (m) => m.monthlyDue + m.penalties.reduce((s, p) => s + p.amount, 0);
const totalBilled   = computed(() => members.value.reduce((s, m) => s + totalDue(m), 0));
const totalUnpaid   = computed(() => members.value.filter(m => m.status !== "paid").reduce((s, m) => s + totalDue(m), 0));
const totalPaid     = computed(() => members.value.filter(m => m.status === "paid").reduce((s, m) => s + totalDue(m), 0));
const totalPenalties = computed(() => members.value.reduce((s, m) => s + m.penalties.reduce((ps, p) => ps + p.amount, 0), 0));
const unpaidCount   = computed(() => members.value.filter(m => m.status !== "paid").length);
const paidCount     = computed(() => members.value.filter(m => m.status === "paid").length);
const penaltyCount  = computed(() => members.value.reduce((s, m) => s + m.penalties.length, 0));

/* ── Number format ───────────────────────────────── */
const fmt = (n) => Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Avatar helpers ──────────────────────────────── */
const palette = ["#0369a1","#0891b2","#0c4a6e","#0e7490","#075985","#155e75"];
const avatarColor = (name) => palette[name.charCodeAt(0) % palette.length];
const initials    = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/* ── Search & filter ─────────────────────────────── */
const search       = ref("");
const activeFilter = ref("all");

const filters = [
  { value: "all",     label: "All" },
  { value: "unpaid",  label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid",    label: "Paid" },
];

const filteredMembers = computed(() =>
  members.value.filter(m => {
    const matchFilter = activeFilter.value === "all" || m.status === activeFilter.value;
    const matchSearch = !search.value ||
      m.name.toLowerCase().includes(search.value.toLowerCase()) ||
      m.email.toLowerCase().includes(search.value.toLowerCase());
    return matchFilter && matchSearch;
  })
);

/* ── Status dropdown ─────────────────────────────── */
const openStatusId    = ref(null);
const toggleStatusMenu = (id) => { openStatusId.value = openStatusId.value === id ? null : id; };
const closeStatusMenu  = (id) => { if (openStatusId.value === id) openStatusId.value = null; };
const setStatus        = (member, val) => { member.status = val; openStatusId.value = null; };

/* ── Add Penalty modal ───────────────────────────── */
const showPenaltyModal = ref(false);
const penaltyTarget    = ref(null);
const penaltyForm      = ref({ memberId: "", reason: "", amount: "" });

const openAddPenaltyModal = (member) => {
  penaltyTarget.value = member;
  penaltyForm.value = { memberId: member?.id ?? "", reason: "", amount: "" };
  showPenaltyModal.value = true;
};

const savePenalty = () => {
  const target = penaltyTarget.value
    ?? members.value.find(m => m.id === penaltyForm.value.memberId);
  if (!target || !penaltyForm.value.reason.trim() || !penaltyForm.value.amount) return;

  target.penalties.push({
    id:     Date.now(),
    reason: penaltyForm.value.reason.trim(),
    amount: Number(penaltyForm.value.amount),
  });
  showPenaltyModal.value = false;
};

const removePenalty = (member, penaltyId) => {
  member.penalties = member.penalties.filter(p => p.id !== penaltyId);
};

/* ── Detail modal ────────────────────────────────── */
const showDetailModal = ref(false);
const detailMember    = ref(null);

const openDetailModal = (member) => {
  detailMember.value  = member;
  showDetailModal.value = true;
};
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.acc-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
}

/* ── Header ──────────────────────────────────────── */
.page-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 22px; gap: 12px;
}
.page-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.55rem; font-weight: 400; color: #0f172a; margin: 0;
}
.page-sub { font-size: 0.78rem; color: #94a3b8; margin: 3px 0 0; }

.btn-primary {
  display: flex; align-items: center; gap: 4px;
  padding: 9px 18px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.28);
  transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Summary cards ───────────────────────────────── */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
@media (max-width: 900px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }

.summary-card {
  background: white; border-radius: 14px;
  border: 1px solid #f1f5f9;
  padding: 18px; display: flex; gap: 14px; align-items: flex-start;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.sc-icon {
  width: 42px; height: 42px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.total-card  .sc-icon { background: #eff6ff; }
.unpaid-card .sc-icon { background: #fef2f2; }
.paid-card   .sc-icon { background: #f0fdf4; }
.penalty-card .sc-icon { background: #fff7ed; }

.sc-body { display: flex; flex-direction: column; gap: 2px; }
.sc-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.sc-value { font-size: 1.35rem; font-weight: 700; color: #0f172a; line-height: 1.2; margin-top: 2px; }
.sc-value.red    { color: #dc2626; }
.sc-value.green  { color: #15803d; }
.sc-value.orange { color: #c2410c; }
.sc-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 3px; }

/* ── Toolbar ─────────────────────────────────────── */
.toolbar {
  display: flex; gap: 10px; margin-bottom: 14px;
  flex-wrap: wrap; align-items: center;
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
  padding: 6px 16px; border: 1.5px solid #e2e8f0; border-radius: 20px;
  background: white; font-size: 0.78rem; font-weight: 500; color: #475569;
  cursor: pointer; font-family: "DM Sans", sans-serif; transition: all 0.15s;
}
.filter-chip:hover { border-color: #0369a1; color: #0369a1; }
.filter-chip.active { border-color: #0369a1; background: #eff6ff; color: #0369a1; font-weight: 600; }

/* ── Table ───────────────────────────────────────── */
.table-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0; overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.acc-table { width: 100%; border-collapse: collapse; }
.acc-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.acc-table th {
  padding: 11px 16px; text-align: left;
  font-size: 0.7rem; font-weight: 700; color: #64748b;
  letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap;
}
.acc-table th:last-child { text-align: right; }
.acc-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.acc-table td:last-child { text-align: right; }

/* Paid rows → transparent / faded */
.acc-row { transition: background 0.12s; }
.acc-row:hover { background: #fafcff; }
.acc-row:last-child td { border-bottom: none; }

.row-paid {
  opacity: 0.45;
  background: #f8fafc;
}
.row-paid:hover { opacity: 0.65; background: #f0f9ff; }

.row-unpaid { background: #fffbfb; }
.row-partial { background: #fffef5; }

.idx-cell { color: #cbd5e1; font-size: 0.78rem; width: 36px; }

/* Member cell */
.member-cell { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700; color: white; flex-shrink: 0;
}
.avatar.lg { width: 44px; height: 44px; border-radius: 12px; font-size: 0.85rem; }
.member-name  { display: block; font-size: 0.875rem; font-weight: 600; color: #0f172a; }
.member-email { display: block; font-size: 0.72rem; color: #94a3b8; }

/* Role badges */
.role-badge {
  display: inline-block; padding: 3px 9px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700; white-space: nowrap;
}
.role-badge.lector        { background: #eff6ff; color: #1d4ed8; }
.role-badge.commentator   { background: #f0fdf4; color: #15803d; }
.role-badge.coordinator   { background: #fefce8; color: #a16207; }
.role-badge.administrator { background: #fdf4ff; color: #7e22ce; }
.role-badge.sm { font-size: 0.65rem; padding: 2px 7px; }

/* Amount cells */
.amount-cell { font-size: 0.875rem; color: #334155; font-weight: 500; white-space: nowrap; }
.amount-cell.total { font-weight: 700; color: #0f172a; }

/* Penalties */
.penalty-cell { min-width: 160px; }
.no-penalty { color: #cbd5e1; font-size: 0.78rem; }
.penalty-list { display: flex; flex-direction: column; gap: 4px; }
.penalty-item {
  display: flex; align-items: center; gap: 6px;
  background: #fff7ed; border: 1px solid #fed7aa;
  border-radius: 6px; padding: 3px 8px; font-size: 0.72rem;
}
.penalty-label { flex: 1; color: #7c2d12; font-weight: 500; }
.penalty-amt   { color: #c2410c; font-weight: 700; white-space: nowrap; }
.remove-penalty-btn {
  background: none; border: none; cursor: pointer; color: #fca5a5;
  display: flex; align-items: center; padding: 1px;
  transition: color 0.15s; flex-shrink: 0;
}
.remove-penalty-btn:hover { color: #ef4444; }

/* Status dropdown */
.status-wrap { position: relative; display: inline-block; }
.status-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px 5px 8px; border-radius: 20px;
  border: 1.5px solid transparent;
  font-size: 0.75rem; font-weight: 600; cursor: pointer;
  white-space: nowrap; font-family: "DM Sans", sans-serif;
  transition: all 0.15s;
}
.status-btn.paid    { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.status-btn.unpaid  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.status-btn.partial { background: #fefce8; border-color: #fde047; color: #a16207; }

.sdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.sdot.paid    { background: #22c55e; }
.sdot.unpaid  { background: #ef4444; }
.sdot.partial { background: #eab308; }

.status-menu {
  position: absolute; top: calc(100% + 6px); left: 0;
  z-index: 100; background: white;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 5px; min-width: 130px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.status-opt {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 10px; border: none;
  background: none; cursor: pointer; font-size: 0.8rem;
  font-weight: 500; font-family: "DM Sans", sans-serif;
  color: #334155; border-radius: 7px; text-align: left;
  transition: background 0.1s;
}
.status-opt:hover { background: #f1f5f9; }
.status-opt.current { font-weight: 700; color: #0369a1; }

/* Action buttons */
.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.act-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; background: white;
  font-size: 0.75rem; font-weight: 600; cursor: pointer;
  font-family: "DM Sans", sans-serif; color: #64748b;
  transition: all 0.15s;
}
.act-btn.penalty-btn:hover { border-color: #c2410c; background: #fff7ed; color: #c2410c; }
.act-btn.view-btn:hover    { border-color: #0369a1; background: #eff6ff; color: #0369a1; }

/* Empty */
.empty-cell { text-align: center; padding: 48px !important; color: #94a3b8; }
.empty-cell p { margin: 10px 0 0; }

/* ── Modals ──────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
}
.modal-lg { max-width: 520px; }

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0;
}
.modal-sub { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
}

/* Form elements */
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #334155; }
.req { color: #ef4444; }

.f-input {
  width: 100%; padding: 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.f-input:focus { border-color: #0369a1; background: white; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.f-input::placeholder { color: #cbd5e1; }
.f-input.has-prefix { padding-left: 30px; }

.select-wrap { position: relative; }
.f-select {
  width: 100%; padding: 10px 32px 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif;
  color: #0f172a; background: #f8fafc; outline: none;
  appearance: none; cursor: pointer; transition: border-color 0.15s;
}
.f-select:focus { border-color: #0369a1; }
.select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

.amount-input-wrap { position: relative; display: flex; align-items: center; }
.currency-prefix {
  position: absolute; left: 13px; font-size: 0.875rem;
  color: #64748b; font-weight: 600; pointer-events: none;
}

/* Detail modal */
.detail-header-content { display: flex; align-items: center; gap: 14px; }

.detail-summary {
  background: #f8fafc; border-radius: 10px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;
  border: 1px solid #f1f5f9;
}
.ds-item { display: flex; align-items: center; justify-content: space-between; }
.ds-label { font-size: 0.8rem; color: #64748b; font-weight: 500; }
.ds-label.total-label { font-weight: 700; color: #0f172a; }
.ds-value { font-size: 0.9rem; font-weight: 600; color: #0f172a; }
.ds-value.orange { color: #c2410c; }
.ds-value.total-val { font-size: 1rem; font-weight: 700; }
.ds-divider { height: 1px; background: #e2e8f0; margin: 2px 0; }

.status-badge-inline {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 700;
}
.status-badge-inline.paid    { background: #f0fdf4; color: #15803d; }
.status-badge-inline.unpaid  { background: #fef2f2; color: #dc2626; }
.status-badge-inline.partial { background: #fefce8; color: #a16207; }

.detail-section { display: flex; flex-direction: column; gap: 10px; }
.detail-section-header { display: flex; align-items: center; justify-content: space-between; }
.detail-section-title { font-size: 0.82rem; font-weight: 700; color: #334155; }
.link-btn {
  display: flex; align-items: center;
  background: none; border: none; cursor: pointer; padding: 0;
  font-size: 0.75rem; font-weight: 600; color: #0369a1;
  font-family: "DM Sans", sans-serif; transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }

.no-data { font-size: 0.8rem; color: #cbd5e1; font-style: italic; text-align: center; padding: 12px; }

.detail-penalty-list { display: flex; flex-direction: column; gap: 6px; }
.detail-penalty-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; background: #fff7ed;
  border: 1px solid #fed7aa; border-radius: 8px; gap: 8px;
}
.dp-left { display: flex; align-items: center; flex: 1; }
.dp-reason { font-size: 0.82rem; font-weight: 500; color: #7c2d12; }
.dp-right { display: flex; align-items: center; gap: 8px; }
.dp-amount { font-size: 0.875rem; font-weight: 700; color: #c2410c; white-space: nowrap; }

/* Buttons */
.btn-cancel {
  padding: 8px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer;
  transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: #94a3b8; }

.btn-save {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 20px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.25);
  transition: opacity 0.15s;
}
.btn-save:hover:not(:disabled) { opacity: 0.9; }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-save.penalty-save {
  background: linear-gradient(135deg, #9a3412, #c2410c);
  box-shadow: 0 4px 12px rgba(194,65,12,0.28);
}

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>