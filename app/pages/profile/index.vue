<template>
  <div class="profile-page">

    <!-- ══ HERO BANNER ══ -->
    <div class="hero-card">
      <div class="hero-banner">
        <div class="banner-pattern" />
        <div class="banner-glow" />
      </div>

      <div class="hero-body">
        <!-- Left: Avatar + Name -->
        <div class="hero-left">
          <div class="avatar-wrap">
            <div class="avatar-ring" :class="statusClass">
              <img v-if="user?.profile" :src="user.profile" class="avatar-img" alt="profile photo" />
              <div v-else class="avatar-initials" :style="{ background: avatarColor(user?.name) }">
                {{ initials(user?.name) }}
              </div>
            </div>
            <label class="avatar-edit-btn" title="Change photo">
              <v-icon size="13" color="white">mdi-camera</v-icon>
              <input type="file" accept="image/*" class="hidden-file" @change="onPhotoChange" />
            </label>
          </div>

          <div class="hero-identity">
            <div class="hero-name-row">
              <h1 class="hero-name">{{ user?.name ?? '—' }}</h1>
              <span class="status-badge" :class="statusClass">
                <span class="status-dot" />{{ user?.status ?? '—' }}
              </span>
            </div>
            <div class="hero-meta">
              <span class="hero-role-badge" :class="(user?.role ?? '').toLowerCase()">
                {{ user?.role ?? '—' }}
              </span>
              <span class="hero-sep">·</span>
              <span class="hero-id">
                <v-icon size="12" class="mr-1" color="#94a3b8">mdi-identifier</v-icon>
                {{ user?.membership_id ?? 'N/A' }}
              </span>
            </div>
            <p class="hero-parish">
              <v-icon size="13" class="mr-1" color="#7dd3fc">mdi-account-group</v-icon>
              Team: {{ user?.team ?? '—' }}
            </p>
          </div>
        </div>

        <!-- Right: Quick stats strip -->
        <div class="hero-right">
          <div class="stat-pill">
            <span class="stat-val">{{ yearsOfService }}</span>
            <span class="stat-lbl">yrs service</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-pill">
            <span class="stat-val">{{ attendanceRate }}%</span>
            <span class="stat-lbl">attendance</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-pill">
            <span class="stat-val">{{ totalMasses }}</span>
            <span class="stat-lbl">masses served</span>
          </div>
        </div>
      </div>
    </div>


    <!-- ══ MAIN GRID ══ -->
    <div class="main-grid">

      <!-- LEFT COL -->
      <div class="col-left">

        <!-- Personal Info -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-wrap">
                <v-icon size="15" color="#0369a1">mdi-account-outline</v-icon>
              </div>
              <h2 class="card-title">Personal Information</h2>
            </div>
            <button class="edit-btn" @click="openEditModal">
              <v-icon size="13" class="mr-1">mdi-pencil-outline</v-icon>Edit
            </button>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-account</v-icon>Full Name
              </span>
              <span class="info-val">{{ user?.name ?? '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-email-outline</v-icon>Email
              </span>
              <a v-if="user?.email" :href="`mailto:${user.email}`" class="info-val link">
                {{ user.email }}
              </a>
              <span v-else class="info-val">—</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-phone-outline</v-icon>Phone
              </span>
              <span class="info-val">{{ user?.cp_number ?? '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-account-group</v-icon>Team
              </span>
              <span class="info-val">{{ user?.team ?? '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-shield-account-outline</v-icon>Role
              </span>
              <span class="role-badge" :class="(user?.role ?? '').toLowerCase()">
                {{ user?.role ?? '—' }}
              </span>
            </div>
            <div class="info-row last">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-circle-outline</v-icon>Status
              </span>
              <span class="status-badge sm" :class="statusClass">
                <span class="status-dot" />{{ user?.status ?? '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Membership Dates -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-wrap">
                <v-icon size="15" color="#0369a1">mdi-calendar-account-outline</v-icon>
              </div>
              <h2 class="card-title">Membership Dates</h2>
            </div>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-calendar-plus</v-icon>Date Joined
              </span>
              <span class="info-val">{{ user?.joined_date ? fmtDate(user.joined_date) : '—' }}</span>
            </div>
            <div class="info-row last">
              <span class="info-label">
                <v-icon size="14" color="#94a3b8" class="mr-2">mdi-calendar-refresh</v-icon>Renewal Date
              </span>
              <span
                class="info-val"
                :class="{ 'text-warn': daysUntilRenewal <= 30, 'text-danger': daysUntilRenewal <= 7 }"
              >
                {{ user?.membership_expiration ? fmtDate(user.membership_expiration) : '—' }}
                <span
                  v-if="user?.membership_expiration && daysUntilRenewal <= 60"
                  class="days-left-tag"
                  :class="renewalUrgency"
                >
                  {{ daysUntilRenewal }}d left
                </span>
              </span>
            </div>
          </div>
        </div>

      </div>


      <!-- RIGHT COL -->
      <div class="col-right">

        <!-- Renewal Status Card -->
        <div class="renewal-card" :class="renewalUrgency">
          <div class="renewal-top">
            <div class="renewal-icon-wrap" :class="renewalUrgency">
              <v-icon size="22" :color="renewalIconColor">
                {{ renewalUrgency === 'ok' ? 'mdi-shield-check' : 'mdi-shield-alert' }}
              </v-icon>
            </div>
            <div>
              <p class="renewal-title">Membership Status</p>
              <p class="renewal-status-label" :class="renewalUrgency">
                {{
                  renewalUrgency === 'ok'      ? 'In good standing'   :
                  renewalUrgency === 'warn'    ? 'Renewal coming up'  :
                  renewalUrgency === 'urgent'  ? 'Renewal urgent!'    : 'Membership expired'
                }}
              </p>
            </div>
          </div>
         
          <div class="renewal-progress-wrap">
            <div class="renewal-progress-track">
              <div
                class="renewal-progress-bar"
                :class="renewalUrgency"
                :style="{ width: renewalProgressPct + '%' }"
              />
            </div>
            <div class="renewal-progress-labels">
              <span>{{ user?.joined_date ? fmtDate(user.joined_date) : '—' }}</span>
              <span>{{ user?.membership_expiration ? fmtDate(user.membership_expiration) : '—' }}</span>
            </div>
          </div>
          <div class="renewal-footer">
            <div class="renewal-days-block">
              <span class="renewal-days-num" :class="renewalUrgency">
                {{ daysUntilRenewal > 0 ? daysUntilRenewal : Math.abs(daysUntilRenewal) }}
              </span>
              <span class="renewal-days-lbl">
                {{ daysUntilRenewal > 0 ? 'days until renewal' : 'days overdue' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Attendance Ring Card -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-wrap">
                <v-icon size="15" color="#0369a1">mdi-chart-donut</v-icon>
              </div>
              <h2 class="card-title">Attendance Overview</h2>
            </div>
          </div>
          <div class="attendance-body">
            <div class="donut-wrap">
              <svg viewBox="0 0 120 120" class="donut-svg">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f1f5f9" stroke-width="12" />
                <circle
                  cx="60" cy="60" r="48" fill="none"
                  stroke="#0369a1" stroke-width="12"
                  stroke-linecap="round"
                  :stroke-dasharray="`${attendanceRate * 3.016} 301.6`"
                  stroke-dashoffset="75.4"
                  transform="rotate(-90 60 60)"
                  style="transition: stroke-dasharray 0.8s ease;"
                />
                <circle
                  cx="60" cy="60" r="48" fill="none"
                  stroke="#fca5a5" stroke-width="12"
                  stroke-linecap="round"
                  :stroke-dasharray="`${absentRate * 3.016} 301.6`"
                  :stroke-dashoffset="`${75.4 - attendanceRate * 3.016}`"
                  transform="rotate(-90 60 60)"
                  style="transition: stroke-dasharray 0.8s ease;"
                />
                <text x="60" y="55" text-anchor="middle" class="donut-center-val">{{ attendanceRate }}%</text>
                <text x="60" y="70" text-anchor="middle" class="donut-center-lbl">present</text>
              </svg>
            </div>
            <div class="att-legend">
              <div class="att-leg-item">
                <div class="att-leg-dot" style="background:#0369a1" />
                <div>
                  <p class="att-leg-val">{{ attendanceStats.present }}</p>
                  <p class="att-leg-lbl">Present</p>
                </div>
              </div>
              <div class="att-leg-divider" />
              <div class="att-leg-item">
                <div class="att-leg-dot" style="background:#fca5a5" />
                <div>
                  <p class="att-leg-val">{{ attendanceStats.absent }}</p>
                  <p class="att-leg-lbl">Absent</p>
                </div>
              </div>
              <div class="att-leg-divider" />
              <div class="att-leg-item">
                <div class="att-leg-dot" style="background:#e2e8f0" />
                <div>
                  <p class="att-leg-val">{{ totalMasses }}</p>
                  <p class="att-leg-lbl">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Member ID Card -->
        <div class="id-card">
          <div class="id-card-bg" />
          <div class="id-card-body">
            <div class="id-card-top">
              <div class="id-avatar" :style="{ background: avatarColor(user?.name) }">
                <img v-if="user?.profile" :src="user.profile" class="id-avatar-img" alt="" />
                <span v-else class="id-avatar-initials">{{ initials(user?.name) }}</span>
              </div>
              <div>
                <p class="id-card-name">{{ user?.name ?? '—' }}</p>
                <p class="id-card-role">{{ user?.role ?? '—' }}</p>
              </div>
            </div>
            <div class="id-card-divider" />
            <div class="id-card-fields">
              <div class="id-field">
                <span class="id-field-lbl">Member ID</span>
                <span class="id-field-val mono">{{ user?.membership_id ?? 'N/A' }}</span>
              </div>
              <div class="id-field">
                <span class="id-field-lbl">Since</span>
                <span class="id-field-val">
                  {{ user?.joined_date ? fmtDateShort(user.joined_date) : '—' }}
                </span>
              </div>
              <div class="id-field">
                <span class="id-field-lbl">Team</span>
                <span class="id-field-val">{{ user?.team ?? '—' }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>


    <!-- ══ EDIT MODAL ══ -->
    <transition name="modal">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Edit Profile</h2>
            <button class="modal-close" @click="showEditModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field full">
                <label class="field-label">Full Name <span class="req">*</span></label>
                <input v-model="editForm.name" class="f-input" />
              </div>
              <div class="form-field">
                <label class="field-label">Email</label>
                <input v-model="editForm.email" type="email" class="f-input" />
              </div>
              <div class="form-field">
                <label class="field-label">Phone</label>
                <input v-model="editForm.cp_number" class="f-input" />
              </div>
              <div class="form-field">
                <label class="field-label">Role</label>
                <div class="select-wrap">
                  <select v-model="editForm.role" class="f-select">
                    <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
                  </select>
                  <v-icon size="15" class="select-arrow">mdi-chevron-down</v-icon>
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">Status</label>
                <div class="select-wrap">
                  <select v-model="editForm.status" class="f-select">
                    <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <v-icon size="15" class="select-arrow">mdi-chevron-down</v-icon>
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">Date of Renewal</label>
                <input v-model="editForm.membership_expiration" type="date" class="f-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showEditModal = false">Cancel</button>
            <button class="btn-save" @click="saveEdit">
              <v-icon size="14" class="mr-1">mdi-check</v-icon>Save Changes
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const auth = useAuthStore();

// storeToRefs keeps `user` reactive — UI updates instantly when the store changes, no refresh needed
const { user } = storeToRefs(auth);

/* ── Helpers ─────────────────────────────────────── */
const palette      = ["#0369a1","#0891b2","#0c4a6e","#0e7490","#075985","#155e75","#164e63"];
const avatarColor  = (name) => palette[((name ?? "?").charCodeAt(0)) % palette.length];
const initials     = (name) => (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const fmtDate      = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";

const roles    = ["Lector", "Commentator", "Coordinator", "Administrator"];
const statuses = ["active", "inactive", "pending renewal", "suspended"];

/* ── Attendance (placeholder — swap with real API data) ── */
const attendanceStats = computed(() => ({ present: 0, absent: 0 }));
const totalMasses     = computed(() => attendanceStats.value.present + attendanceStats.value.absent);
const attendanceRate  = computed(() => {
  const { present, absent } = attendanceStats.value;
  const total = present + absent;
  return total > 0 ? Math.round((present / total) * 100) : 0;
});
const absentRate = computed(() => 100 - attendanceRate.value);

/* ── Computed from user (all reactive via storeToRefs) ── */
const yearsOfService = computed(() => {
  const joined = user.value?.joined_date;
  if (!joined) return 0;
  return Math.floor((Date.now() - new Date(joined)) / (1000 * 60 * 60 * 24 * 365));
});

const statusClass = computed(() => {
  const s = (user.value?.status ?? "").toLowerCase().replace(" ", "-");
  return {
    active:            s === "active",
    inactive:          s === "inactive",
    "pending-renewal": s === "pending-renewal" || s === "pending renewal",
    suspended:         s === "suspended",
  };
});

const daysUntilRenewal = computed(() => {
  const exp = user.value?.membership_expiration;
  if (!exp) return 9999;
  return Math.ceil((new Date(exp) - new Date()) / (1000 * 60 * 60 * 24));
});

const renewalUrgency = computed(() => {
  const d = daysUntilRenewal.value;
  if (d === 9999) return "ok";
  if (d < 0)      return "expired";
  if (d <= 14)    return "urgent";
  if (d <= 60)    return "warn";
  return "ok";
});

const renewalIconColor = computed(() => ({
  ok: "#15803d", warn: "#a16207", urgent: "#dc2626", expired: "#ffffff"
})[renewalUrgency.value]);

const renewalProgressPct = computed(() => {
  const joined  = user.value?.joined_date;
  const renewal = user.value?.membership_expiration;
  if (!joined || !renewal) return 0;
  const pct = ((Date.now() - new Date(joined)) / (new Date(renewal) - new Date(joined))) * 100;
  return Math.min(Math.max(pct, 0), 100);
});

/* ── Edit modal ── */
const showEditModal = ref(false);
const editForm      = ref({});

const openEditModal = () => {
  editForm.value = {
    name:                  user.value?.name                  ?? "",
    email:                 user.value?.email                 ?? "",
    cp_number:             user.value?.cp_number             ?? "",
    role:                  user.value?.role                  ?? "",
    status:                user.value?.status                ?? "",
    membership_expiration: user.value?.membership_expiration ?? "",
  };
  showEditModal.value = true;
};

const saveEdit = () => {
  if (user.value) {
    Object.assign(user.value, editForm.value);
  }
  showEditModal.value = false;
};

/* ── Photo upload ── */
const onPhotoChange = (e) => {
  const file = e.target.files[0];
  if (!file || !user.value) return;
  const reader = new FileReader();
  reader.onload = (ev) => { user.value.profile = ev.target.result; };
  reader.readAsDataURL(file);
};
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.profile-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ══ HERO CARD ══ */
.hero-card {
  border-radius: 18px;
  overflow: hidden;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  position: relative;
}

.hero-banner {
  position: absolute; top: 0; left: 0; right: 0; height: 110px;
  background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #0891b2 100%);
  overflow: hidden;
}
.banner-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(125,211,252,0.12) 0%, transparent 40%);
}
.banner-glow {
  position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%);
  width: 500px; height: 60px;
  background: radial-gradient(ellipse, rgba(56,189,248,0.18) 0%, transparent 70%);
}

.hero-body {
  position: relative; z-index: 1;
  padding: 70px 28px 24px;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
}

/* Avatar */
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar-ring {
  width: 88px; height: 88px; border-radius: 20px;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  overflow: hidden; background: white;
  transition: border-color 0.2s;
}
.avatar-ring.active          { border-color: #22c55e; }
.avatar-ring.inactive        { border-color: #94a3b8; }
.avatar-ring.pending-renewal { border-color: #f59e0b; }
.avatar-ring.suspended       { border-color: #ef4444; }

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 700; color: white;
}
.avatar-edit-btn {
  position: absolute; bottom: -5px; right: -5px;
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; border: 2px solid white;
  box-shadow: 0 2px 8px rgba(3,105,161,0.3);
  transition: opacity 0.15s;
}
.avatar-edit-btn:hover { opacity: 0.85; }
.hidden-file { display: none; }

.hero-left { display: flex; align-items: flex-end; gap: 18px; }
.hero-identity { padding-bottom: 4px; }

.hero-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 5px; }
.hero-name {
  font-family: "DM Serif Display", serif;
  font-size: 1.5rem; font-weight: 400; color: #0f172a; margin: 0;
}
.hero-meta {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;
}
.hero-id {
  font-size: 0.75rem; color: #94a3b8;
  font-family: monospace; display: flex; align-items: center;
}
.hero-sep { color: #cbd5e1; }
.hero-parish { font-size: 0.78rem; color: #64748b; margin: 0; display: flex; align-items: center; }

/* Stats strip */
.hero-right {
  display: flex; align-items: center; gap: 0;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 14px; padding: 12px 0;
  flex-shrink: 0;
}
.stat-pill {
  display: flex; flex-direction: column; align-items: center;
  padding: 4px 22px; gap: 2px;
}
.stat-val { font-size: 1.25rem; font-weight: 700; color: #0f172a; line-height: 1; }
.stat-lbl { font-size: 0.62rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.stat-divider { width: 1px; height: 30px; background: #e2e8f0; }

/* ══ MAIN GRID ══ */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 768px) {
  .main-grid { grid-template-columns: 1fr; }
  .hero-body { padding: 65px 18px 20px; flex-direction: column; align-items: flex-start; }
  .hero-right { width: 100%; justify-content: center; }
}

.col-left, .col-right { display: flex; flex-direction: column; gap: 16px; }

/* ══ SECTION CARD ══ */
.section-card {
  background: white; border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  overflow: hidden;
}

.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid #f1f5f9;
  background: #fafcff;
}
.card-header-left { display: flex; align-items: center; gap: 10px; }
.card-icon-wrap {
  width: 30px; height: 30px; border-radius: 8px;
  background: #eff6ff; border: 1px solid #bae6fd;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-title {
  font-family: "DM Serif Display", serif;
  font-size: 0.95rem; font-weight: 400; color: #0f172a; margin: 0;
}

.edit-btn {
  display: flex; align-items: center; gap: 3px;
  padding: 5px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: white; font-size: 0.75rem; font-weight: 600; color: #64748b;
  cursor: pointer; font-family: "DM Sans", sans-serif; transition: all 0.15s;
}
.edit-btn:hover { border-color: #0369a1; color: #0369a1; background: #eff6ff; }

/* Info list */
.info-list { display: flex; flex-direction: column; }
.info-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 18px; border-bottom: 1px solid #f8fafc;
  gap: 12px;
}
.info-row.last { border-bottom: none; }
.info-label {
  display: flex; align-items: center;
  font-size: 0.78rem; color: #94a3b8; font-weight: 500;
  white-space: nowrap; flex-shrink: 0;
}
.info-val {
  font-size: 0.875rem; font-weight: 500; color: #0f172a;
  text-align: right;
}
.info-val.link { color: #0369a1; text-decoration: none; }
.info-val.link:hover { text-decoration: underline; }
.text-warn   { color: #a16207 !important; }
.text-danger { color: #dc2626 !important; }

/* Status / Role badges */
.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.7rem; font-weight: 700; border: 1.5px solid;
}
.status-badge.sm { padding: 2px 8px; font-size: 0.65rem; }
.status-badge.active          { background: #f0fdf4; color: #15803d; border-color: #86efac; }
.status-badge.inactive        { background: #f1f5f9; color: #64748b; border-color: #cbd5e1; }
.status-badge.pending-renewal { background: #fefce8; color: #a16207; border-color: #fde68a; }
.status-badge.suspended       { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.role-badge, .hero-role-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700;
}
.hero-role-badge { padding: 2px 9px; font-size: 0.72rem; }
.role-badge.lector, .hero-role-badge.lector               { background: #eff6ff; color: #1d4ed8; }
.role-badge.commentator, .hero-role-badge.commentator     { background: #f0fdf4; color: #15803d; }
.role-badge.coordinator, .hero-role-badge.coordinator     { background: #fefce8; color: #a16207; }
.role-badge.administrator, .hero-role-badge.administrator { background: #fdf4ff; color: #7e22ce; }

.days-left-tag {
  display: inline-block; font-size: 0.62rem; font-weight: 700;
  padding: 1px 6px; border-radius: 10px; margin-left: 6px;
}
.days-left-tag.ok      { background: #f0fdf4; color: #15803d; }
.days-left-tag.warn    { background: #fefce8; color: #a16207; }
.days-left-tag.urgent  { background: #fef2f2; color: #dc2626; }
.days-left-tag.expired { background: #ef4444; color: white; }

/* ══ RENEWAL CARD ══ */
.renewal-card {
  border-radius: 16px; padding: 18px;
  border: 1.5px solid; overflow: hidden; position: relative;
}
.renewal-card.ok      { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-color: #bbf7d0; }
.renewal-card.warn    { background: linear-gradient(135deg, #fefce8, #fef9c3); border-color: #fde68a; }
.renewal-card.urgent  { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-color: #fecaca; }
.renewal-card.expired { background: linear-gradient(135deg, #dc2626, #b91c1c); border-color: #991b1b; }

.renewal-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.renewal-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.renewal-icon-wrap.ok      { background: rgba(34,197,94,0.15); }
.renewal-icon-wrap.warn    { background: rgba(234,179,8,0.15); }
.renewal-icon-wrap.urgent  { background: rgba(239,68,68,0.15); }
.renewal-icon-wrap.expired { background: rgba(255,255,255,0.2); }

.renewal-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin: 0 0 2px; }
.renewal-card.expired .renewal-title { color: rgba(255,255,255,0.75); }
.renewal-status-label { font-size: 0.88rem; font-weight: 700; margin: 0; }
.renewal-status-label.ok      { color: #15803d; }
.renewal-status-label.warn    { color: #a16207; }
.renewal-status-label.urgent  { color: #dc2626; }
.renewal-status-label.expired { color: #ffffff; }

.renewal-progress-wrap { margin-bottom: 14px; }
.renewal-progress-track {
  height: 6px; background: rgba(0,0,0,0.08); border-radius: 99px; overflow: hidden; margin-bottom: 6px;
}
.renewal-progress-bar {
  height: 100%; border-radius: 99px; transition: width 1s ease;
}
.renewal-progress-bar.ok      { background: #22c55e; }
.renewal-progress-bar.warn    { background: #eab308; }
.renewal-progress-bar.urgent  { background: #ef4444; }
.renewal-progress-bar.expired { background: rgba(255,255,255,0.5); }
.renewal-progress-labels {
  display: flex; justify-content: space-between;
  font-size: 0.62rem; color: #94a3b8;
}
.renewal-card.expired .renewal-progress-labels { color: rgba(255,255,255,0.65); }

.renewal-footer { display: flex; align-items: center; justify-content: space-between; }
.renewal-days-block { display: flex; align-items: baseline; gap: 5px; }
.renewal-days-num { font-size: 1.8rem; font-weight: 800; line-height: 1; }
.renewal-days-num.ok      { color: #15803d; }
.renewal-days-num.warn    { color: #a16207; }
.renewal-days-num.urgent  { color: #dc2626; }
.renewal-days-num.expired { color: #ffffff; }
.renewal-days-lbl { font-size: 0.72rem; color: #64748b; font-weight: 500; }
.renewal-card.expired .renewal-days-lbl { color: rgba(255,255,255,0.8); }

/* ══ ATTENDANCE DONUT ══ */
.attendance-body {
  padding: 18px;
  display: flex; align-items: center; gap: 20px;
}
.donut-wrap { flex-shrink: 0; width: 110px; height: 110px; }
.donut-svg { width: 100%; height: 100%; }
.donut-center-val {
  font-family: "DM Sans", sans-serif;
  font-size: 18px; font-weight: 800; fill: #0f172a;
}
.donut-center-lbl {
  font-family: "DM Sans", sans-serif;
  font-size: 9px; fill: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
}
.att-legend { flex: 1; display: flex; flex-direction: column; gap: 0; }
.att-leg-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
.att-leg-divider { height: 1px; background: #f1f5f9; }
.att-leg-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.att-leg-val { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; line-height: 1; }
.att-leg-lbl { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }

/* ══ ID CARD ══ */
.id-card {
  border-radius: 16px; overflow: hidden;
  background: white; border: 1px solid #e2e8f0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  position: relative;
}
.id-card-bg {
  position: absolute; top: 0; left: 0; right: 0; height: 56px;
  background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #0891b2 100%);
}
.id-card-bg::after {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 90% 50%, rgba(125,211,252,0.2) 0%, transparent 60%);
}
.id-card-body { position: relative; z-index: 1; padding: 26px 18px 16px; }

.id-card-top { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 14px; }
.id-avatar {
  width: 52px; height: 52px; border-radius: 13px;
  border: 3px solid white; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 3px 12px rgba(0,0,0,0.15); flex-shrink: 0;
}
.id-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.id-avatar-initials { font-size: 1rem; font-weight: 700; color: white; }
.id-card-name { font-family: "DM Serif Display", serif; font-size: 1rem; color: #0f172a; margin: 0 0 3px; }
.id-card-role { font-size: 0.72rem; color: #64748b; margin: 0; }

.id-card-divider { height: 1px; background: #f1f5f9; margin-bottom: 12px; }

.id-card-fields { display: flex; flex-direction: column; gap: 8px; }
.id-field { display: flex; justify-content: space-between; align-items: center; }
.id-field-lbl { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
.id-field-val { font-size: 0.78rem; font-weight: 600; color: #334155; }
.id-field-val.mono { font-family: monospace; font-size: 0.75rem; color: #0369a1; }

/* ══ MODAL ══ */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.42); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px 14px; border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; background: white; z-index: 2;
}
.modal-title { font-family: "DM Serif Display", serif; font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0; transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }
.modal-body { padding: 18px 24px; }
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 12px 24px 18px; border-top: 1px solid #f1f5f9;
  position: sticky; bottom: 0; background: white;
}

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field.full { grid-column: 1 / -1; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #334155; }
.req { color: #ef4444; }
.f-input {
  width: 100%; padding: 9px 13px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.f-input:focus { border-color: #0369a1; background: white; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.select-wrap { position: relative; }
.f-select {
  width: 100%; padding: 9px 32px 9px 13px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; appearance: none; cursor: pointer;
}
.f-select:focus { border-color: #0369a1; }
.select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

.btn-cancel {
  padding: 8px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif; font-size: 0.875rem;
  font-weight: 600; color: #475569; cursor: pointer; transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: #94a3b8; }
.btn-save {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 20px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1); color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 12px rgba(3,105,161,0.25); transition: opacity 0.15s;
}
.btn-save:hover { opacity: 0.9; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
</style>