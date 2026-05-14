<template>
  <div class="users-page">
    <!-- PAGE HEADER -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">User Management</h1>
        <p class="page-sub">
          Manage accounts, roles, and access across the ministry
        </p>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <v-icon size="18" class="mr-2">mdi-plus</v-icon>
        New User
      </button>
    </div>

    <!-- STATS ROW -->
    <div class="stats-row">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <v-icon size="18" :color="s.color">{{ s.icon }}</v-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- FILTERS & SEARCH -->
    <div class="toolbar">
      <div class="search-wrap">
        <v-icon size="16" color="#94a3b8" class="search-icon"
          >mdi-magnify</v-icon
        >
        <input
          v-model="search"
          class="search-input"
          placeholder="Search by name, email, role, or team…"
        />
        <button v-if="search" class="search-clear" @click="search = ''">
          <v-icon size="14">mdi-close</v-icon>
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
          <span class="chip-dot" :class="f.value" />
          {{ f.label }}
        </button>
      </div>
      <div class="filter-chips">
        <button
          v-for="t in teamFilters"
          :key="t.value"
          class="filter-chip team-chip"
          :class="{ active: activeTeam === t.value }"
          @click="activeTeam = t.value"
        >
          <v-icon
            size="13"
            class="mr-1"
            :color="activeTeam === t.value ? t.activeColor : '#94a3b8'"
            >{{ t.icon }}</v-icon
          >
          {{ t.label }}
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-card">
      <table class="user-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                class="cb"
                @change="toggleAll"
                :checked="allSelected"
              />
            </th>
            <th>Member</th>
            <th>Role</th>
            <th>Team</th>
            <th>Contact</th>
            <th>Next Renewal</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in paginatedUsers"
            :key="user.id"
            class="user-row"
            :class="{ selected: selected.includes(user.id) }"
          >
            <td>
              <input
                type="checkbox"
                class="cb"
                :checked="selected.includes(user.id)"
                @change="toggleSelect(user.id)"
              />
            </td>
            <td>
              <div class="member-cell">
                <div
                  class="avatar"
                  :style="{ background: avatarColor(user.name) }"
                >
                  {{ initials(user.name) }}
                </div>
                <div class="member-info">
                  <span class="member-name">{{ user.name }}</span>
                  <span class="member-email">{{ user.email }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="role-badge" :class="roleBadgeClass(user.role)">{{
                user.role
              }}</span>
            </td>
            <td>
              <span class="team-badge" :class="teamBadgeClass(user.team)">
                <v-icon size="12" class="mr-1">{{
                  teamIcon(user.team)
                }}</v-icon>
                {{ user.team }}
              </span>
            </td>
            <td class="contact-cell">{{ user.contact ?? "—" }}</td>
            <td class="date-cell">{{ user.membership_expiration }}</td>
            <td>
              <span class="status-display" :class="user.status">
                <span class="status-dot" :class="user.status" />
                {{ statusLabel(user.status) }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button
                  class="action-btn edit"
                  @click="openEditModal(user)"
                  title="Edit"
                >
                  <v-icon size="15">mdi-pencil-outline</v-icon>
                </button>
                <button
                  class="action-btn reset"
                  @click="openResetModal(user)"
                  title="Reset Password"
                >
                  <v-icon size="15">mdi-lock-reset</v-icon>
                </button>
                <button
                  class="action-btn delete"
                  @click="confirmDelete(user)"
                  title="Delete"
                >
                  <v-icon size="15">mdi-trash-can-outline</v-icon>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="paginatedUsers.length === 0">
            <td colspan="8" class="empty-state">
              <v-icon size="40" color="#cbd5e1"
                >mdi-account-search-outline</v-icon
              >
              <p>No users found</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-left">
          <span class="pagination-info">
            Showing {{ paginatedUsers.length }} of
            {{ filteredUsers.length }} users
          </span>
          <div class="per-page-wrap">
            <label class="per-page-label">Show</label>
            <select v-model="perPage" class="per-page-select">
              <option value="all">All</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="30">30</option>
              <option :value="40">40</option>
              <option :value="50">50</option>
            </select>
            <label class="per-page-label">per page</label>
          </div>
        </div>
        <div class="pagination-btns" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <v-icon size="16">mdi-chevron-left</v-icon>
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="page-btn"
            :class="{ active: currentPage === p }"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <v-icon size="16">mdi-chevron-right</v-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- CREATE MODAL -->
    <transition name="modal">
      <div
        v-if="showModal && !isEditing"
        class="modal-backdrop"
        @click.self="closeModal"
      >
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Create New Account</h2>
              <p class="modal-sub">Add a new ministry member account</p>
            </div>
            <button class="modal-close" @click="closeModal">
              <v-icon size="20">mdi-close</v-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field">
                <label>Full Name <span class="req">*</span></label>
                <input
                  v-model="form.name"
                  class="f-input"
                  :class="{ 'f-input-error': errors.name }"
                  placeholder="e.g. Maria Santos"
                />
                <span v-if="errors.name" class="field-error">{{
                  errors.name
                }}</span>
              </div>
              <div class="form-field">
                <label>Email Address <span class="req">*</span></label>
                <input
                  v-model="form.email"
                  type="email"
                  class="f-input"
                  :class="{ 'f-input-error': errors.email }"
                  placeholder="member@sjbparish.org"
                />
                <span v-if="errors.email" class="field-error">{{
                  errors.email
                }}</span>
              </div>
              <div class="form-field">
                <label>Contact Number</label>
                <input
                  v-model="form.contact"
                  class="f-input"
                  :class="{ 'f-input-error': errors.contact }"
                  placeholder="09XXXXXXXXX"
                  maxlength="11"
                />
                <span v-if="errors.contact" class="field-error">{{
                  errors.contact
                }}</span>
              </div>
              <div class="form-field">
                <label>Role <span class="req">*</span></label>
                <div class="select-wrap">
                  <select
                    v-model="form.role"
                    class="f-select"
                    :class="{ 'f-input-error': errors.role }"
                  >
                    <option value="">Select a role…</option>
                    <option v-for="r in roles" :key="r" :value="r">
                      {{ r }}
                    </option>
                  </select>
                  <v-icon size="16" class="select-arrow"
                    >mdi-chevron-down</v-icon
                  >
                </div>
                <span v-if="errors.role" class="field-error">{{
                  errors.role
                }}</span>
              </div>
              <div class="form-field full">
                <label>Team <span class="req">*</span></label>
                <div class="team-radio-group">
                  <label
                    v-for="t in teams"
                    :key="t.value"
                    class="team-radio-card"
                    :class="{ active: form.team === t.value, [t.cls]: true }"
                  >
                    <input
                      type="radio"
                      :value="t.value"
                      v-model="form.team"
                      class="hidden-radio"
                    />
                    <v-icon
                      size="20"
                      :color="form.team === t.value ? t.activeColor : '#94a3b8'"
                      >{{ t.icon }}</v-icon
                    >
                    <div>
                      <p class="team-radio-name">{{ t.value }}</p>
                      <p class="team-radio-desc">{{ t.desc }}</p>
                    </div>
                    <div class="team-radio-check" v-if="form.team === t.value">
                      <v-icon size="13" color="white">mdi-check</v-icon>
                    </div>
                  </label>
                </div>
                <span v-if="errors.team" class="field-error">{{
                  errors.team
                }}</span>
              </div>
              <div class="form-field">
                <label>Password <span class="req">*</span></label>
                <div class="pw-wrap">
                  <input
                    v-model="form.password"
                    :type="showPw ? 'text' : 'password'"
                    class="f-input"
                    :class="{ 'f-input-error': errors.password }"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    class="pw-eye"
                    @click="showPw = !showPw"
                  >
                    <v-icon size="16">{{
                      showPw ? "mdi-eye-off-outline" : "mdi-eye-outline"
                    }}</v-icon>
                  </button>
                </div>
                <span v-if="errors.password" class="field-error">{{
                  errors.password
                }}</span>
              </div>
              <div class="form-field">
                <label>Confirm Password <span class="req">*</span></label>
                <div class="pw-wrap">
                  <input
                    v-model="form.confirmPassword"
                    :type="showPw ? 'text' : 'password'"
                    class="f-input"
                    :class="{ 'f-input-error': errors.confirmPassword }"
                    placeholder="Repeat password"
                  />
                </div>
                <span v-if="errors.confirmPassword" class="field-error">{{
                  errors.confirmPassword
                }}</span>
              </div>
              <div class="form-field full">
                <label>Status</label>
                <div class="radio-group">
                  <label
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    class="radio-label"
                  >
                    <input
                      type="radio"
                      :value="opt.value"
                      v-model="form.status"
                      class="radio-input"
                    />
                    <span class="opt-dot" :class="opt.value" />
                    {{ opt.label }}
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button class="btn-save" @click="saveUser">
              <v-icon size="16" class="mr-1">mdi-account-plus-outline</v-icon>
              Create Account
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- EDIT MODAL -->
    <transition name="modal">
      <div
        v-if="showModal && isEditing"
        class="modal-backdrop"
        @click.self="closeModal"
      >
        <div class="modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Edit Account</h2>
              <p class="modal-sub">Update member information</p>
            </div>
            <button class="modal-close" @click="closeModal">
              <v-icon size="20">mdi-close</v-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field">
                <label>Full Name <span class="req">*</span></label>
                <input
                  v-model="form.name"
                  class="f-input"
                  :class="{ 'f-input-error': errors.name }"
                  placeholder="e.g. Maria Santos"
                />
                <span v-if="errors.name" class="field-error">{{
                  errors.name
                }}</span>
              </div>
              <div class="form-field">
                <label>Email Address <span class="req">*</span></label>
                <input
                  v-model="form.email"
                  type="email"
                  class="f-input"
                  :class="{ 'f-input-error': errors.email }"
                  placeholder="member@sjbparish.org"
                />
                <span v-if="errors.email" class="field-error">{{
                  errors.email
                }}</span>
              </div>
              <div class="form-field">
                <label>Contact Number</label>
                <input
                  v-model="form.contact"
                  class="f-input"
                  :class="{ 'f-input-error': errors.contact }"
                  placeholder="09XXXXXXXXX"
                  maxlength="11"
                />
                <span v-if="errors.contact" class="field-error">{{
                  errors.contact
                }}</span>
              </div>
              <div class="form-field">
                <label>Role <span class="req">*</span></label>
                <div class="select-wrap">
                  <select
                    v-model="form.role"
                    class="f-select"
                    :class="{ 'f-input-error': errors.role }"
                  >
                    <option value="">Select a role…</option>
                    <option v-for="r in roles" :key="r" :value="r">
                      {{ r }}
                    </option>
                  </select>
                  <v-icon size="16" class="select-arrow"
                    >mdi-chevron-down</v-icon
                  >
                </div>
                <span v-if="errors.role" class="field-error">{{
                  errors.role
                }}</span>
              </div>
              <div class="form-field full">
                <label>Team <span class="req">*</span></label>
                <div class="team-radio-group">
                  <label
                    v-for="t in teams"
                    :key="t.value"
                    class="team-radio-card"
                    :class="{ active: form.team === t.value, [t.cls]: true }"
                  >
                    <input
                      type="radio"
                      :value="t.value"
                      v-model="form.team"
                      class="hidden-radio"
                    />
                    <v-icon
                      size="20"
                      :color="form.team === t.value ? t.activeColor : '#94a3b8'"
                      >{{ t.icon }}</v-icon
                    >
                    <div>
                      <p class="team-radio-name">{{ t.value }}</p>
                      <p class="team-radio-desc">{{ t.desc }}</p>
                    </div>
                    <div class="team-radio-check" v-if="form.team === t.value">
                      <v-icon size="13" color="white">mdi-check</v-icon>
                    </div>
                  </label>
                </div>
                <span v-if="errors.team" class="field-error">{{
                  errors.team
                }}</span>
              </div>
              <div class="form-field">
                <label>Status</label>
                <div class="select-wrap">
                  <select v-model="form.status" class="f-select">
                    <option
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>
                  <v-icon size="16" class="select-arrow"
                    >mdi-chevron-down</v-icon
                  >
                </div>
              </div>
              <div class="form-field">
                <label>Membership Expiration</label>
                <input
                  v-model="form.membership_expiration"
                  type="date"
                  class="f-input"
                />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button class="btn-save" @click="saveUser">
              <v-icon size="16" class="mr-1">mdi-content-save-outline</v-icon>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- RESET PASSWORD MODAL -->
    <transition name="modal">
      <div
        v-if="showResetModal"
        class="modal-backdrop"
        @click.self="showResetModal = false"
      >
        <div class="modal modal-sm">
          <div
            class="modal-header"
            style="border-bottom: 1px solid #f1f5f9; padding: 20px 24px 16px"
          >
            <div style="display: flex; align-items: center; gap: 12px">
              <div class="reset-icon-badge">
                <v-icon size="20" color="#0369a1">mdi-lock-reset</v-icon>
              </div>
              <div>
                <h2 class="modal-title">Reset Password</h2>
                <p class="modal-sub">{{ resetTarget?.name }}</p>
              </div>
            </div>
            <button class="modal-close" @click="showResetModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>
          <div class="modal-body" style="padding: 20px 24px">
            <div class="reset-info-banner">
              <v-icon size="15" color="#0369a1" class="mr-2"
                >mdi-information-outline</v-icon
              >
              <span
                >A new temporary password will be assigned. The user must change
                it on next login.</span
              >
            </div>
            <div class="form-field" style="margin-top: 16px">
              <label>New Password <span class="req">*</span></label>
              <div class="pw-wrap">
                <input
                  v-model="resetForm.password"
                  :type="showResetPw ? 'text' : 'password'"
                  class="f-input"
                  :class="{ 'f-input-error': resetErrors.password }"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  class="pw-eye"
                  @click="showResetPw = !showResetPw"
                >
                  <v-icon size="16">{{
                    showResetPw ? "mdi-eye-off-outline" : "mdi-eye-outline"
                  }}</v-icon>
                </button>
              </div>
              <span v-if="resetErrors.password" class="field-error">{{
                resetErrors.password
              }}</span>
            </div>
            <div class="form-field" style="margin-top: 14px">
              <label>Confirm New Password <span class="req">*</span></label>
              <div class="pw-wrap">
                <input
                  v-model="resetForm.confirm"
                  :type="showResetPw ? 'text' : 'password'"
                  class="f-input"
                  :class="{ 'f-input-error': resetErrors.confirm }"
                  placeholder="Repeat password"
                />
              </div>
              <span v-if="resetErrors.confirm" class="field-error">{{
                resetErrors.confirm
              }}</span>
            </div>
          </div>
          <div class="modal-footer" style="padding: 12px 24px 20px">
            <button class="btn-cancel" @click="showResetModal = false">
              Cancel
            </button>
            <button class="btn-reset-confirm" @click="submitReset">
              <v-icon size="15" class="mr-1">mdi-lock-check-outline</v-icon>
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- DELETE CONFIRM MODAL -->
    <transition name="modal">
      <div
        v-if="showDeleteModal"
        class="modal-backdrop"
        @click.self="showDeleteModal = false"
      >
        <div
          class="modal modal-sm"
          style="padding: 32px 28px; text-align: center"
        >
          <div class="delete-icon-wrap">
            <div class="delete-icon">
              <v-icon size="28" color="#ef4444">mdi-trash-can-outline</v-icon>
            </div>
          </div>
          <h2 class="delete-title">Delete Account</h2>
          <p class="delete-msg">
            Are you sure you want to delete
            <strong>{{ deleteTarget?.name }}</strong
            >? This action cannot be undone.
          </p>
          <div class="delete-actions">
            <button class="btn-cancel" @click="showDeleteModal = false">
              Cancel
            </button>
            <button class="btn-delete" @click="deleteUser">Yes, Delete</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const { success, error } = useToast();
const config = useRuntimeConfig();

/* ── Directives ─────────────────────────────────── */
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) binding.value(e);
    };
    document.addEventListener("click", el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener("click", el._clickOutside);
  },
};

