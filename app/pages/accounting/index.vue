<template>
  <div class="acc-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Accounting</h1>
        <p class="page-sub">Ministry billing, obligations, and payment tracking</p>
      </div>
    </div>

    <!-- SUMMARY CARDS -->
    <div class="summary-row">
      <div class="summary-card total-card">
        <div class="sc-icon"><v-icon size="20" color="#0369a1">mdi-account-group-outline</v-icon></div>
        <div class="sc-body">
          <div class="sc-label">Total Members</div>
          <div class="sc-value">{{ members.length }}</div>
        </div>
      </div>
      <div class="summary-card oblig-card">
        <div class="sc-icon"><v-icon size="20" color="#c2410c">mdi-receipt-text-outline</v-icon></div>
        <div class="sc-body">
          <div class="sc-label">Total Obligations</div>
          <div class="sc-value orange">₱ {{ fmt(totalObligations) }}</div>
          <div class="sc-sub">{{ totalObligationsCount }} item{{ totalObligationsCount !== 1 ? 's' : '' }}</div>
        </div>
      </div>
      <div class="summary-card paid-card">
        <div class="sc-icon"><v-icon size="20" color="#15803d">mdi-check-circle-outline</v-icon></div>
        <div class="sc-body">
          <div class="sc-label">Total Paid</div>
          <div class="sc-value green">₱ {{ fmt(totalObligationsPaid) }}</div>
          <div class="sc-sub">{{ totalObligationsPaidCount }} item{{ totalObligationsPaidCount !== 1 ? 's' : '' }} settled</div>
        </div>
      </div>
      <div class="summary-card unpaid-card">
        <div class="sc-icon"><v-icon size="20" color="#dc2626">mdi-alert-circle-outline</v-icon></div>
        <div class="sc-body">
          <div class="sc-label">Total Unpaid</div>
          <div class="sc-value red">₱ {{ fmt(totalObligationsUnpaid) }}</div>
          <div class="sc-sub">{{ totalObligationsUnpaidCount }} item{{ totalObligationsUnpaidCount !== 1 ? 's' : '' }} outstanding</div>
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

    <!-- DESKTOP TABLE -->
    <div class="table-card desktop-only">
      <div v-if="loadingUsers" class="table-empty">
        <div class="mini-spinner" />
        <p>Loading members…</p>
      </div>
      <div v-else-if="filteredMembers.length === 0" class="table-empty">
        <v-icon size="38" color="#cbd5e1">mdi-account-search-outline</v-icon>
        <p>No members found</p>
      </div>
      <table v-else class="acc-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Member</th>
            <th>Role</th>
            <th>Team</th>
            <th>Obligations</th>
            <th>Paid</th>
            <th>Unpaid</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(member, index) in filteredMembers"
            :key="member.id"
            class="acc-row"
          >
            <td class="idx-cell">{{ index + 1 }}</td>
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
            <td>
              <span class="role-badge" :class="(member.role ?? '').toLowerCase().replace(/\s+/g,'-')">
                {{ member.role ?? '—' }}
              </span>
            </td>
            <td><span class="team-chip">{{ member.team ?? '—' }}</span></td>
            <td>
              <span v-if="!member._penalties || member._penalties.length === 0" class="no-penalty">—</span>
              <span v-else class="penalty-count-chip">
                <v-icon size="11" color="#c2410c">mdi-receipt-text-outline</v-icon>
                {{ member._penalties.length }} item{{ member._penalties.length !== 1 ? 's' : '' }}
                · ₱ {{ fmt(member._penalties.reduce((s,p)=>s+p.amount,0)) }}
              </span>
            </td>
            <td>
              <span v-if="!member._penalties || member._penalties.length === 0" class="no-penalty">—</span>
              <span v-else class="amount-paid-chip">
                ₱ {{ fmt(member._penalties.filter(p=>p._paid).reduce((s,p)=>s+p.amount,0)) }}
              </span>
            </td>
            <td>
              <span v-if="!member._penalties || member._penalties.length === 0" class="no-penalty">—</span>
              <span v-else class="amount-unpaid-chip">
                ₱ {{ fmt(member._penalties.filter(p=>!p._paid).reduce((s,p)=>s+p.amount,0)) }}
              </span>
            </td>
            <td style="text-align:right">
              <button class="act-btn view-btn" @click="openDetailModal(member)">
                <v-icon size="14">mdi-eye-outline</v-icon>
                <span>View</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MOBILE CARD LIST -->
    <div class="mobile-only">
      <div v-if="loadingUsers" class="table-empty">
        <div class="mini-spinner" />
        <p>Loading members…</p>
      </div>
      <div v-else-if="filteredMembers.length === 0" class="table-empty">
        <v-icon size="38" color="#cbd5e1">mdi-account-search-outline</v-icon>
        <p>No members found</p>
      </div>
      <div v-else class="mobile-list">
        <div
          v-for="member in filteredMembers"
          :key="member.id"
          class="mobile-card"
        >
          <div class="mc-top">
            <div class="member-cell">
              <div class="avatar" :style="{ background: avatarColor(member.name) }">
                {{ initials(member.name) }}
              </div>
              <div class="member-info">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-email">{{ member.email }}</span>
              </div>
            </div>
          </div>

          <!-- Amounts row — full width, clearly laid out -->
          <div v-if="member._penalties && member._penalties.length > 0" class="mc-amounts-row">
            <div class="mc-amount-item">
              <span class="mc-amount-label">Obligations</span>
              <span class="mc-amount-value neutral">₱ {{ fmt(member._penalties.reduce((s,p)=>s+p.amount,0)) }}</span>
            </div>
            <div class="mc-amount-divider"></div>
            <div class="mc-amount-item">
              <span class="mc-amount-label">Paid</span>
              <span class="mc-amount-value paid">₱ {{ fmt(member._penalties.filter(p=>p._paid).reduce((s,p)=>s+p.amount,0)) }}</span>
            </div>
            <div class="mc-amount-divider"></div>
            <div class="mc-amount-item">
              <span class="mc-amount-label">Unpaid</span>
              <span class="mc-amount-value unpaid">₱ {{ fmt(member._penalties.filter(p=>!p._paid).reduce((s,p)=>s+p.amount,0)) }}</span>
            </div>
          </div>
          <div v-else class="mc-no-obligs">No obligations yet</div>

          <div class="mc-meta">
            <span class="role-badge" :class="(member.role ?? '').toLowerCase().replace(/\s+/g,'-')">{{ member.role ?? '—' }}</span>
            <span class="team-chip">{{ member.team ?? '—' }}</span>
            <span v-if="member._penalties && member._penalties.length > 0" class="penalty-count-chip">
              <v-icon size="11" color="#c2410c">mdi-receipt-text-outline</v-icon>
              {{ member._penalties.length }} item{{ member._penalties.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="mc-footer">
            <button class="act-btn view-btn full-width-btn" @click="openDetailModal(member)">
              <v-icon size="14">mdi-eye-outline</v-icon>
              <span>View Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- ══ MEMBER DETAIL MODAL ══ -->
    <transition name="modal">
      <div v-if="showDetailModal && detailMember" class="modal-backdrop" @click.self="closeDetailModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="detail-header-content">
              <div class="avatar lg" :style="{ background: avatarColor(detailMember.name) }">
                {{ initials(detailMember.name) }}
              </div>
              <div>
                <h2 class="modal-title">{{ detailMember.name }}</h2>
                <p class="modal-sub">
                  {{ detailMember.email }}
                  <span v-if="detailMember.role"> · <span class="role-badge sm" :class="(detailMember.role ?? '').toLowerCase().replace(/\s+/g,'-')">{{ detailMember.role }}</span></span>
                  <span v-if="detailMember.team"> · {{ detailMember.team }}</span>
                </p>
              </div>
            </div>
            <button class="modal-close" @click="closeDetailModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- ADD OBLIGATION FORM -->
            <div class="detail-section">
              <div class="add-penalty-form">
                <div class="apf-title">
                  <v-icon size="14" color="#0369a1">mdi-plus-circle-outline</v-icon>
                  Add Obligation
                </div>
                <div class="apf-fields">
                  <div class="form-field apf-desc">
                    <label class="field-label">Description <span class="req">*</span></label>
                    <input v-model="penaltyForm.reason" class="f-input" placeholder="e.g. Contribution fee, Late submission…" />
                  </div>
                  <div class="form-field apf-amount">
                    <label class="field-label">Amount (₱) <span class="req">*</span></label>
                    <div class="amount-input-wrap">
                      <span class="currency-prefix">₱</span>
                      <input v-model.number="penaltyForm.amount" type="number" min="0" class="f-input has-prefix" placeholder="0.00" />
                    </div>
                  </div>
                </div>
                <button
                  class="btn-add-penalty"
                  :disabled="!penaltyForm.reason.trim() || !penaltyForm.amount || savingObligation"
                  @click="savePenalty"
                >
                  <v-icon size="14" class="mr-1">{{ savingObligation ? 'mdi-loading mdi-spin' : 'mdi-receipt-text-outline' }}</v-icon>
                  {{ savingObligation ? 'Saving…' : 'Add Obligation' }}
                </button>
              </div>
            </div>

            <!-- OBLIGATIONS LIST -->
            <div class="detail-section">
              <div class="detail-section-header">
                <span class="detail-section-title">
                  Obligations
                  <span v-if="detailMember._penalties.length > 0" class="oblig-count">({{ detailMember._penalties.length }})</span>
                </span>
                <div v-if="detailMember._penalties.length > 0" class="obligation-totals">
                  <span class="obligation-chip paid-chip">
                    ₱ {{ fmt(detailMember._penalties.filter(p=>p._paid).reduce((s,p)=>s+p.amount,0)) }} paid
                  </span>
                  <span class="obligation-chip unpaid-chip">
                    ₱ {{ fmt(detailMember._penalties.filter(p=>!p._paid).reduce((s,p)=>s+p.amount,0)) }} unpaid
                  </span>
                </div>
              </div>

              <div v-if="loadingObligations" class="table-empty" style="padding:20px">
                <div class="mini-spinner" />
                <p>Loading obligations…</p>
              </div>
              <div v-else-if="detailMember._penalties.length === 0" class="no-data">
                No obligations yet — add one above
              </div>
              <div v-else class="detail-penalty-list">
                <div
                  v-for="p in detailMember._penalties"
                  :key="p.id"
                  class="detail-penalty-row"
                  :class="{ 'item-paid': p._paid }"
                >
                  <div class="dp-left">
                    <v-icon size="14" :color="p._paid ? '#15803d' : '#c2410c'" class="mr-2">
                      {{ p._paid ? 'mdi-check-circle-outline' : 'mdi-receipt-text-outline' }}
                    </v-icon>
                    <div class="dp-info">
                      <span class="dp-reason" :class="{ 'dp-reason-paid': p._paid }">{{ p.reason }}</span>
                      <span class="dp-amount" :class="{ 'dp-amount-paid': p._paid }">₱ {{ fmt(p.amount) }}</span>
                    </div>
                  </div>
                  <div class="dp-right">
                    <button
                      class="penalty-toggle-btn"
                      :class="p._paid ? 'toggle-paid' : 'toggle-unpaid'"
                      @click="askTogglePenalty(detailMember, p)"
                    >
                      <v-icon size="11">{{ p._paid ? 'mdi-close' : 'mdi-check' }}</v-icon>
                      <span class="toggle-label">{{ p._paid ? 'Paid' : 'Unpaid' }}</span>
                    </button>
                    <button class="edit-penalty-btn" @click="openEditModal(detailMember, p)">
                      <v-icon size="12">mdi-pencil-outline</v-icon>
                    </button>
                    <button class="remove-penalty-btn" @click="askDeletePenalty(detailMember, p)">
                      <v-icon size="12">mdi-trash-can-outline</v-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeDetailModal">Close</button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ══ EDIT OBLIGATION MODAL ══ -->
    <transition name="modal">
      <div v-if="showEditModal && editTarget" class="modal-backdrop modal-backdrop-top" @click.self="closeEditModal">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="detail-header-content">
              <div class="confirm-icon icon-edit">
                <v-icon size="20" color="#0369a1">mdi-pencil-outline</v-icon>
              </div>
              <div>
                <h3 class="confirm-title">Edit Obligation</h3>
                <p class="confirm-sub">Update the description or amount</p>
              </div>
            </div>
            <button class="modal-close" @click="closeEditModal"><v-icon size="18">mdi-close</v-icon></button>
          </div>
          <div class="confirm-body">
            <div class="apf-fields" style="flex-direction:column; gap:12px;">
              <div class="form-field">
                <label class="field-label">Description <span class="req">*</span></label>
                <input v-model="editForm.reason" class="f-input" placeholder="e.g. Contribution fee…" />
              </div>
              <div class="form-field">
                <label class="field-label">Amount (₱) <span class="req">*</span></label>
                <div class="amount-input-wrap">
                  <span class="currency-prefix">₱</span>
                  <input v-model.number="editForm.amount" type="number" min="0" class="f-input has-prefix" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeEditModal">Cancel</button>
            <button
              class="btn-confirm btn-confirm-blue"
              :disabled="!editForm.reason.trim() || !editForm.amount || savingEdit"
              @click="confirmEdit"
            >
              <v-icon size="14" class="mr-1">{{ savingEdit ? 'mdi-loading mdi-spin' : 'mdi-content-save-outline' }}</v-icon>
              {{ savingEdit ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ DELETE CONFIRMATION MODAL ══ -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-backdrop modal-backdrop-top" @click.self="cancelDelete">
        <div class="modal modal-sm">
          <div class="modal-header confirm-header">
            <div class="confirm-icon icon-delete">
              <v-icon size="22" color="#dc2626">mdi-trash-can-outline</v-icon>
            </div>
            <div>
              <h3 class="confirm-title">Delete Obligation?</h3>
              <p class="confirm-sub">This action cannot be undone</p>
            </div>
            <button class="modal-close" @click="cancelDelete"><v-icon size="18">mdi-close</v-icon></button>
          </div>
          <div class="confirm-body">
            <div class="confirm-obligation-card card-delete">
              <div class="cob-top">
                <v-icon size="14" color="#dc2626">mdi-receipt-text-outline</v-icon>
                <span class="cob-reason">{{ pendingDelete?.item?.reason }}</span>
              </div>
              <div class="cob-amount">₱ {{ fmt(pendingDelete?.item?.amount) }}</div>
            </div>
            <p class="confirm-desc">
              You are about to permanently delete
              <strong>"{{ pendingDelete?.item?.reason }}"</strong>.
              This cannot be recovered.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="cancelDelete">Cancel</button>
            <button class="btn-confirm btn-confirm-red" :disabled="deletingObligation" @click="confirmDelete">
              <v-icon size="14" class="mr-1">{{ deletingObligation ? 'mdi-loading mdi-spin' : 'mdi-trash-can-outline' }}</v-icon>
              {{ deletingObligation ? 'Deleting…' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══ TOGGLE CONFIRMATION MODAL ══ -->
    <transition name="modal">
      <div v-if="showConfirmModal" class="modal-backdrop modal-backdrop-top" @click.self="cancelToggle">
        <div class="modal modal-sm">
          <div class="modal-header confirm-header">
            <div class="confirm-icon" :class="pendingToggle?.item?._paid ? 'icon-unpaid' : 'icon-paid'">
              <v-icon size="22" :color="pendingToggle?.item?._paid ? '#dc2626' : '#15803d'">
                {{ pendingToggle?.item?._paid ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline' }}
              </v-icon>
            </div>
            <div>
              <h3 class="confirm-title">{{ pendingToggle?.item?._paid ? 'Mark as Unpaid?' : 'Mark as Paid?' }}</h3>
              <p class="confirm-sub">Please confirm before updating this obligation</p>
            </div>
            <button class="modal-close" @click="cancelToggle"><v-icon size="18">mdi-close</v-icon></button>
          </div>
          <div class="confirm-body">
            <div class="confirm-obligation-card" :class="pendingToggle?.item?._paid ? 'card-paid' : 'card-unpaid'">
              <div class="cob-top">
                <v-icon size="14" :color="pendingToggle?.item?._paid ? '#15803d' : '#c2410c'">mdi-receipt-text-outline</v-icon>
                <span class="cob-reason">{{ pendingToggle?.item?.reason }}</span>
              </div>
              <div class="cob-amount">₱ {{ fmt(pendingToggle?.item?.amount) }}</div>
            </div>
            <p class="confirm-desc">
              This will mark <strong>"{{ pendingToggle?.item?.reason }}"</strong> as
              <strong :class="pendingToggle?.item?._paid ? 'text-red' : 'text-green'">
                {{ pendingToggle?.item?._paid ? 'Unpaid' : 'Paid' }}
              </strong>.
              The analytics will update accordingly.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="cancelToggle">Cancel</button>
            <button
              class="btn-confirm"
              :class="pendingToggle?.item?._paid ? 'btn-confirm-red' : 'btn-confirm-green'"
              :disabled="togglingObligation"
              @click="confirmToggle"
            >
              <v-icon size="14" class="mr-1">
                {{ togglingObligation ? 'mdi-loading mdi-spin' : (pendingToggle?.item?._paid ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline') }}
              </v-icon>
              {{ togglingObligation ? 'Updating…' : `Yes, mark as ${pendingToggle?.item?._paid ? 'Unpaid' : 'Paid'}` }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const config = useRuntimeConfig();
const BASE   = config.public.apiBase;

/* ── Status options ───────────────────────────────────── */
const statusOptions = [
  { value: "unpaid",  label: "Unpaid"  },
  { value: "partial", label: "Partial" },
  { value: "paid",    label: "Paid"    },
];
const statusLabel = (s) => statusOptions.find(o => o.value === s)?.label ?? s;

/* ─────────────────────────────────────────────────────────
   MEMBERS — GET /api/users
───────────────────────────────────────────────────────── */
const members      = ref([]);
const loadingUsers = ref(true);

const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const [userData, obligData] = await Promise.all([
      $fetch(`${BASE}/api/users`),
      $fetch(`${BASE}/api/obligations`),
    ]);

    const users     = Array.isArray(userData) ? userData : (userData.users ?? []);
    const allObligs = Array.isArray(obligData) ? obligData : (obligData.obligations ?? []);

    const obligsByUser = {};
    for (const o of allObligs) {
      const uid = o.user_id;
      if (!obligsByUser[uid]) obligsByUser[uid] = [];
      obligsByUser[uid].push({
        id:     o.id,
        reason: o.reason,
        amount: Number(o.amount),
        _paid:  Boolean(o.is_paid),
      });
    }

    members.value = users.map((u) => ({
      ...u,
      _penalties: obligsByUser[u.id] ?? [],
    }));
  } catch (e) {
    console.error("fetchUsers failed:", e);
  } finally {
    loadingUsers.value = false;
  }
};

onMounted(fetchUsers);

/* ─────────────────────────────────────────────────────────
   OBLIGATIONS — GET /api/obligations?user_id=X
───────────────────────────────────────────────────────── */
const loadingObligations = ref(false);

const fetchObligations = async (member, showLoading = true) => {
  if (showLoading) loadingObligations.value = true;
  try {
    const data = await $fetch(`${BASE}/api/obligations`, {
      params: { user_id: member.id },
    });
    const list = (Array.isArray(data) ? data : (data.obligations ?? []))
      .filter(o => Number(o.user_id) === Number(member.id));
    member._penalties = list.map(o => ({
      id:     o.id,
      reason: o.reason,
      amount: Number(o.amount),
      _paid:  Boolean(o.is_paid),
    }));
  } catch (e) {
    console.error("fetchObligations failed:", e);
  } finally {
    if (showLoading) loadingObligations.value = false;
  }
};

/* ─────────────────────────────────────────────────────────
   SUMMARY STATS
───────────────────────────────────────────────────────── */
const totalObligations = computed(() =>
  members.value.reduce((s, m) => s + m._penalties.reduce((ps, p) => ps + p.amount, 0), 0));
const totalObligationsCount = computed(() =>
  members.value.reduce((s, m) => s + m._penalties.length, 0));
const totalObligationsPaid = computed(() =>
  members.value.reduce((s, m) => s + m._penalties.filter(p => p._paid).reduce((ps, p) => ps + p.amount, 0), 0));
const totalObligationsPaidCount = computed(() =>
  members.value.reduce((s, m) => s + m._penalties.filter(p => p._paid).length, 0));
const totalObligationsUnpaid = computed(() =>
  members.value.reduce((s, m) => s + m._penalties.filter(p => !p._paid).reduce((ps, p) => ps + p.amount, 0), 0));
const totalObligationsUnpaidCount = computed(() =>
  members.value.reduce((s, m) => s + m._penalties.filter(p => !p._paid).length, 0));

/* ── Helpers ──────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const palette     = ["#0369a1","#0891b2","#0c4a6e","#0e7490","#075985","#155e75"];
const avatarColor = (name) => palette[(name ?? "?").charCodeAt(0) % palette.length];
const initials    = (name) =>
  (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/* ── Search & filter ──────────────────────────────────── */
const search       = ref("");
const activeFilter = ref("all");

const filters = [
  { value: "all",        label: "All"           },
  { value: "has-unpaid", label: "Has Unpaid"    },
  { value: "fully-paid", label: "Fully Paid"    },
  { value: "no-obligs",  label: "No Obligations" },
];

const filteredMembers = computed(() =>
  members.value.filter(m => {
    const q = search.value.toLowerCase();
    const matchSearch = !q ||
      (m.name  ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q);

    let matchFilter = true;
    if (activeFilter.value === "has-unpaid") {
      matchFilter = m._penalties.some(p => !p._paid);
    } else if (activeFilter.value === "fully-paid") {
      matchFilter = m._penalties.length > 0 && m._penalties.every(p => p._paid);
    } else if (activeFilter.value === "no-obligs") {
      matchFilter = m._penalties.length === 0;
    }

    return matchFilter && matchSearch;
  })
);

/* ─────────────────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────────────────── */
const showDetailModal = ref(false);
const detailMember    = ref(null);
const penaltyForm     = ref({ reason: "", amount: "" });

const openDetailModal = async (member) => {
  detailMember.value    = member;
  showDetailModal.value = true;
  penaltyForm.value     = { reason: "", amount: "" };
  await fetchObligations(member);
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  detailMember.value    = null;
};

/* ─────────────────────────────────────────────────────────
   ADD OBLIGATION — POST /api/obligations
───────────────────────────────────────────────────────── */
const savingObligation = ref(false);

const savePenalty = async () => {
  if (!detailMember.value) return;
  if (!penaltyForm.value.reason.trim() || !penaltyForm.value.amount) return;

  savingObligation.value = true;
  try {
    const res = await $fetch(`${BASE}/api/obligations`, {
      method: "POST",
      body: {
        user_id: detailMember.value.id,
        reason:  penaltyForm.value.reason.trim(),
        amount:  Number(penaltyForm.value.amount),
        is_paid: false,
      },
    });
    const created = res.data ?? res;
    detailMember.value._penalties.push({
      id:     created.id,
      reason: created.reason,
      amount: Number(created.amount),
      _paid:  Boolean(created.is_paid),
    });
    penaltyForm.value = { reason: "", amount: "" };
  } catch (e) {
    console.error("savePenalty failed:", e);
  } finally {
    savingObligation.value = false;
  }
};

/* ─────────────────────────────────────────────────────────
   DELETE OBLIGATION — DELETE /api/obligations/{id}
───────────────────────────────────────────────────────── */
const showDeleteModal      = ref(false);
const pendingDelete        = ref(null);
const deletingObligation   = ref(false);

const askDeletePenalty = (member, item) => {
  pendingDelete.value   = { member, item };
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!pendingDelete.value) return;
  const { member, item } = pendingDelete.value;

  deletingObligation.value = true;
  try {
    await $fetch(`${BASE}/api/obligations/${item.id}`, { method: "DELETE" });
    member._penalties = member._penalties.filter(p => p.id !== item.id);
    showDeleteModal.value = false;
    pendingDelete.value   = null;
  } catch (e) {
    console.error("confirmDelete failed:", e);
  } finally {
    deletingObligation.value = false;
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  pendingDelete.value   = null;
};

/* ─────────────────────────────────────────────────────────
   EDIT OBLIGATION — PUT /api/obligations/{id}
───────────────────────────────────────────────────────── */
const showEditModal = ref(false);
const editTarget    = ref(null);
const editForm      = ref({ reason: "", amount: "" });
const savingEdit    = ref(false);

const openEditModal = (member, item) => {
  editTarget.value    = { member, item };
  editForm.value      = { reason: item.reason, amount: item.amount };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editTarget.value    = null;
};

const confirmEdit = async () => {
  if (!editTarget.value) return;
  if (!editForm.value.reason.trim() || !editForm.value.amount) return;

  const { item } = editTarget.value;
  savingEdit.value = true;
  try {
    const updated = await $fetch(`${BASE}/api/obligations/${item.id}`, {
      method: "PUT",
      body: {
        reason: editForm.value.reason.trim(),
        amount: Number(editForm.value.amount),
      },
    });
    item.reason = updated.reason ?? editForm.value.reason.trim();
    item.amount = Number(updated.amount ?? editForm.value.amount);
    showEditModal.value = false;
    editTarget.value    = null;
  } catch (e) {
    console.error("confirmEdit failed:", e);
  } finally {
    savingEdit.value = false;
  }
};

/* ─────────────────────────────────────────────────────────
   TOGGLE PAID/UNPAID — PUT /api/obligations/{id}
───────────────────────────────────────────────────────── */
const showConfirmModal   = ref(false);
const pendingToggle      = ref(null);
const togglingObligation = ref(false);

const askTogglePenalty = (member, item) => {
  pendingToggle.value    = { member, item };
  showConfirmModal.value = true;
};

const confirmToggle = async () => {
  if (!pendingToggle.value) return;
  const { item } = pendingToggle.value;

  togglingObligation.value = true;
  try {
    await $fetch(`${BASE}/api/obligations/${item.id}`, {
      method: "PUT",
      body: { is_paid: !item._paid },
    });
    item._paid = !item._paid;
    showConfirmModal.value   = false;
    pendingToggle.value      = null;
  } catch (e) {
    console.error("confirmToggle failed:", e);
  } finally {
    togglingObligation.value = false;
  }
};

const cancelToggle = () => {
  showConfirmModal.value = false;
  pendingToggle.value    = null;
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
  padding: 0;
  width: 100%;
}

/* ── Responsive visibility ── */
.desktop-only { display: block; }
.mobile-only  { display: none; }

@media (max-width: 700px) {
  .desktop-only { display: none; }
  .mobile-only  { display: block; }
}

/* ── Header ── */
.page-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 18px; gap: 12px;
}
.page-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.55rem; font-weight: 400; color: #0f172a; margin: 0;
}
.page-sub { font-size: 0.78rem; color: #94a3b8; margin: 3px 0 0; }
@media (max-width: 480px) { .page-title { font-size: 1.3rem; } }

/* ── Summary cards ── */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 18px; width: 100%;
}
@media (max-width: 900px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 420px) { .summary-row { gap: 8px; } }

.summary-card {
  background: white; border-radius: 14px; border: 1px solid #f1f5f9;
  padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
@media (max-width: 420px) { .summary-card { padding: 12px; gap: 8px; border-radius: 12px; } }

.sc-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
@media (max-width: 420px) { .sc-icon { width: 32px; height: 32px; border-radius: 8px; } }

.total-card  .sc-icon { background: #eff6ff; }
.oblig-card  .sc-icon { background: #fff7ed; }
.paid-card   .sc-icon { background: #f0fdf4; }
.unpaid-card .sc-icon { background: #fef2f2; }

.sc-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.sc-label {
  font-size: 0.68rem; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sc-value { font-size: 1.25rem; font-weight: 700; color: #0f172a; line-height: 1.2; margin-top: 2px; }
@media (max-width: 420px) { .sc-value { font-size: 1.05rem; } }
.sc-value.red    { color: #dc2626; }
.sc-value.green  { color: #15803d; }
.sc-value.orange { color: #c2410c; font-size: 1rem; }
@media (max-width: 420px) { .sc-value.orange { font-size: 0.85rem; } }
.sc-sub { font-size: 0.68rem; color: #94a3b8; margin-top: 2px; }

/* ── Toolbar ── */
.toolbar {
  display: flex; gap: 10px; margin-bottom: 12px;
  flex-wrap: wrap; align-items: center; width: 100%;
}
.search-wrap {
  position: relative; flex: 1; min-width: 180px;
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
  padding: 7px 14px; border: 1.5px solid #e2e8f0; border-radius: 20px;
  background: white; font-size: 0.78rem; font-weight: 500; color: #475569;
  cursor: pointer; font-family: "DM Sans", sans-serif; transition: all 0.15s; white-space: nowrap;
}
.filter-chip:hover  { border-color: #0369a1; color: #0369a1; }
.filter-chip.active { border-color: #0369a1; background: #eff6ff; color: #0369a1; font-weight: 600; }

/* ── Desktop Table ── */
.table-card {
  background: white; border-radius: 14px; border: 1px solid #e2e8f0;
  overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.05); width: 100%;
}
.table-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px;
  padding: 48px 20px; color: #94a3b8; font-size: 0.82rem;
}
.mini-spinner {
  width: 22px; height: 22px;
  border: 2.5px solid #e2e8f0; border-top-color: #0369a1;
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.acc-table { width: 100%; border-collapse: collapse; }
.acc-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.acc-table th {
  padding: 11px 16px; text-align: left;
  font-size: 0.7rem; font-weight: 700; color: #64748b;
  letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap;
}
.acc-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.acc-table tbody tr:last-child td { border-bottom: none; }

.acc-row { transition: background 0.12s; }
.acc-row:hover { background: #fafcff; }
.idx-cell { color: #cbd5e1; font-size: 0.78rem; width: 36px; }

/* ── Mobile Cards ── */
.mobile-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.mobile-card {
  background: white; border-radius: 14px; border: 1px solid #e2e8f0;
  padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; gap: 10px;
}

.mc-top {
  display: flex; align-items: flex-start;
}

/* Amounts row — stacked horizontally, full width */
.mc-amounts-row {
  display: flex; align-items: stretch;
  background: #f8fafc; border-radius: 10px;
  border: 1px solid #e2e8f0; overflow: hidden;
}
.mc-amount-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 10px 8px; gap: 3px; text-align: center;
}
.mc-amount-divider {
  width: 1px; background: #e2e8f0; flex-shrink: 0;
}
.mc-amount-label {
  font-size: 0.62rem; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.mc-amount-value {
  font-size: 0.82rem; font-weight: 700; white-space: nowrap;
}
.mc-amount-value.neutral { color: #c2410c; }
.mc-amount-value.paid    { color: #15803d; }
.mc-amount-value.unpaid  { color: #dc2626; }

.mc-no-obligs {
  font-size: 0.78rem; color: #cbd5e1; font-style: italic;
  text-align: center; padding: 8px 0;
}

.mc-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mc-footer { display: flex; }
.full-width-btn { width: 100%; justify-content: center; }

/* Member cell */
.member-cell { display: flex; align-items: center; gap: 10px; flex: 1; }
.avatar {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700; color: white; flex-shrink: 0;
}
.avatar.lg { width: 44px; height: 44px; border-radius: 12px; font-size: 0.85rem; }
.member-name  { display: block; font-size: 0.875rem; font-weight: 600; color: #0f172a; }
.member-email { display: block; font-size: 0.72rem; color: #94a3b8; }

/* Role / team chips */
.role-badge {
  display: inline-block; padding: 3px 9px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700; white-space: nowrap;
  background: #f1f5f9; color: #475569;
}
.role-badge.lector        { background: #eff6ff; color: #1d4ed8; }
.role-badge.commentator   { background: #f0fdf4; color: #15803d; }
.role-badge.coordinator   { background: #fefce8; color: #a16207; }
.role-badge.administrator { background: #fdf4ff; color: #7e22ce; }
.role-badge.treasurer     { background: #fff7ed; color: #c2410c; }
.role-badge.sm { font-size: 0.65rem; padding: 2px 7px; }
.team-chip {
  display: inline-block; padding: 3px 9px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 600; white-space: nowrap;
  background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;
}
.no-penalty { color: #cbd5e1; font-size: 0.78rem; }
.penalty-count-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.72rem; font-weight: 600; color: #c2410c;
  background: #fff7ed; border: 1px solid #fed7aa;
  padding: 3px 10px; border-radius: 20px; white-space: nowrap;
}

/* Action buttons */
.act-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; background: white;
  font-size: 0.75rem; font-weight: 600; cursor: pointer;
  font-family: "DM Sans", sans-serif; color: #64748b; transition: all 0.15s;
}
.act-btn.view-btn:hover { border-color: #0369a1; background: #eff6ff; color: #0369a1; }

/* Paid / Unpaid amount chips in table */
.amount-paid-chip {
  display: inline-flex; align-items: center;
  font-size: 0.78rem; font-weight: 700; color: #15803d;
  white-space: nowrap;
}
.amount-unpaid-chip {
  display: inline-flex; align-items: center;
  font-size: 0.78rem; font-weight: 700; color: #dc2626;
  white-space: nowrap;
}

/* ── Modals ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.modal-backdrop-top { z-index: 1100; }
.modal {
  background: white; border-radius: 18px;
  width: 100%; max-width: 500px; max-height: 92vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}
.modal-lg { max-width: 560px; }
.modal-sm { max-width: 420px; }

@media (max-width: 480px) {
  .modal-backdrop { align-items: flex-end; padding: 0; }
  .modal { border-radius: 20px 20px 0 0; max-height: 95vh; }
}

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 20px 16px; border-bottom: 1px solid #f1f5f9; gap: 12px;
}
.detail-header-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0;
}
.modal-sub {
  font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0;
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
}
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }
.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }

/* Obligations section */
.detail-section { display: flex; flex-direction: column; gap: 10px; }
.detail-section-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
}
.detail-section-title { font-size: 0.85rem; font-weight: 700; color: #334155; }
.oblig-count { color: #94a3b8; font-weight: 500; }
.obligation-totals { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.obligation-chip { font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.paid-chip   { background: #f0fdf4; border: 1px solid #86efac; color: #15803d; }
.unpaid-chip { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
.no-data { font-size: 0.8rem; color: #cbd5e1; font-style: italic; text-align: center; padding: 14px; }

.detail-penalty-list { display: flex; flex-direction: column; gap: 7px; }
.detail-penalty-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: #fff7ed;
  border: 1px solid #fed7aa; border-radius: 10px; gap: 8px;
  transition: background 0.2s, border-color 0.2s;
}
.detail-penalty-row.item-paid { background: #f0fdf4; border-color: #86efac; }
.dp-left { display: flex; align-items: flex-start; flex: 1; min-width: 0; gap: 8px; }
.dp-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.dp-reason { font-size: 0.82rem; font-weight: 600; color: #7c2d12; word-break: break-word; line-height: 1.3; }
.dp-reason-paid { color: #15803d; text-decoration: line-through; opacity: 0.7; }
.dp-amount { font-size: 0.78rem; font-weight: 700; color: #c2410c; }
.dp-amount-paid { color: #15803d; }
.dp-right { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }

.penalty-toggle-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 20px; border: 1.5px solid transparent;
  font-size: 0.68rem; font-weight: 700;
  cursor: pointer; font-family: "DM Sans", sans-serif; white-space: nowrap; transition: all 0.15s;
}
.toggle-label { display: inline; }
@media (max-width: 380px) { .toggle-label { display: none; } }
.toggle-unpaid { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.toggle-unpaid:hover { background: #fee2e2; border-color: #f87171; }
.toggle-paid   { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.toggle-paid:hover { background: #dcfce7; border-color: #4ade80; }

.edit-penalty-btn {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  display: flex; align-items: center; padding: 2px; transition: color 0.15s;
}
.edit-penalty-btn:hover { color: #0369a1; }
.remove-penalty-btn {
  background: none; border: none; cursor: pointer; color: #fca5a5;
  display: flex; align-items: center; padding: 2px; transition: color 0.15s;
}
.remove-penalty-btn:hover { color: #ef4444; }

/* Add obligation form */
.add-penalty-form {
  background: #f0f9ff; border: 1.5px dashed #bae6fd;
  border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
}
.apf-title { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: #0369a1; }
.apf-fields { display: flex; gap: 10px; flex-wrap: wrap; }
.apf-desc   { flex: 1; min-width: 160px; }
.apf-amount { width: 140px; min-width: 120px; }
@media (max-width: 440px) {
  .apf-desc   { min-width: 100%; }
  .apf-amount { width: 100%; }
}
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.78rem; font-weight: 600; color: #334155; }
.req { color: #ef4444; }
.f-input {
  width: 100%; padding: 9px 13px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: white; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.f-input:focus { border-color: #0369a1; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.f-input::placeholder { color: #cbd5e1; }
.f-input.has-prefix { padding-left: 28px; }
.amount-input-wrap { position: relative; display: flex; align-items: center; }
.currency-prefix {
  position: absolute; left: 11px; font-size: 0.875rem;
  color: #64748b; font-weight: 600; pointer-events: none;
}
.btn-add-penalty {
  display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
  padding: 9px 18px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.25); transition: opacity 0.15s;
}
.btn-add-penalty:hover:not(:disabled) { opacity: 0.88; }
.btn-add-penalty:disabled { opacity: 0.4; cursor: not-allowed; }

/* Modal footer */
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 20px 20px; border-top: 1px solid #f1f5f9; flex-wrap: wrap;
}
.btn-cancel {
  padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer;
  transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: #94a3b8; }

/* Confirm modals */
.confirm-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px 20px 16px; border-bottom: 1px solid #f1f5f9;
}
.confirm-icon {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.icon-delete { background: #fef2f2; }
.icon-edit   { background: #eff6ff; }
.icon-paid   { background: #f0fdf4; }
.icon-unpaid { background: #fef2f2; }
.confirm-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.05rem; font-weight: 400; color: #0f172a; margin: 0;
}
.confirm-sub { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.confirm-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.confirm-obligation-card {
  border-radius: 10px; padding: 12px 14px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.card-delete { background: #fef2f2; border: 1px solid #fca5a5; }
.card-unpaid { background: #fff7ed; border: 1px solid #fed7aa; }
.card-paid   { background: #f0fdf4; border: 1px solid #86efac; }
.cob-top { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
.cob-reason { font-size: 0.85rem; font-weight: 600; color: #0f172a; word-break: break-word; }
.cob-amount { font-size: 0.95rem; font-weight: 700; color: #0f172a; white-space: nowrap; flex-shrink: 0; }
.confirm-desc { font-size: 0.82rem; color: #64748b; line-height: 1.5; margin: 0; }
.text-green { color: #15803d; }
.text-red   { color: #dc2626; }

.btn-confirm {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 9px 18px; border: none; border-radius: 9px;
  font-family: "DM Sans", sans-serif;
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s; white-space: nowrap;
}
.btn-confirm:hover:not(:disabled) { opacity: 0.88; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-confirm-green {
  background: linear-gradient(135deg, #166534, #15803d);
  color: white; box-shadow: 0 4px 12px rgba(21,128,61,0.25);
}
.btn-confirm-red {
  background: linear-gradient(135deg, #991b1b, #dc2626);
  color: white; box-shadow: 0 4px 12px rgba(220,38,38,0.25);
}
.btn-confirm-blue {
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; box-shadow: 0 4px 12px rgba(3,105,161,0.25);
}
.btn-confirm-blue:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 400px) {
  .modal-footer { flex-direction: column-reverse; }
  .btn-cancel, .btn-confirm { width: 100%; justify-content: center; }
}

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
@media (max-width: 480px) {
  .modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(30px); opacity: 0; }
}
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>