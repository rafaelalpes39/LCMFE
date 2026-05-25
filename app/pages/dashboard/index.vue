<script setup>
definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

const config = useRuntimeConfig();
const auth = useAuthStore();
const { user } = storeToRefs(auth);
const currentUserId   = computed(() => user.value?.id ?? user.value?.user?.id ?? null);
const currentUserTeam = computed(() => user.value?.team ?? user.value?.user?.team ?? null);

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const todayStr = computed(() => {
  const d  = new Date();
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dy}`;
});

const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour   = parseInt(h, 10);
  const ampm   = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const dayName = (d) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long" });

const monthOf = (d) => new Date(d).toLocaleDateString("en-US", { month: "short" });
const dayOf   = (d) => new Date(d).getDate();

/* ─────────────────────────────────────────────────────────
   ANNOUNCEMENTS
───────────────────────────────────────────────────────── */
const announcements    = ref([]);
const loadingAnn       = ref(true);
const selectedAnn      = ref(null);
const showAnnModal     = ref(false);
const loadingAnnDetail = ref(false);

const fetchAnnouncements = async () => {
  loadingAnn.value = true;
  try {
    const data = await $fetch(`${config.public.apiBase}/api/announcements`);
    const list  = Array.isArray(data) ? data : (data.data ?? []);
    const team  = currentUserTeam.value ?? "";

    announcements.value = list.filter((a) => {
      const notAccomplished = a.accomplished === false;
      const recipient       = (a.recipient ?? "").toLowerCase();
      const userTeam        = team.toLowerCase();
      const recipientMatch  =
        recipient === "all members" ||
        recipient === userTeam ||
        (userTeam && recipient.includes(userTeam));
      return notAccomplished && recipientMatch;
    });
  } catch (e) {
    console.error("Announcements fetch failed:", e);
  } finally {
    loadingAnn.value = false;
  }
};

const openAnnModal = async (ann) => {
  selectedAnn.value      = ann;
  showAnnModal.value     = true;
  loadingAnnDetail.value = true;
  try {
    const data = await $fetch(`${config.public.apiBase}/api/announcements/${ann.id}`);
    selectedAnn.value = data?.data ?? data ?? ann;
  } catch (e) {
    console.error("Announcement detail fetch failed:", e);
  } finally {
    loadingAnnDetail.value = false;
  }
};

const closeAnnModal = () => {
  showAnnModal.value = false;
  selectedAnn.value  = null;
};

/* ─────────────────────────────────────────────────────────
   SCHEDULES
───────────────────────────────────────────────────────── */
const allSchedules     = ref([]);
const loadingSchedules = ref(true);

const fetchSchedules = async () => {
  loadingSchedules.value = true;
  try {
    const data         = await $fetch(`${config.public.apiBase}/api/schedules`);
    allSchedules.value = Array.isArray(data) ? data : (data.data ?? []);
  } catch (e) {
    console.error("Schedules fetch failed:", e);
  } finally {
    loadingSchedules.value = false;
  }
};

const upcomingSchedules = computed(() => {
  if (!currentUserId.value) return [];
  return allSchedules.value
    .filter((s) => {
      const assigned = (s.members ?? []).some(
        (m) => String(m.memberId) === String(currentUserId.value)
      );
      return assigned && s.date >= todayStr.value;
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, 5);
});

/* ─────────────────────────────────────────────────────────
   ATTENDANCE ANALYTICS
   Mass    → present / absent / subbed
   Meeting → present / absent  (no subbed)
───────────────────────────────────────────────────────── */
const attendanceStats = computed(() => {
  const stats = {
    mass:    { present: 0, absent: 0, subbed: 0 },
    meeting: { present: 0, absent: 0, subbed: 0 }, // subbed kept at 0 always
  };

  for (const s of allSchedules.value) {
    const type = (s.type ?? "").toLowerCase();
    const key  = type === "meeting" ? "meeting" : "mass";
    for (const m of s.members ?? []) {
      const status = (m.status ?? "").toLowerCase();
      if (status === "present")             stats[key].present++;
      else if (status === "absent")         stats[key].absent++;
      else if (status.startsWith("subbed") && key === "mass") stats.mass.subbed++;
    }
  }
  return stats;
});

const totalFor = (key) => {
  const s = attendanceStats.value[key];
  return key === "meeting"
    ? s.present + s.absent
    : s.present + s.absent + s.subbed;
};

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

const rateStyle = (r) => {
  if (r >= 90) return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  if (r >= 75) return { bg: "#eff8fe", color: "#0369a1", border: "#bae0f8" };
  if (r >= 60) return { bg: "#fefce8", color: "#d97706", border: "#fde68a" };
  return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
};

const catMeta = {
  mass:    { label: "Mass Schedule", color: "#0369a1", iconBg: "#eff8fe" },
  meeting: { label: "Meetings",      color: "#7e22ce", iconBg: "#fdf4ff" },
};

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
onMounted(() => {
  fetchAnnouncements();
  fetchSchedules();
});
</script>

<template>
  <div class="page">

    <!-- ══ ATTENDANCE ANALYTICS ══ -->
    <div class="card att-card">
      <div class="card-head">
        <div class="ch-left">
          <div class="ch-icon blue-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6"  y1="20" x2="6"  y2="14" />
            </svg>
          </div>
          <h2 class="card-title">Attendance Analytics</h2>
        </div>
        <span class="badge blue-badge">2 categories</span>
      </div>

      <div class="att-cols">
        <div
          v-for="(key, idx) in ['mass', 'meeting']"
          :key="key"
          class="att-col"
          :class="{ 'col-border': idx === 0 }"
        >
          <!-- Column header -->
          <div class="att-col-head">
            <div class="att-col-icon" :style="{ background: catMeta[key].iconBg }">
              <svg v-if="key === 'mass'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="catMeta[key].color" stroke-width="2.5">
                <path d="M12 2v20M2 12h20" />
              </svg>
              <svg v-if="key === 'meeting'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="catMeta[key].color" stroke-width="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div class="att-col-name-wrap">
              <p class="att-col-name" :style="{ color: catMeta[key].color }">{{ catMeta[key].label }}</p>
              <p class="att-col-total">{{ totalFor(key) }} records</p>
            </div>
            <span
              class="att-rate-chip"
              :style="{
                background:  rateStyle(pct(attendanceStats[key].present, totalFor(key))).bg,
                color:       rateStyle(pct(attendanceStats[key].present, totalFor(key))).color,
                borderColor: rateStyle(pct(attendanceStats[key].present, totalFor(key))).border,
              }"
            >{{ pct(attendanceStats[key].present, totalFor(key)) }}%</span>
          </div>

          <!-- Stat rows — always 3 rows; Subbed is invisible for meetings -->
          <div class="att-stats">
            <div class="att-stat-row">
              <span class="asr-dot" style="background:#22c55e" />
              <span class="asr-label">Present</span>
              <span class="asr-val" style="color:#15803d">{{ attendanceStats[key].present }}</span>
            </div>
            <div class="att-stat-row">
              <span class="asr-dot" style="background:#ef4444" />
              <span class="asr-label">Absent</span>
              <span class="asr-val" style="color:#dc2626">{{ attendanceStats[key].absent }}</span>
            </div>
            <!-- Always rendered; invisible (not hidden) for meetings so height is preserved -->
            <div class="att-stat-row" :style="key === 'meeting' ? { visibility: 'hidden' } : {}">
              <span class="asr-dot" style="background:#a855f7" />
              <span class="asr-label">Subbed</span>
              <span class="asr-val" style="color:#7c3aed">{{ attendanceStats[key].subbed }}</span>
            </div>
          </div>

          <!-- Stacked bar -->
          <div class="stacked-bar">
            <div class="sb-seg seg-present" :style="{ width: pct(attendanceStats[key].present, totalFor(key)) + '%' }" />
            <div
              v-if="key === 'mass'"
              class="sb-seg seg-subbed"
              :style="{ width: pct(attendanceStats[key].subbed, totalFor(key)) + '%' }"
            />
            <div class="sb-seg seg-absent" :style="{ width: pct(attendanceStats[key].absent, totalFor(key)) + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <!-- ══ UPCOMING SCHEDULE + ANNOUNCEMENTS ══ -->
    <div class="mid-row">

      <!-- Upcoming Schedule -->
      <div class="card">
        <div class="card-head">
          <div class="ch-left">
            <div class="ch-icon purple-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" stroke-width="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8"  y1="2" x2="8"  y2="6" />
                <line x1="3"  y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2 class="card-title">Upcoming Schedule</h2>
          </div>
          <span class="badge purple-badge">{{ upcomingSchedules.length }} sessions</span>
        </div>

        <div v-if="loadingSchedules" class="card-empty">
          <div class="mini-spinner" />
          <p>Loading schedules…</p>
        </div>
        <div v-else-if="upcomingSchedules.length === 0" class="card-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <p>No upcoming sessions</p>
        </div>
        <div v-else class="assign-list">
          <div v-for="s in upcomingSchedules" :key="s.id" class="assign-item">
            <div class="a-date" :class="s.date === todayStr ? 'a-date-today' : ''">
              <p class="a-day">{{ s.date === todayStr ? 'Today' : dayName(s.date) }}</p>
              <p class="a-time">{{ fmtTime(s.time) }}</p>
              <p class="a-datestr">{{ monthOf(s.date) }} {{ dayOf(s.date) }}</p>
            </div>
            <div class="a-body">
              <p class="a-session">{{ s.title }}</p>
              <div class="a-meta">
                <span class="a-chip">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {{ s.type }}
                </span>
                <span class="a-chip" v-if="s.venue">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ s.venue }}
                </span>
              </div>
            </div>
            <span class="upcoming-pill" :class="s.date === todayStr ? 'pill-today' : ''">
              {{ s.date === todayStr ? 'Today' : 'Upcoming' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ministry Announcements -->
      <div class="card">
        <div class="card-head">
          <div class="ch-left">
            <div class="ch-icon teal-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.5">
                <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            </div>
            <h2 class="card-title">Ministry Announcements</h2>
          </div>
          <span class="badge teal-badge ongoing-badge">
            <span class="ongoing-dot" />
            Ongoing
          </span>
        </div>

        <div v-if="loadingAnn" class="card-empty">
          <div class="mini-spinner" />
          <p>Loading announcements…</p>
        </div>
        <div v-else-if="announcements.length === 0" class="card-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
          <p>No ongoing announcements</p>
        </div>
        <div v-else class="ann-list">
          <div v-for="ann in announcements" :key="ann.id" class="ann-item">
            <div class="ann-icon-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="ann-body">
              <p class="ann-text">{{ ann.title ?? ann.text ?? ann.message ?? 'Announcement' }}</p>
              <span class="ann-date">{{ ann.created_at ? fmtDate(ann.created_at) : (ann.date ?? '') }}</span>
            </div>
            <button class="ann-view-btn" @click="openAnnModal(ann)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ ANNOUNCEMENT DETAIL MODAL ══ -->
    <transition name="modal">
      <div v-if="showAnnModal" class="modal-backdrop" @click.self="closeAnnModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.5">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                </svg>
              </div>
              <div>
                <h2 class="modal-title">Announcement</h2>
                <span class="modal-status-chip">
                  <span class="ongoing-dot" />
                  Ongoing
                </span>
              </div>
            </div>
            <button class="modal-close" @click="closeAnnModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div v-if="loadingAnnDetail" class="modal-loading">
            <div class="mini-spinner" />
            <p>Loading…</p>
          </div>

          <div v-else-if="selectedAnn" class="modal-body">
            <h3 class="ann-modal-title">
              {{ selectedAnn.title ?? selectedAnn.text ?? selectedAnn.message ?? 'Announcement' }}
            </h3>
            <div class="ann-modal-meta" v-if="selectedAnn.created_at || selectedAnn.date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <span>{{ fmtDate(selectedAnn.created_at ?? selectedAnn.date) }}</span>
            </div>
            <div class="ann-modal-content">
              {{ selectedAnn.content ?? selectedAnn.body ?? selectedAnn.description ?? selectedAnn.text ?? selectedAnn.message ?? '—' }}
            </div>
            <div class="ann-modal-extras" v-if="selectedAnn.user || selectedAnn.recipient || selectedAnn.category">
              <div v-if="selectedAnn.user" class="ann-extra-row">
                <span class="ann-extra-label">Posted by</span>
                <span class="ann-extra-val">{{ selectedAnn.user.name }}</span>
              </div>
              <div v-if="selectedAnn.recipient" class="ann-extra-row">
                <span class="ann-extra-label">Recipient</span>
                <span class="ann-extra-val">{{ selectedAnn.recipient }}</span>
              </div>
              <div v-if="selectedAnn.category" class="ann-extra-row">
                <span class="ann-extra-label">Category</span>
                <span class="ann-extra-val">{{ selectedAnn.category }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-close-modal" @click="closeAnnModal">Close</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap");
</style>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Mid row ── */
.mid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 800px) {
  .mid-row { grid-template-columns: 1fr; }
}

/* ── Card base ── */
.card {
  background: white;
  border-radius: 18px;
  border: 1.5px solid #e4eff8;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  overflow: hidden;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid #eef4f9;
}
.ch-left { display: flex; align-items: center; gap: 10px; }
.ch-icon {
  width: 30px; height: 30px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.blue-icon   { background: #eff8fe; }
.purple-icon { background: #f4f0ff; }
.teal-icon   { background: #ecfeff; }

.card-title {
  font-family: "DM Serif Display", serif;
  font-size: 0.975rem; font-weight: 400; color: #0f172a;
}
.badge {
  font-size: 0.62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 3px 9px; border-radius: 20px;
}
.blue-badge   { background: #eff8fe; color: #0369a1; }
.purple-badge { background: #f4f0ff; color: #7e22ce; }
.teal-badge   { background: #ecfeff; color: #0891b2; }

.ongoing-badge {
  display: flex; align-items: center; gap: 5px;
  text-transform: none; font-size: 0.68rem;
}
.ongoing-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22c55e;
  animation: pulse-dot 1.8s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.75); }
}

.card-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px;
  padding: 36px 20px; color: #94a3b8; font-size: 0.82rem;
}
.mini-spinner {
  width: 22px; height: 22px;
  border: 2.5px solid #e2e8f0; border-top-color: #0369a1;
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Upcoming Schedule list ── */
.assign-list { display: flex; flex-direction: column; }
.assign-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 22px; border-bottom: 1px solid #eef4f9;
  transition: background 0.1s;
}
.assign-item:last-child { border-bottom: none; }
.assign-item:hover { background: #f8fbfd; }

.a-date {
  background: #f4f0ff; border-radius: 10px;
  padding: 8px 12px; text-align: center;
  flex-shrink: 0; min-width: 76px;
}
.a-date-today { background: linear-gradient(135deg, #0c4a6e, #0369a1); }
.a-date-today .a-day,
.a-date-today .a-time,
.a-date-today .a-datestr { color: white !important; opacity: 1; }

.a-day     { font-size: 0.74rem; font-weight: 700; color: #7e22ce; }
.a-time    { font-size: 0.65rem; color: #9b72cf; margin-top: 2px; }
.a-datestr { font-size: 0.6rem;  color: #b4a0cf; margin-top: 1px; }

.a-body    { flex: 1; min-width: 0; }
.a-session { font-size: 0.875rem; font-weight: 600; color: #0f172a; margin-bottom: 5px; }
.a-meta    { display: flex; gap: 6px; flex-wrap: wrap; }
.a-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.68rem; font-weight: 500; color: #5a7a90;
  background: #f0f6fb; padding: 2px 8px; border-radius: 20px;
}

.upcoming-pill {
  font-size: 0.65rem; font-weight: 700;
  background: #f4f0ff; color: #7e22ce;
  padding: 4px 11px; border-radius: 20px; white-space: nowrap;
}
.pill-today { background: #dbeafe; color: #0369a1; }

/* ── Announcements list ── */
.ann-list { display: flex; flex-direction: column; }
.ann-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 22px; border-bottom: 1px solid #eef4f9;
  transition: background 0.1s;
}
.ann-item:last-child { border-bottom: none; }
.ann-item:hover { background: #f8fbfd; }

.ann-icon-wrap {
  width: 28px; height: 28px; border-radius: 8px;
  background: #ecfeff; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; margin-top: 1px;
}
.ann-body  { flex: 1; min-width: 0; }
.ann-text  { font-size: 0.82rem; font-weight: 500; color: #334155; line-height: 1.5; }
.ann-date  { font-size: 0.68rem; color: #94aab8; margin-top: 3px; display: block; }

.ann-view-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 8px;
  border: 1.5px solid #bae6fd; background: #ecfeff;
  color: #0891b2; font-family: "DM Sans", sans-serif;
  font-size: 0.7rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; flex-shrink: 0; align-self: center;
  transition: all 0.15s;
}
.ann-view-btn:hover { background: #cffafe; border-color: #67e8f9; }

/* ── Attendance breakdown ── */
.att-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 700px) {
  .att-cols { grid-template-columns: 1fr; }
}

.att-col { padding: 24px; }
.col-border { border-right: 1px solid #eef4f9; }
@media (max-width: 700px) {
  .col-border { border-right: none; border-bottom: 1px solid #eef4f9; }
}

.att-col-head {
  display: flex; align-items: flex-start; gap: 10px; margin-bottom: 20px;
}
.att-col-icon {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.att-col-name-wrap { flex: 1; }
.att-col-name  { font-size: 0.82rem; font-weight: 700; }
.att-col-total { font-size: 0.68rem; color: #94aab8; margin-top: 2px; }
.att-rate-chip {
  font-size: 0.78rem; font-weight: 800;
  padding: 4px 11px; border-radius: 20px;
  border: 1.5px solid; white-space: nowrap; align-self: flex-start;
}

/* KEY FIX: fixed height so both columns are always equal */
.att-stats {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 18px;
  min-height: 99px; /* exactly 3 rows × (line-height + gap) */
}

.att-stat-row { display: flex; align-items: center; gap: 9px; }
.asr-dot      { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.asr-label    { font-size: 0.78rem; color: #5a7a90; flex: 1; }
.asr-val      { font-size: 0.95rem; font-weight: 800; }

.stacked-bar {
  height: 10px; border-radius: 20px; overflow: hidden;
  display: flex; background: #eef4f9;
}
.sb-seg   { height: 100%; transition: width 0.6s ease; min-width: 0; }
.seg-present { background: linear-gradient(90deg, #16a34a, #4ade80); }
.seg-subbed  { background: linear-gradient(90deg, #7c3aed, #a855f7); }
.seg-absent  { background: linear-gradient(90deg, #dc2626, #f87171); }

/* ════════════════════════════
   ANNOUNCEMENT MODAL
════════════════════════════ */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 18px;
  width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; background: white; z-index: 2;
}
.modal-header-left { display: flex; align-items: center; gap: 12px; }
.modal-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: #ecfeff; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0 0 4px;
}
.modal-status-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.65rem; font-weight: 700;
  background: #f0fdf4; color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 2px 8px; border-radius: 20px;
}
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s; flex-shrink: 0;
}
.modal-close:hover { background: #f1f5f9; color: #475569; }

.modal-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 40px; color: #94a3b8; font-size: 0.82rem;
}
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }

.ann-modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.2rem; font-weight: 400; color: #0f172a; line-height: 1.4;
}
.ann-modal-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem; color: #94a3b8;
}
.ann-modal-content {
  font-size: 0.9rem; color: #334155; line-height: 1.75;
  background: #f8fafc; border-radius: 12px;
  padding: 16px 18px; border: 1px solid #f1f5f9;
  white-space: pre-wrap;
}
.ann-modal-extras {
  display: flex; flex-direction: column; gap: 8px;
  border-top: 1px solid #f1f5f9; padding-top: 14px;
}
.ann-extra-row  { display: flex; gap: 10px; align-items: center; }
.ann-extra-label {
  font-size: 0.72rem; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em; min-width: 80px;
}
.ann-extra-val  { font-size: 0.82rem; color: #334155; font-weight: 500; }

.modal-footer {
  display: flex; justify-content: flex-end;
  padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
  position: sticky; bottom: 0; background: white;
}
.btn-close-modal {
  padding: 9px 24px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569;
  cursor: pointer; transition: border-color 0.15s;
}
.btn-close-modal:hover { border-color: #94a3b8; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from,  .modal-leave-to      { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform 0.2s ease, opacity 0.18s ease;
}
.modal-enter-from .modal, .modal-leave-to .modal {
  transform: scale(0.96) translateY(8px); opacity: 0;
}
</style>