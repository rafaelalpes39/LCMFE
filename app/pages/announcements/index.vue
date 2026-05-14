<template>
  <div class="ann-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Announcements</h1>
        <p class="page-sub">{{ announcements.length }} announcement{{ announcements.length !== 1 ? 's' : '' }} posted</p>
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

    <!-- CARDS GRID -->
    <div class="cards-grid" v-if="filteredAnnouncements.length > 0">
      <div
        v-for="ann in filteredAnnouncements"
        :key="ann.id"
        class="ann-card"
        :class="{ 'is-accomplished': ann.accomplished, 'is-new': ann.isNew }"
      >
        <!-- Status badge -->
        <div class="status-badge" :class="ann.accomplished ? 'accomplished' : 'ongoing'">
          <v-icon size="11">{{ ann.accomplished ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
          {{ ann.accomplished ? 'Accomplished' : 'Ongoing' }}
        </div>

        <!-- Card header -->
        <div class="card-header">
          <span class="recipient-tag" :class="ann.recipient.toLowerCase().replace(/\s+/g, '-')">
            <v-icon size="11" class="mr-1">mdi-account-group-outline</v-icon>
            {{ ann.recipient }}
          </span>
          <span class="card-date">{{ ann.date }}</span>
        </div>

        <!-- Title & body -->
        <h2 class="card-title">{{ ann.title }}</h2>
        <p class="card-body">{{ ann.body }}</p>

        <!-- Footer -->
        <div class="card-footer">
          <div class="author">
            <div class="author-avatar" :style="{ background: avatarColor(ann.author) }">
              {{ initials(ann.author) }}
            </div>
            <span class="author-name">{{ ann.author }}</span>
          </div>
          <div class="card-actions">
            <button
              class="card-btn status-btn"
              @click="toggleAccomplished(ann)"
              :title="ann.accomplished ? 'Mark as Ongoing' : 'Mark as Accomplished'"
            >
              <v-icon size="14">{{ ann.accomplished ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline' }}</v-icon>
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
    <div v-else class="empty-state">
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

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button
              class="btn-save"
              @click="saveAnnouncement"
              :disabled="!form.title.trim() || !form.body.trim()"
            >
              <v-icon size="15" class="mr-1">{{ isEditing ? 'mdi-content-save-outline' : 'mdi-bullhorn-outline' }}</v-icon>
              {{ isEditing ? 'Save Changes' : 'Post Announcement' }}
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
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-delete" @click="deleteAnnouncement">Delete</button>
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

/* ── Recipients ──────────────────────────────────── */
const recipients = ["All Members", "Lectors", "Commentators", "Coordinators", "Administrators"];

/* ── Filters ─────────────────────────────────────── */
const filters = [
  { value: "all",           label: "All" },
  { value: "ongoing",       label: "🕐 Ongoing" },
  { value: "accomplished",  label: "✅ Accomplished" },
  { value: "All Members",   label: "All Members" },
  { value: "Lectors",       label: "Lectors" },
  { value: "Commentators",  label: "Commentators" },
  { value: "Coordinators",  label: "Coordinators" },
  { value: "Administrators",label: "Administrators" },
];

/* ── Data ────────────────────────────────────────── */
const announcements = ref([
  {
    id: 1,
    title: "Mass Schedule for Holy Week",
    body: "Please be informed that our Holy Week masses will follow a special schedule. Palm Sunday mass will be at 6AM, 8AM, and 10AM. Please arrive early to get a seat.",
    recipient: "All Members",
    author: "Fr. Jose Santos",
    date: "Mar 1, 2025",
    accomplished: false,
    isNew: false,
  },
  {
    id: 2,
    title: "Lectors & Commentators Formation Seminar",
    body: "All active lectors and commentators are required to attend the upcoming formation seminar on March 15. Attendance is mandatory. Please confirm your attendance with the coordinator.",
    recipient: "Lectors",
    author: "Maria Reyes",
    date: "Feb 28, 2025",
    accomplished: false,
    isNew: false,
  },
  {
    id: 3,
    title: "Reminder: Submit Your Availability",
    body: "Kindly submit your availability for the month of April on or before March 10. Late submissions will not be accommodated in the scheduling.",
    recipient: "Commentators",
    author: "Ana Cruz",
    date: "Feb 25, 2025",
    accomplished: true,
    isNew: false,
  },
  {
    id: 4,
    title: "New Member Orientation",
    body: "Welcome to our new members! An orientation will be held on March 8 at 3PM in the parish hall. Please bring a valid ID and your baptismal certificate.",
    recipient: "All Members",
    author: "Pedro Dela Cruz",
    date: "Feb 20, 2025",
    accomplished: true,
    isNew: false,
  },
  {
    id: 5,
    title: "Coordinator Meeting This Saturday",
    body: "All coordinators are required to attend the monthly meeting this Saturday at 9AM in the sacristy. Agenda will be sent via group chat.",
    recipient: "Coordinators",
    author: "Maria Reyes",
    date: "Mar 2, 2025",
    accomplished: false,
    isNew: false,
  },
]);

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
      a.author.toLowerCase().includes(q) ||
      a.recipient.toLowerCase().includes(q)
    );
  }

  // Ongoing first
  return [...list].sort((a, b) => (a.accomplished ? 1 : 0) - (b.accomplished ? 1 : 0));
});

