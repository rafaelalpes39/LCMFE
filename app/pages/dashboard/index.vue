<script setup>
definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});
import { ref, computed } from "vue";

const attendance = ref({
  mass: { present: 28, absent: 3, late: 2 },
  meetings: { present: 10, absent: 1, late: 1 },
  church: { present: 18, absent: 2, late: 3 },
});

const attTotals = computed(() => {
  const t = {};
  for (const key in attendance.value) {
    const g = attendance.value[key];
    t[key] = g.present + g.absent + g.late;
  }
  return t;
});

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

const rateStyle = (r) => {
  if (r >= 90) return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  if (r >= 75) return { bg: "#eff8fe", color: "#0369a1", border: "#bae0f8" };
  if (r >= 60) return { bg: "#fefce8", color: "#d97706", border: "#fde68a" };
  return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
};

const catMeta = {
  mass: { label: "Mass Schedule", color: "#0369a1", iconBg: "#eff8fe" },
  meetings: { label: "Meetings", color: "#7e22ce", iconBg: "#fdf4ff" },
  church: {
    label: "Church Participation",
    color: "#15803d",
    iconBg: "#f0fdf4",
  },
};

const assignments = ref([
  {
    id: 1,
    day: "Sunday",
    time: "8:00 AM",
    session: "Sunday Mass",
    role: "Lector",
    venue: "Main Altar",
  },
  {
    id: 2,
    day: "Wednesday",
    time: "6:00 PM",
    session: "Weekday Mass",
    role: "Commentator",
    venue: "Side Chapel",
  },
]);

const announcements = ref([
  {
    id: 1,
    emoji: "📌",
    text: "Practice schedule every Saturday at 4:00 PM",
    tag: "Schedule",
    date: "Mar 1",
  },
  {
    id: 2,
    emoji: "📖",
    text: "Please review readings 1 day before your assignment",
    tag: "Reminder",
    date: "Feb 28",
  },
  {
    id: 3,
    emoji: "🔔",
    text: "Holy Week schedule will be released by March 15",
    tag: "Notice",
    date: "Feb 27",
  },
]);
</script>