/* ── Static data ─────────────────────────────────── */
const roles = ["Lector", "Commentator", "Coordinator", "Administrator"];

const teams = [
  {
    value: "Old Testament",
    cls: "ot",
    icon: "mdi-book-open-page-variant-outline",
    activeColor: "#a16207",
    desc: "Genesis to Malachi readings",
  },
  {
    value: "New Testament",
    cls: "nt",
    icon: "mdi-book-open-page-variant-outline",
    activeColor: "#0369a1",
    desc: "Matthew to Revelation readings",
  },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const teamFilters = [
  {
    value: "all",
    label: "All Teams",
    icon: "mdi-account-group-outline",
    activeColor: "#0369a1",
  },
  {
    value: "Old Testament",
    label: "Old Testament",
    icon: "mdi-book-open-page-variant-outline",
    activeColor: "#a16207",
  },
  {
    value: "New Testament",
    label: "New Testament",
    icon: "mdi-book-open-page-variant-outline",
    activeColor: "#0369a1",
  },
];

/* ── Badge helpers ───────────────────────────────── */
const roleBadgeClass = (role) => {
  const map = {
    lector: "lector",
    commentator: "commentator",
    coordinator: "coordinator",
    administrator: "administrator",
    admin: "administrator",
  };
  return map[role?.toLowerCase()] ?? "lector";
};
const teamBadgeClass = (team) =>
  team?.toLowerCase().includes("old") ? "ot" : "nt";
const teamIcon = (team) =>
  team?.toLowerCase().includes("old")
    ? "mdi-book-open-page-variant-outline"
    : "mdi-book-open-page-variant-outline";

/* ── Users ───────────────────────────────────────── */
const users = ref([]);

/* ── Stats ───────────────────────────────────────── */
const stats = computed(() => [
  {
    label: "Total Members",
    value: users.value.length,
    icon: "mdi-account-group-outline",
    bg: "#eff6ff",
    color: "#3b82f6",
  },
  {
    label: "Active",
    value: users.value.filter((u) => u.status === "active").length,
    icon: "mdi-check-circle-outline",
    bg: "#f0fdf4",
    color: "#22c55e",
  },
  {
    label: "Old Testament",
    value: users.value.filter((u) => u.team?.toLowerCase().includes("old"))
      .length,
    icon: "mdi-book-open-page-variant-outline",
    bg: "#fefce8",
    color: "#a16207",
  },
  {
    label: "New Testament",
    value: users.value.filter((u) => u.team?.toLowerCase().includes("new"))
      .length,
    icon: "mdi-book-open-page-variant-outline",
    bg: "#eff6ff",
    color: "#0369a1",
  },
]);

/* ── Search & filter ─────────────────────────────── */
const search = ref("");
const activeFilter = ref("all");
const activeTeam = ref("all");

const filteredUsers = computed(() =>
  users.value.filter((u) => {
    const q = search.value.toLowerCase();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.team?.toLowerCase().includes(q);
    const matchFilter =
      activeFilter.value === "all" || u.status === activeFilter.value;
    const matchTeam = activeTeam.value === "all" || u.team === activeTeam.value;
    return matchSearch && matchFilter && matchTeam;
  }),
);

/* ── Pagination ──────────────────────────────────── */
const perPage = ref(10);
const currentPage = ref(1);

const totalPages = computed(() => {
  if (perPage.value === "all") return 1;
  return Math.ceil(filteredUsers.value.length / perPage.value);
});

const paginatedUsers = computed(() => {
  if (perPage.value === "all") return filteredUsers.value;
  const start = (currentPage.value - 1) * perPage.value;
  return filteredUsers.value.slice(start, start + perPage.value);
});

watch([filteredUsers, perPage], () => {
  currentPage.value = 1;
});

/* ── Selection ───────────────────────────────────── */
const selected = ref([]);
const allSelected = computed(
  () =>
    selected.value.length === paginatedUsers.value.length &&
    paginatedUsers.value.length > 0,
);
const toggleAll = () => {
  selected.value = allSelected.value
    ? []
    : paginatedUsers.value.map((u) => u.id);
};
const toggleSelect = (id) => {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((i) => i !== id)
    : [...selected.value, id];
};

/* ── Status helpers ──────────────────────────────── */
const statusLabel = (s) => statusOptions.find((o) => o.value === s)?.label ?? s;

/* ── Avatar helpers ──────────────────────────────── */
const palette = [
  "#0369a1",
  "#0891b2",
  "#0284c7",
  "#075985",
  "#0e7490",
  "#155e75",
  "#164e63",
];
const avatarColor = (name) =>
  palette[(name?.charCodeAt(0) ?? 0) % palette.length];
const initials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

/* ── Fetch ───────────────────────────────────────── */
const fetchUsers = async () => {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/users`);
    const raw = res.users ?? res;
    users.value = raw.map((u) => ({
      ...u,
      contact: u.cp_number ?? u.contact ?? "—",
      membership_expiration: u.membership_expiration?.slice(0, 10) ?? "—",
    }));
  } catch (err) {
    error(err?.data?.message || "Failed to load users.");
  }
};
onMounted(() => fetchUsers());

/* ── Validation ──────────────────────────────────── */
const errors = ref({});

const validateCreate = () => {
  const e = {};
  if (!form.value.name?.trim()) e.name = "Full name is required.";
  if (!form.value.email?.trim()) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
    e.email = "Enter a valid email.";
  if (form.value.contact && form.value.contact.length !== 11)
    e.contact = "Contact number must be exactly 11 digits.";
  if (form.value.contact && !/^\d+$/.test(form.value.contact))
    e.contact = "Contact number must contain digits only.";
  if (!form.value.role) e.role = "Please select a role.";
  if (!form.value.team) e.team = "Please select a team.";
  if (!form.value.password) e.password = "Password is required.";
  else if (form.value.password.length < 8)
    e.password = "Password must be at least 8 characters.";
  if (!form.value.confirmPassword)
    e.confirmPassword = "Please confirm your password.";
  else if (form.value.password !== form.value.confirmPassword)
    e.confirmPassword = "Passwords do not match.";
  errors.value = e;
  return Object.keys(e).length === 0;
};

const validateEdit = () => {
  const e = {};
  if (!form.value.name?.trim()) e.name = "Full name is required.";
  if (!form.value.email?.trim()) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
    e.email = "Enter a valid email.";
  if (form.value.contact && form.value.contact.length !== 11)
    e.contact = "Contact number must be exactly 11 digits.";
  if (form.value.contact && !/^\d+$/.test(form.value.contact))
    e.contact = "Contact number must contain digits only.";
  if (!form.value.role) e.role = "Please select a role.";
  if (!form.value.team) e.team = "Please select a team.";
  errors.value = e;
  return Object.keys(e).length === 0;
};

/* ── Create / Edit Modal ─────────────────────────── */
const showModal = ref(false);
const isEditing = ref(false);
const showPw = ref(false);
const editTarget = ref(null);

const emptyForm = () => ({
  name: "",
  email: "",
  contact: "",
  role: "",
  team: "",
  password: "",
  confirmPassword: "",
  status: "active",
  membershipExpiration: "",
});
const form = ref(emptyForm());

const openCreateModal = () => {
  form.value = emptyForm();
  errors.value = {};
  isEditing.value = false;
  showModal.value = true;
};
const openEditModal = (user) => {
  form.value = {
    ...user,
    password: "",
    confirmPassword: "",
    membershipExpiration: user.membershipExpiration ?? "",
  };
  errors.value = {};
  isEditing.value = true;
  editTarget.value = user;
  showModal.value = true;
};
const closeModal = () => {
  showModal.value = false;
  errors.value = {};
};

const saveUser = async () => {
  const valid = isEditing.value ? validateEdit() : validateCreate();
  if (!valid) return;

  try {
    if (isEditing.value) {
      await $fetch(
        `${config.public.apiBase}/api/users/${editTarget.value.id}`,
        {
          method: "PUT",
          body: {
            name: form.value.name,
            email: form.value.email,
            cp_number: form.value.contact,
            role: form.value.role,
            team: form.value.team,
            status: form.value.status,
            membership_expiration: form.value.membership_expiration,
          },
        },
      );
      success("User updated successfully!");
    } else {
      await $fetch(`${config.public.apiBase}/api/register`, {
        method: "POST",
        body: {
          name: form.value.name,
          email: form.value.email,
          cp_number: form.value.contact,
          role: form.value.role,
          team: form.value.team,
          status: form.value.status || "active",
          password: form.value.password,
          password_confirmation: form.value.confirmPassword,
        },
      });
      success("User registered successfully!");
    }
    await fetchUsers();
    closeModal();
  } catch (err) {
    error(
      err?.data?.message ||
        (isEditing.value ? "Failed to update user." : "Registration failed."),
    );
  }
};

/* ── Reset Password Modal ────────────────────────── */
const showResetModal = ref(false);
const showResetPw = ref(false);
const resetTarget = ref(null);
const resetForm = ref({ password: "", confirm: "" });
const resetErrors = ref({});

const openResetModal = (user) => {
  resetTarget.value = user;
  resetForm.value = { password: "", confirm: "" };
  resetErrors.value = {};
  showResetPw.value = false;
  showResetModal.value = true;
};

const submitReset = async () => {
  const e = {};

  if (!resetForm.value.password) {
    e.password = "Password is required.";
  } else if (resetForm.value.password.length < 8) {
    e.password = "Password must be at least 8 characters.";
  }

  if (!resetForm.value.confirm) {
    e.confirm = "Please confirm the password.";
  } else if (resetForm.value.password !== resetForm.value.confirm) {
    e.confirm = "Passwords do not match.";
  }

  resetErrors.value = e;
  if (Object.keys(e).length) return;

  try {
    await $fetch(
      `${config.public.apiBase}/api/users/${resetTarget.value.id}/reset-password`,
      {
        method: "PUT",
        body: {
          password: resetForm.value.password,
          password_confirmation: resetForm.value.confirm,
        },
      },
    );

    success(`Password reset for ${resetTarget.value.name}`);
    showResetModal.value = false;

    // reset fields
    resetForm.value = {
      password: "",
      confirm: "",
    };
  } catch (err) {
    error(err?.data?.message || "Failed to reset password.");
  }
};

/* ── Delete ──────────────────────────────────────── */
const showDeleteModal = ref(false);
const deleteTarget = ref(null);

const confirmDelete = (user) => {
  deleteTarget.value = user;
  showDeleteModal.value = true;
};

const deleteUser = async () => {
  try {
    await $fetch(
      `${config.public.apiBase}/api/users/${deleteTarget.value.id}`,
      { method: "DELETE" },
    );
    success(`${deleteTarget.value.name} has been deleted.`);
    await fetchUsers();
  } catch (err) {
    error(err?.data?.message || "Failed to delete user.");
  } finally {
    showDeleteModal.value = false;
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* {
  box-sizing: border-box;
}
.users-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.page-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.6rem;
  font-weight: 400;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}
.page-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 4px 0 0;
}
.btn-create {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(3, 105, 161, 0.3);
  transition:
    opacity 0.15s,
    transform 0.1s;
  white-space: nowrap;
}
.btn-create:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}
.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 3px;
  font-weight: 500;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 9px 36px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  background: white;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.search-input:focus {
  border-color: #0369a1;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}
.search-input::placeholder {
  color: #cbd5e1;
}
.search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 2px;
}
.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  font-size: 0.78rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  font-family: "DM Sans", sans-serif;
}
.filter-chip:hover {
  border-color: #0369a1;
  color: #0369a1;
}
.filter-chip.active {
  border-color: #0369a1;
  background: #eff6ff;
  color: #0369a1;
  font-weight: 600;
}

.table-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}
.user-table {
  width: 100%;
  border-collapse: collapse;
}
.user-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.user-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.user-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  vertical-align: middle;
}
.user-row {
  transition: background 0.1s;
}
.user-row:hover {
  background: #fafcff;
}
.user-row.selected {
  background: #eff6ff;
}
.user-row:last-child td {
  border-bottom: none;
}
.cb {
  width: 15px;
  height: 15px;
  accent-color: #0369a1;
  cursor: pointer;
}

.member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: white;
}
.member-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.member-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.875rem;
}
.member-email {
  font-size: 0.75rem;
  color: #94a3b8;
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.role-badge.lector {
  background: #eff6ff;
  color: #1d4ed8;
}
.role-badge.commentator {
  background: #f0fdf4;
  color: #15803d;
}
.role-badge.coordinator {
  background: #fefce8;
  color: #a16207;
}
.role-badge.administrator {
  background: #fdf4ff;
  color: #7e22ce;
}

.team-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  border: 1.5px solid;
}
.team-badge.ot {
  background: #fefce8;
  color: #a16207;
  border-color: #fde68a;
}
.team-badge.nt {
  background: #eff6ff;
  color: #0369a1;
  border-color: #bae6fd;
}

.contact-cell {
  color: #475569;
  font-size: 0.82rem;
}
.date-cell {
  color: #94a3b8;
  font-size: 0.8rem;
  white-space: nowrap;
}

/* Status display only (no dropdown) */
.status-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 8px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.status-display.active {
  background: #f0fdf4;
  color: #15803d;
}
.status-display.inactive {
  background: #fefce8;
  color: #a16207;
}
.status-display.suspended {
  background: #fef2f2;
  color: #dc2626;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.active {
  background: #22c55e;
}
.status-dot.inactive {
  background: #eab308;
}
.status-dot.suspended {
  background: #ef4444;
}

.action-btns {
  display: flex;
  gap: 5px;
  align-items: center;
}
.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  color: #94a3b8;
}
.action-btn.edit:hover {
  border-color: #0369a1;
  background: #eff6ff;
  color: #0369a1;
}
.action-btn.reset:hover {
  border-color: #7c3aed;
  background: #faf5ff;
  color: #7c3aed;
}
.action-btn.delete:hover {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 48px 16px !important;
  color: #94a3b8;
}
.empty-state p {
  margin-top: 12px;
  font-size: 0.9rem;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 10px;
}
.pagination-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.pagination-info {
  font-size: 0.78rem;
  color: #94a3b8;
}
.per-page-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}
.per-page-label {
  font-size: 0.78rem;
  color: #94a3b8;
}
.per-page-select {
  padding: 4px 28px 4px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.78rem;
  font-family: "DM Sans", sans-serif;
  color: #475569;
  background: white;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}
.pagination-btns {
  display: flex;
  gap: 4px;
}
.page-btn {
  min-width: 32px;
  height: 32px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: "DM Sans", sans-serif;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) {
  border-color: #0369a1;
  color: #0369a1;
}
.page-btn.active {
  background: #0369a1;
  border-color: #0369a1;
  color: white;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal {
  background: white;
  border-radius: 18px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}
.modal-sm {
  max-width: 420px;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.2rem;
  font-weight: 400;
  color: #0f172a;
  margin: 0;
}
.modal-sub {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 3px 0 0;
}
.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  flex-shrink: 0;
  transition:
    color 0.15s,
    background 0.15s;
}
.modal-close:hover {
  color: #475569;
  background: #f1f5f9;
}
.modal-body {
  padding: 24px 28px;
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 28px 24px;
  border-top: 1px solid #f1f5f9;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
@media (max-width: 560px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field.full {
  grid-column: 1 / -1;
}
.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}
.req {
  color: #ef4444;
}
.field-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 2px;
}

.f-input {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.f-input:focus {
  border-color: #0369a1;
  background: white;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}
.f-input::placeholder {
  color: #cbd5e1;
}
.f-input-error {
  border-color: #ef4444 !important;
  background: #fff8f8 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
}

.select-wrap {
  position: relative;
}
.f-select {
  width: 100%;
  padding: 10px 36px 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.f-select:focus {
  border-color: #0369a1;
}
.f-select.f-input-error {
  border-color: #ef4444;
  background: #fff8f8;
}
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.pw-wrap {
  position: relative;
}
.pw-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 2px;
}
.pw-eye:hover {
  color: #0369a1;
}

.team-radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.team-radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.team-radio-card:hover {
  border-color: #94a3b8;
  background: white;
}
.team-radio-card.active.ot {
  border-color: #fde68a;
  background: #fefce8;
}
.team-radio-card.active.nt {
  border-color: #bae6fd;
  background: #eff6ff;
}
.hidden-radio {
  display: none;
}
.team-radio-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.team-radio-desc {
  font-size: 0.68rem;
  color: #94a3b8;
  margin: 2px 0 0;
}
.team-radio-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.team-radio-card.active.ot .team-radio-check {
  background: #a16207;
}

.radio-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.radio-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
}
.radio-input {
  accent-color: #0369a1;
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.opt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.opt-dot.active {
  background: #22c55e;
}
.opt-dot.inactive {
  background: #eab308;
}
.opt-dot.suspended {
  background: #ef4444;
}

.btn-cancel {
  padding: 9px 20px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover {
  border-color: #94a3b8;
  color: #334155;
}
.btn-save {
  display: flex;
  align-items: center;
  padding: 9px 22px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(3, 105, 161, 0.3);
  transition:
    opacity 0.15s,
    transform 0.1s;
}
.btn-save:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.reset-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  border: 1.5px solid #bae6fd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.reset-info-banner {
  display: flex;
  align-items: flex-start;
  background: #eff6ff;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.78rem;
  color: #0369a1;
  line-height: 1.5;
}
.btn-reset-confirm {
  display: flex;
  align-items: center;
  padding: 9px 22px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
  transition:
    opacity 0.15s,
    transform 0.1s;
}
.btn-reset-confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.delete-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.delete-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fecaca;
}
.delete-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.3rem;
  font-weight: 400;
  color: #0f172a;
  margin: 0 0 10px;
}
.delete-msg {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
}
.delete-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.btn-delete {
  padding: 9px 22px;
  border: none;
  border-radius: 10px;
  background: #ef4444;
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-delete:hover {
  opacity: 0.9;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.97) translateY(8px);
  opacity: 0;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