/* ── Avatar helpers ──────────────────────────────── */
const palette = ["#0369a1", "#0891b2", "#0c4a6e", "#0e7490", "#075985"];
const avatarColor = (name) => palette[name.charCodeAt(0) % palette.length];
const initials    = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

/* ── Toggle accomplished ─────────────────────────── */
const toggleAccomplished = (ann) => { ann.accomplished = !ann.accomplished; };

/* ── Modal ───────────────────────────────────────── */
const showModal  = ref(false);
const isEditing  = ref(false);
const editTarget = ref(null);

const emptyForm = () => ({ title: "", body: "", recipient: "All Members", accomplished: false });
const form      = ref(emptyForm());

const openCreateModal = () => {
  form.value = emptyForm();
  isEditing.value = false;
  showModal.value = true;
};

const openEditModal = (ann) => {
  form.value = { title: ann.title, body: ann.body, recipient: ann.recipient, accomplished: ann.accomplished };
  isEditing.value  = true;
  editTarget.value = ann;
  showModal.value  = true;
};

const closeModal = () => { showModal.value = false; };

const saveAnnouncement = () => {
  if (!form.value.title.trim() || !form.value.body.trim()) return;

  if (isEditing.value && editTarget.value) {
    Object.assign(editTarget.value, {
      title:        form.value.title.trim(),
      body:         form.value.body.trim(),
      recipient:    form.value.recipient,
      accomplished: form.value.accomplished,
      isNew:        false,
    });
  } else {
    announcements.value.unshift({
      id:           Date.now(),
      title:        form.value.title.trim(),
      body:         form.value.body.trim(),
      recipient:    form.value.recipient,
      accomplished: form.value.accomplished,
      author:       "You",
      date:         new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      isNew:        true,
    });
    setTimeout(() => {
      const a = announcements.value.find(a => a.isNew);
      if (a) a.isNew = false;
    }, 2000);
  }
  closeModal();
};

/* ── Delete ──────────────────────────────────────── */
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);

const confirmDelete       = (ann) => { deleteTarget.value = ann; showDeleteModal.value = true; };
const deleteAnnouncement  = () => {
  announcements.value = announcements.value.filter(a => a.id !== deleteTarget.value.id);
  showDeleteModal.value = false;
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

/* Status badge */
.status-badge {
  position: absolute; top: 14px; right: 14px;
  display: flex; align-items: center; gap: 4px;
  font-size: 0.65rem; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.status-badge.ongoing      { background: #fefce8; color: #a16207; }
.status-badge.accomplished { background: #dcfce7; color: #15803d; }

/* Card header */
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
}
.recipient-tag {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em;
  background: #eff6ff; color: #0369a1; border: 1px solid #bae6fd;
}
.recipient-tag.all-members   { background: #eff6ff; color: #0369a1; border-color: #bae6fd; }
.recipient-tag.lectors        { background: #fdf4ff; color: #7e22ce; border-color: #e9d5ff; }
.recipient-tag.commentators   { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.recipient-tag.coordinators   { background: #fefce8; color: #a16207; border-color: #fde68a; }
.recipient-tag.administrators { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }

.card-date { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; margin-right: 110px; }

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
.card-btn.status-btn:hover { border-color: #22c55e; background: #f0fdf4; color: #15803d; }
.card-btn.edit-btn:hover  { border-color: #0369a1; background: #eff6ff; color: #0369a1; }
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
.btn-delete:hover { opacity: 0.88; }

/* ── Transitions ─────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
</style>