<template>
  <div class="page">
    <!-- ══ ATTENDANCE BREAKDOWN ══ -->
    <div class="card att-card">
      <div class="card-head">
        <div class="ch-left">
          <div class="ch-icon blue-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <h2 class="card-title">Attendance Breakdown</h2>
        </div>
        <span class="badge blue-badge">3 categories</span>
      </div>

      <div class="att-cols">
        <div
          v-for="(key, idx) in ['mass', 'meetings', 'church']"
          :key="key"
          class="att-col"
          :class="{ 'col-border': idx < 2 }"
        >
          <div class="att-col-head">
            <div class="att-col-icon" :style="{ background: catMeta[key].iconBg }">
              <svg v-if="key === 'mass'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="catMeta[key].color" stroke-width="2.5">
                <path d="M12 2v20M2 12h20" />
              </svg>
              <svg v-if="key === 'meetings'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="catMeta[key].color" stroke-width="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <svg v-if="key === 'church'" width="13" height="13" viewBox="0 0 24 24" fill="none" :stroke="catMeta[key].color" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div class="att-col-name-wrap">
              <p class="att-col-name" :style="{ color: catMeta[key].color }">{{ catMeta[key].label }}</p>
              <p class="att-col-total">{{ attTotals[key] }} sessions</p>
            </div>
            <span
              class="att-rate-chip"
              :style="{
                background: rateStyle(pct(attendance[key].present, attTotals[key])).bg,
                color: rateStyle(pct(attendance[key].present, attTotals[key])).color,
                borderColor: rateStyle(pct(attendance[key].present, attTotals[key])).border,
              }"
            >
              {{ pct(attendance[key].present, attTotals[key]) }}%
            </span>
          </div>

          <div class="att-stats">
            <div class="att-stat-row">
              <span class="asr-dot" style="background: #22c55e" />
              <span class="asr-label">Present</span>
              <span class="asr-val" style="color: #15803d">{{ attendance[key].present }}</span>
            </div>
            <div class="att-stat-row">
              <span class="asr-dot" style="background: #ef4444" />
              <span class="asr-label">Absent</span>
              <span class="asr-val" style="color: #dc2626">{{ attendance[key].absent }}</span>
            </div>
            <div class="att-stat-row">
              <span class="asr-dot" style="background: #f59e0b" />
              <span class="asr-label">Late</span>
              <span class="asr-val" style="color: #d97706">{{ attendance[key].late }}</span>
            </div>
          </div>

          <div class="stacked-bar">
            <div class="sb-seg seg-present" :style="{ width: pct(attendance[key].present, attTotals[key]) + '%' }" />
            <div class="sb-seg seg-late"    :style="{ width: pct(attendance[key].late,    attTotals[key]) + '%' }" />
            <div class="sb-seg seg-absent"  :style="{ width: pct(attendance[key].absent,  attTotals[key]) + '%' }" />
          </div>
        </div>
      </div>
    </div>

    <!-- ══ ASSIGNMENTS + ANNOUNCEMENTS ══ -->
    <div class="mid-row">
      <!-- This Week's Assignments -->
      <div class="card">
        <div class="card-head">
          <div class="ch-left">
            <div class="ch-icon purple-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" stroke-width="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2 class="card-title">This Week's Assignments</h2>
          </div>
          <span class="badge purple-badge">{{ assignments.length }} sessions</span>
        </div>

        <div class="assign-list">
          <div v-for="a in assignments" :key="a.id" class="assign-item">
            <div class="a-date">
              <p class="a-day">{{ a.day }}</p>
              <p class="a-time">{{ a.time }}</p>
            </div>
            <div class="a-body">
              <p class="a-session">{{ a.session }}</p>
              <div class="a-meta">
                <span class="a-chip">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {{ a.role }}
                </span>
                <span class="a-chip">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ a.venue }}
                </span>
              </div>
            </div>
            <span class="upcoming-pill">Upcoming</span>
          </div>
          <div v-if="!assignments.length" class="empty">
            <p>No assignments this week</p>
          </div>
        </div>
      </div>

      <!-- Ministry Announcements -->
      <div class="card">
        <div class="card-head">
          <div class="ch-left">
            <div class="ch-icon teal-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.5">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </div>
            <h2 class="card-title">Ministry Announcements</h2>
          </div>
          <span class="badge teal-badge">{{ announcements.length }} new</span>
        </div>

        <div class="ann-list">
          <div v-for="ann in announcements" :key="ann.id" class="ann-item">
            <span class="ann-emoji">{{ ann.emoji }}</span>
            <div class="ann-body">
              <p class="ann-text">{{ ann.text }}</p>
              <span class="ann-date">{{ ann.date }}</span>
            </div>
            <span class="ann-tag" :class="ann.tag.toLowerCase()">{{ ann.tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap");
</style>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Page ── */
/* NO padding here — the layout's page-container already handles it */
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
.ch-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ch-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.blue-icon   { background: #eff8fe; }
.purple-icon { background: #f4f0ff; }
.teal-icon   { background: #ecfeff; }

.card-title {
  font-family: "DM Serif Display", serif;
  font-size: 0.975rem;
  font-weight: 400;
  color: #0f172a;
}
.badge {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 9px;
  border-radius: 20px;
}
.blue-badge   { background: #eff8fe; color: #0369a1; }
.purple-badge { background: #f4f0ff; color: #7e22ce; }
.teal-badge   { background: #ecfeff; color: #0891b2; }

/* ── Assignments ── */
.assign-list { display: flex; flex-direction: column; }
.assign-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 22px;
  border-bottom: 1px solid #eef4f9;
  transition: background 0.1s;
}
.assign-item:last-child { border-bottom: none; }
.assign-item:hover { background: #f8fbfd; }

.a-date {
  background: #f4f0ff;
  border-radius: 10px;
  padding: 9px 13px;
  text-align: center;
  flex-shrink: 0;
  min-width: 82px;
}
.a-day  { font-size: 0.74rem; font-weight: 700; color: #7e22ce; }
.a-time { font-size: 0.65rem; color: #9b72cf; margin-top: 2px; }
.a-body { flex: 1; min-width: 0; }
.a-session { font-size: 0.875rem; font-weight: 600; color: #0f172a; margin-bottom: 5px; }
.a-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.a-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 500;
  color: #5a7a90;
  background: #f0f6fb;
  padding: 2px 8px;
  border-radius: 20px;
}
.upcoming-pill {
  font-size: 0.65rem;
  font-weight: 700;
  background: #f4f0ff;
  color: #7e22ce;
  padding: 4px 11px;
  border-radius: 20px;
  white-space: nowrap;
}
.empty {
  padding: 32px;
  text-align: center;
  font-size: 0.85rem;
  color: #94a3b8;
}

/* ── Announcements ── */
.ann-list { display: flex; flex-direction: column; }
.ann-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 22px;
  border-bottom: 1px solid #eef4f9;
  transition: background 0.1s;
}
.ann-item:last-child { border-bottom: none; }
.ann-item:hover { background: #f8fbfd; }
.ann-emoji { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; line-height: 1; }
.ann-body { flex: 1; min-width: 0; }
.ann-text { font-size: 0.82rem; font-weight: 500; color: #334155; line-height: 1.55; }
.ann-date { font-size: 0.68rem; color: #94aab8; margin-top: 3px; display: block; }
.ann-tag {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
  align-self: flex-start;
  flex-shrink: 0;
  margin-top: 1px;
}
.ann-tag.schedule { background: #ecfeff; color: #0891b2; }
.ann-tag.reminder { background: #f4f0ff; color: #7e22ce; }
.ann-tag.notice   { background: #fefce8; color: #d97706; }

/* ── Attendance breakdown ── */
.att-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
@media (max-width: 900px) {
  .att-cols { grid-template-columns: 1fr; }
}

.att-col { padding: 24px; }
.col-border { border-right: 1px solid #eef4f9; }
@media (max-width: 900px) {
  .col-border { border-right: none; border-bottom: 1px solid #eef4f9; }
}

.att-col-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
}
.att-col-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.att-col-name-wrap { flex: 1; }
.att-col-name  { font-size: 0.82rem; font-weight: 700; }
.att-col-total { font-size: 0.68rem; color: #94aab8; margin-top: 2px; }
.att-rate-chip {
  font-size: 0.78rem;
  font-weight: 800;
  padding: 4px 11px;
  border-radius: 20px;
  border: 1.5px solid;
  white-space: nowrap;
  align-self: flex-start;
}

.att-stats { display: flex; flex-direction: column; gap: 9px; margin-bottom: 18px; }
.att-stat-row { display: flex; align-items: center; gap: 9px; }
.asr-dot   { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.asr-label { font-size: 0.78rem; color: #5a7a90; flex: 1; }
.asr-val   { font-size: 0.95rem; font-weight: 800; }

.stacked-bar {
  height: 10px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  background: #eef4f9;
}
.sb-seg { height: 100%; transition: width 0.6s ease; min-width: 0; }
.seg-present { background: linear-gradient(90deg, #16a34a, #4ade80); }
.seg-late    { background: linear-gradient(90deg, #d97706, #fbbf24); }
.seg-absent  { background: linear-gradient(90deg, #dc2626, #f87171); }
</style>