<template>
  <div class="ann-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Announcements</h1>
        <p class="page-sub">
          <span v-if="loading">Loading…</span>
          <span v-else>{{ announcements.length }} announcement{{ announcements.length !== 1 ? 's' : '' }} posted</span>
        </p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <v-icon size="16" class="mr-1">mdi-plus</v-icon>
        New Announcement
      </button>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="search-wrap">
        <v-icon size="16" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
        <input v-model="search" class="search-input" placeholder="Search announcements…" />
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

    <!-- LOADING STATE -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading announcements…</p>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="error" class="error-state">
      <v-icon size="36" color="#ef4444">mdi-alert-circle-outline</v-icon>
      <p class="error-title">Failed to load announcements</p>
      <p class="error-sub">{{ error }}</p>
      <button class="btn-primary" @click="fetchAnnouncements">
        <v-icon size="15" class="mr-1">mdi-refresh</v-icon>
        Try Again
      </button>
    </div>

    <!-- CARDS GRID -->
    <div class="cards-grid" v-else-if="filteredAnnouncements.length > 0">
      <div
        v-for="ann in filteredAnnouncements"
        :key="ann.id"
        class="ann-card"
        :class="{ 'is-accomplished': ann.accomplished, 'is-new': ann.isNew }"
      >
        <!-- Card header: recipient left | status+date stacked right -->
        <div class="card-header">
          <span class="recipient-tag" :class="recipientClass(ann.recipient)">
            <v-icon size="11" class="mr-1">mdi-account-group-outline</v-icon>
            {{ ann.recipient }}
          </span>
          <div class="card-header-right">
            <div class="status-badge" :class="ann.accomplished ? 'accomplished' : 'ongoing'">
              <v-icon size="11">{{ ann.accomplished ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
              {{ ann.accomplished ? 'Accomplished' : 'Ongoing' }}
            </div>
            <span class="card-date">{{ formatDate(ann.created_at || ann.date) }}</span>
          </div>
        </div>

        <!-- Title & body -->
        <h2 class="card-title">{{ ann.title }}</h2>
        <p class="card-body">{{ ann.body }}</p>

        <!-- Footer -->
        <div class="card-footer">
          <div class="author">
            <div class="author-avatar" :style="{ background: avatarColor(authorName(ann)) }">
              {{ initials(authorName(ann)) }}
            </div>
            <span class="author-name">{{ authorName(ann) }}</span>
          </div>
          <div class="card-actions">
            <button class="card-btn view-btn" @click="openViewModal(ann)" title="View announcement">
              <v-icon size="14">mdi-eye-outline</v-icon>
            </button>
            <button class="card-btn edit-btn" @click="openEditModal(ann)">
              <v-icon size="14">mdi-pencil-outline</v-icon>
            </button>
            <button class="card-btn delete-btn" @click="confirmDelete(ann)">
              <v-icon size="14">mdi-trash-can-outline</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">
        <v-icon size="40" color="#94a3b8">mdi-bullhorn-outline</v-icon>
      </div>
      <p class="empty-title">No announcements yet</p>
      <p class="empty-sub">Create your first announcement to get started</p>
      <button class="btn-primary" @click="openCreateModal">
        <v-icon size="15" class="mr-1">mdi-plus</v-icon>
        New Announcement
      </button>
    </div>


    <!-- ── VIEW MODAL ──────────────────────────────── -->
    <transition name="modal">
      <div v-if="showViewModal" class="modal-backdrop" @click.self="showViewModal = false">
        <div class="modal modal-view">

          <!-- Colored top band based on status -->
          <div class="view-band" :class="viewTarget?.accomplished ? 'band-done' : 'band-ongoing'"></div>

          <div class="modal-header view-header">
            <div class="view-header-meta">
              <span class="recipient-tag" :class="recipientClass(viewTarget?.recipient)">
                <v-icon size="11" class="mr-1">mdi-account-group-outline</v-icon>
                {{ viewTarget?.recipient }}
              </span>
              <div class="status-badge" :class="viewTarget?.accomplished ? 'accomplished' : 'ongoing'">
                <v-icon size="11">{{ viewTarget?.accomplished ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
                {{ viewTarget?.accomplished ? 'Accomplished' : 'Ongoing' }}
              </div>
            </div>
            <button class="modal-close" @click="showViewModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="view-body">
            <h2 class="view-title">{{ viewTarget?.title }}</h2>

            <div class="view-meta-row">
              <div class="view-author">
                <div class="author-avatar" :style="{ background: avatarColor(authorName(viewTarget)) }">
                  {{ initials(authorName(viewTarget)) }}
                </div>
                <div class="view-author-info">
                  <span class="view-author-name">{{ authorName(viewTarget) }}</span>
                  <span class="view-date">Posted {{ formatDate(viewTarget?.created_at || viewTarget?.date) }}</span>
                </div>
              </div>
            </div>

            <div class="view-divider"></div>

            <p class="view-content">{{ viewTarget?.body }}</p>
          </div>

          <div class="modal-footer view-footer">
            <button class="btn-cancel" @click="showViewModal = false">Close</button>
          </div>

        </div>
      </div>
    </transition>

    <!-- ── CREATE / EDIT MODAL ─────────────────────── -->
    <transition name="modal">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">

          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ isEditing ? 'Edit Announcement' : 'New Announcement' }}</h2>
              <p class="modal-sub">{{ isEditing ? 'Update your announcement details' : 'Fill in the details below to post' }}</p>
            </div>
            <button class="modal-close" @click="closeModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- Title -->
            <div class="form-field">
              <label class="field-label">Title <span class="req">*</span></label>
              <input
                v-model="form.title"
                class="f-input"
                placeholder="Announcement title…"
                autofocus
              />
            </div>

            <!-- Recipient + Status row -->
            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Recipient <span class="req">*</span></label>
                <div class="select-wrap">
                  <select v-model="form.recipient" class="f-select">
                    <option v-for="r in recipients" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <v-icon size="15" class="select-arrow">mdi-chevron-down</v-icon>
                </div>
              </div>
              <div class="form-field status-field">
                <label class="field-label">Status</label>
                <label class="toggle-wrap">
                  <input type="checkbox" v-model="form.accomplished" class="toggle-input" />
                  <span class="toggle-slider" />
                  <span class="toggle-label">{{ form.accomplished ? 'Accomplished' : 'Ongoing' }}</span>
                </label>
              </div>
            </div>

            <!-- Body -->
            <div class="form-field">
              <label class="field-label">Content <span class="req">*</span></label>
              <textarea
                v-model="form.body"
                class="f-textarea"
                rows="5"
                placeholder="Write your announcement here…"
              />
              <span class="char-count">{{ form.body.length }} characters</span>
            </div>

            <!-- API Error inside modal -->
            <div v-if="modalError" class="modal-error">
              <v-icon size="14" color="#ef4444">mdi-alert-circle-outline</v-icon>
              {{ modalError }}
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal" :disabled="saving">Cancel</button>
            <button
              class="btn-save"
              @click="saveAnnouncement"
              :disabled="!form.title.trim() || !form.body.trim() || saving"
            >
              <v-icon size="15" class="mr-1">
                {{ saving ? 'mdi-loading mdi-spin' : (isEditing ? 'mdi-content-save-outline' : 'mdi-bullhorn-outline') }}
              </v-icon>
              {{ saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Post Announcement') }}
            </button>
          </div>

        </div>
      </div>
    </transition>


    <!-- ── DELETE CONFIRM ──────────────────────────── -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal modal-sm">
          <div class="del-icon-wrap">
            <v-icon size="28" color="#ef4444">mdi-trash-can-outline</v-icon>
          </div>
          <h2 class="modal-title">Delete Announcement</h2>
          <p class="del-msg">
            Are you sure you want to delete <strong>"{{ deleteTarget?.title }}"</strong>? This cannot be undone.
          </p>
          <div class="modal-footer centered">
            <button class="btn-cancel" @click="showDeleteModal = false" :disabled="deleting">Cancel</button>
            <button class="btn-delete" @click="deleteAnnouncement" :disabled="deleting">
              {{ deleting ? 'Deleting…' : 'Delete' }}
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
const API_BASE = `${config.public.apiBase}/api/announcements`;

/* ── Recipients ──────────────────────────────────── */
const recipients = ["All Members", "Officers", "New Testament", "Old Testament"];

/* ── Filters ─────────────────────────────────────── */
const filters = [
  { value: "all",           label: "All" },
  { value: "ongoing",       label: "🕐 Ongoing" },
  { value: "accomplished",  label: "✅ Accomplished" },
  { value: "All Members",   label: "All Members" },
  { value: "Officers",      label: "Officers" },
  { value: "New Testament", label: "New Testament" },
  { value: "Old Testament", label: "Old Testament" },
];

/* ── State ───────────────────────────────────────── */
const announcements  = ref([]);
const loading        = ref(false);
const error          = ref(null);
const togglingId     = ref(null);
const saving         = ref(false);
const deleting       = ref(false);
const modalError     = ref(null);

/* ── Search & filter ─────────────────────────────── */
const search       = ref("");
const activeFilter = ref("all");

const filteredAnnouncements = computed(() => {
  let list = announcements.value;

  if (activeFilter.value === "accomplished") {
    list = list.filter(a => a.accomplished);
  } else if (activeFilter.value === "ongoing") {
    list = list.filter(a => !a.accomplished);
  } else if (activeFilter.value !== "all") {
    list = list.filter(a => a.recipient === activeFilter.value);
  }

  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q) ||
      (authorName(a)).toLowerCase().includes(q) ||
      a.recipient.toLowerCase().includes(q)
    );
  }

  // Ongoing first
  return [...list].sort((a, b) => (a.accomplished ? 1 : 0) - (b.accomplished ? 1 : 0));
});

/* ── API: Fetch ──────────────────────────────────── */
const fetchAnnouncements = async () => {
  loading.value = true;
  error.value   = null;
  try {
    const data = await $fetch(API_BASE);
    announcements.value = (data.data || []).map(a => ({ ...a, isNew: false }));
  } catch (e) {
    error.value = e?.data?.message || e?.message || "Something went wrong.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAnnouncements);

/* ── Helpers ─────────────────────────────────────── */
const authorName = (ann) => ann.user?.name || ann.author || "Unknown";

const formatDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const recipientClass = (r) =>
  ({
    "All Members":   "all-members",
    "Officers":      "officers",
    "New Testament": "new-testament",
    "Old Testament": "old-testament",
  }[r] || "all-members");

const palette    = ["#0369a1", "#0891b2", "#0c4a6e", "#0e7490", "#075985"];
const avatarColor = (name) => palette[(name || "?").charCodeAt(0) % palette.length];
const initials    = (name) => (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/* ── API: Toggle ─────────────────────────────────── */
const toggleAccomplished = async (ann) => {
  togglingId.value = ann.id;
  try {
    const data = await $fetch(`${API_BASE}/${ann.id}/toggle`, { method: "PATCH" });
    ann.accomplished = data.data.accomplished;
  } catch (e) {
    console.error("Toggle failed:", e);
  } finally {
    togglingId.value = null;
  }
};

/* ── View Modal ──────────────────────────────────── */
const showViewModal = ref(false);
const viewTarget    = ref(null);

const openViewModal = (ann) => {
  viewTarget.value    = ann;
  showViewModal.value = true;
};

const openEditFromView = () => {
  showViewModal.value = false;
  openEditModal(viewTarget.value);
};

const toggleFromView = async () => {
  await toggleAccomplished(viewTarget.value);
  const updated = announcements.value.find(a => a.id === viewTarget.value?.id);
  if (updated) viewTarget.value = updated;
};

/* ── Create/Edit Modal ───────────────────────────── */
const showModal  = ref(false);
const isEditing  = ref(false);
const editTarget = ref(null);

const emptyForm = () => ({ title: "", body: "", recipient: "All Members", accomplished: false });
const form      = ref(emptyForm());

const openCreateModal = () => {
  form.value   = emptyForm();
  isEditing.value  = false;
  editTarget.value = null;
  modalError.value = null;
  showModal.value  = true;
};

const openEditModal = (ann) => {
  form.value = {
    title:        ann.title,
    body:         ann.body,
    recipient:    ann.recipient,
    accomplished: !!ann.accomplished,
  };
  isEditing.value  = true;
  editTarget.value = ann;
  modalError.value = null;
  showModal.value  = true;
};

const closeModal = () => {
  if (saving.value) return;
  showModal.value = false;
};

/* ── API: Save (create / update) ─────────────────── */
const saveAnnouncement = async () => {
  if (!form.value.title.trim() || !form.value.body.trim()) return;

  saving.value     = true;
  modalError.value = null;

  const payload = {
    title:        form.value.title.trim(),
    body:         form.value.body.trim(),
    recipient:    form.value.recipient,
    accomplished: form.value.accomplished,
  };

  try {
    if (isEditing.value && editTarget.value) {
      // UPDATE
      const data = await $fetch(`${API_BASE}/${editTarget.value.id}`, {
        method: "PUT",
        body:   payload,
      });
      const updated = data.data;
      const idx = announcements.value.findIndex(a => a.id === editTarget.value.id);
      if (idx !== -1) announcements.value[idx] = { ...announcements.value[idx], ...updated, isNew: false };
    } else {
      // CREATE
      const data = await $fetch(API_BASE, {
        method: "POST",
        body:   payload,
      });
      const created = { ...data.data, isNew: true };
      announcements.value.unshift(created);
      setTimeout(() => {
        const a = announcements.value.find(a => a.id === created.id);
        if (a) a.isNew = false;
      }, 2000);
    }
    showModal.value = false;
  } catch (e) {
    modalError.value = e?.data?.message || e?.message || "Failed to save. Please try again.";
  } finally {
    saving.value = false;
  }
};

/* ── API: Delete ─────────────────────────────────── */
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);

const confirmDelete = (ann) => {
  deleteTarget.value    = ann;
  showDeleteModal.value = true;
};

const deleteAnnouncement = async () => {
  deleting.value = true;
  try {
    await $fetch(`${API_BASE}/${deleteTarget.value.id}`, { method: "DELETE" });
    announcements.value   = announcements.value.filter(a => a.id !== deleteTarget.value.id);
    showDeleteModal.value = false;
  } catch (e) {
    console.error("Delete failed:", e);
  } finally {
    deleting.value = false;
  }
};
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.ann-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
}

/* ── Header ──────────────────────────────────────── */
.page-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 20px; gap: 12px;
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

/* ── Toolbar ─────────────────────────────────────── */
.toolbar {
  display: flex; gap: 10px; margin-bottom: 20px;
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
  padding: 6px 14px; border: 1.5px solid #e2e8f0; border-radius: 20px;
  background: white; font-size: 0.78rem; font-weight: 500; color: #475569;
  cursor: pointer; transition: all 0.15s; font-family: "DM Sans", sans-serif;
}
.filter-chip:hover { border-color: #0369a1; color: #0369a1; }
.filter-chip.active { border-color: #0369a1; background: #eff6ff; color: #0369a1; font-weight: 600; }

/* ── Loading ─────────────────────────────────────── */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 70px 20px; color: #94a3b8; font-size: 0.875rem;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #0369a1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Error ───────────────────────────────────────── */
.error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 60px 20px; text-align: center;
}
.error-title { font-family: "DM Serif Display", serif; font-size: 1.1rem; color: #334155; margin: 0; }
.error-sub   { font-size: 0.82rem; color: #94a3b8; margin: 0 0 6px; }

/* ── Cards grid ──────────────────────────────────── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.ann-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  display: flex; flex-direction: column; gap: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s, transform 0.15s;
  position: relative;
  overflow: hidden;
}
.ann-card:hover {
  box-shadow: 0 6px 20px rgba(3,105,161,0.1);
  transform: translateY(-2px);
}
.ann-card.is-accomplished {
  border-color: #bbf7d0;
  background: linear-gradient(to bottom right, #f0fdf4, white);
  opacity: 0.85;
}
.ann-card.is-accomplished::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(to right, #15803d, #4ade80);
}
.ann-card.is-new { animation: flash-card 2s ease-out; }
@keyframes flash-card {
  0%   { box-shadow: 0 0 0 3px rgba(59,130,246,0.4); }
  100% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
}

/* Card header */
.card-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 8px;
}
.card-header-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;
}

/* Status badge — now in normal flow, no absolute positioning */
.status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.65rem; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  letter-spacing: 0.04em; text-transform: uppercase;
  white-space: nowrap;
}
.status-badge.ongoing      { background: #fefce8; color: #a16207; }
.status-badge.accomplished { background: #dcfce7; color: #15803d; }

.card-date { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; }

.recipient-tag {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  background: #eff6ff; color: #0369a1; border: 1px solid #bae6fd;
}
.recipient-tag.all-members   { background: #eff6ff; color: #0369a1;  border-color: #bae6fd; }
.recipient-tag.officers       { background: #fdf4ff; color: #7e22ce;  border-color: #e9d5ff; }
.recipient-tag.new-testament  { background: #f0fdf4; color: #15803d;  border-color: #bbf7d0; }
.recipient-tag.old-testament  { background: #fefce8; color: #a16207;  border-color: #fde68a; }

/* Title & body */
.card-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.05rem; font-weight: 400; color: #0f172a;
  margin: 0; line-height: 1.35;
}
.card-body {
  font-size: 0.845rem; color: #475569; line-height: 1.65;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card footer */
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 4px; padding-top: 12px; border-top: 1px solid #f1f5f9;
  gap: 8px;
}
.author { display: flex; align-items: center; gap: 8px; }
.author-avatar {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700; color: white; flex-shrink: 0;
}
.author-name { font-size: 0.78rem; font-weight: 500; color: #64748b; }

.card-actions { display: flex; gap: 5px; }
.card-btn {
  width: 28px; height: 28px; border-radius: 7px;
  border: 1.5px solid #e2e8f0; background: white;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: #94a3b8; transition: all 0.15s;
}
.card-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.card-btn.view-btn:hover   { border-color: #7e22ce; background: #fdf4ff; color: #7e22ce; }
.card-btn.edit-btn:hover   { border-color: #0369a1; background: #eff6ff; color: #0369a1; }
.card-btn.delete-btn:hover { border-color: #ef4444; background: #fef2f2; color: #ef4444; }

/* ── Empty state ─────────────────────────────────── */
.empty-state {
  text-align: center; padding: 60px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.empty-icon {
  width: 72px; height: 72px; border-radius: 20px;
  background: #f1f5f9; display: flex; align-items: center;
  justify-content: center; margin-bottom: 4px;
}
.empty-title { font-family: "DM Serif Display", serif; font-size: 1.2rem; color: #334155; margin: 0; }
.empty-sub   { font-size: 0.82rem; color: #94a3b8; margin: 0 0 6px; }

/* ── Modal ───────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
}
.modal-sm { max-width: 380px; padding: 28px 24px; text-align: center; }

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.15rem; font-weight: 400; color: #0f172a; margin: 0;
}
.modal-sub { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex;
  transition: color 0.15s, background 0.15s; flex-shrink: 0;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }

.modal-body {
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 16px;
}

/* Form fields */
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-row   { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: start; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #334155; }
.req { color: #ef4444; }

.f-input, .f-textarea {
  width: 100%; padding: 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.f-input:focus, .f-textarea:focus {
  border-color: #0369a1; background: white;
  box-shadow: 0 0 0 3px rgba(3,105,161,0.1);
}
.f-input::placeholder, .f-textarea::placeholder { color: #cbd5e1; }
.f-textarea { resize: vertical; min-height: 120px; }

.char-count { font-size: 0.7rem; color: #cbd5e1; text-align: right; }

.select-wrap { position: relative; }
.f-select {
  width: 100%; padding: 10px 32px 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif;
  color: #0f172a; background: #f8fafc; outline: none;
  appearance: none; cursor: pointer;
  transition: border-color 0.15s;
}
.f-select:focus { border-color: #0369a1; }
.select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

/* Toggle (status) */
.status-field { justify-content: flex-end; }
.toggle-wrap {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; user-select: none; padding-top: 4px;
}
.toggle-input { display: none; }
.toggle-slider {
  width: 38px; height: 22px; border-radius: 11px;
  background: #e2e8f0; position: relative;
  transition: background 0.2s; flex-shrink: 0;
}
.toggle-slider::after {
  content: ""; position: absolute;
  top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: white; transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-input:checked + .toggle-slider { background: #22c55e; }
.toggle-input:checked + .toggle-slider::after { transform: translateX(16px); }
.toggle-label { font-size: 0.78rem; color: #64748b; white-space: nowrap; }

/* Modal error */
.modal-error {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px; border-radius: 8px;
  background: #fef2f2; border: 1px solid #fecaca;
  font-size: 0.8rem; color: #ef4444;
}

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
}
.modal-footer.centered { justify-content: center; border-top: none; padding-top: 0; }

.btn-cancel {
  padding: 8px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer;
  transition: border-color 0.15s;
}
.btn-cancel:hover:not(:disabled) { border-color: #94a3b8; }
.btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

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

/* Delete */
.del-icon-wrap {
  width: 56px; height: 56px; border-radius: 50%;
  background: #fef2f2; border: 2px solid #fecaca;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
}
.del-msg { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin: 8px 0 20px; }
.btn-delete {
  padding: 8px 20px; border: none; border-radius: 9px;
  background: #ef4444; color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-delete:hover:not(:disabled) { opacity: 0.88; }
.btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── View Modal ──────────────────────────────────── */
.modal-view { max-width: 560px; overflow: hidden; padding: 0; }

.view-band {
  height: 5px; width: 100%;
}
.view-band.band-ongoing  { background: linear-gradient(to right, #f59e0b, #fbbf24); }
.view-band.band-done     { background: linear-gradient(to right, #15803d, #4ade80); }

.view-header {
  padding: 16px 24px 14px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
}
.view-header-meta {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1;
}

.view-body {
  padding: 22px 24px 20px;
  display: flex; flex-direction: column; gap: 14px;
}

.view-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.35rem; font-weight: 400; color: #0f172a;
  margin: 0; line-height: 1.35;
}

.view-meta-row {
  display: flex; align-items: center; gap: 14px;
}

.view-author {
  display: flex; align-items: center; gap: 10px;
}
.view-author-info {
  display: flex; flex-direction: column; gap: 1px;
}
.view-author-name {
  font-size: 0.82rem; font-weight: 600; color: #334155;
}
.view-date {
  font-size: 0.72rem; color: #94a3b8;
}

.view-divider {
  height: 1px; background: #f1f5f9; margin: 0;
}

.view-content {
  font-size: 0.9rem; color: #374151; line-height: 1.75;
  margin: 0; white-space: pre-wrap; word-break: break-word;
}

.view-footer {
  justify-content: flex-end; gap: 8px;
  border-top: 1px solid #f1f5f9;
  padding: 14px 24px 20px;
}

.btn-view-edit {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 16px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer;
  transition: all 0.15s;
}
.btn-view-edit:hover { border-color: #0369a1; background: #eff6ff; color: #0369a1; }

.btn-toggle-status {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 16px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #15803d, #22c55e);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(21,128,61,0.25); transition: opacity 0.15s;
}
.btn-toggle-status:hover:not(:disabled) { opacity: 0.88; }
.btn-toggle-status:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Transitions ─────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
</style>