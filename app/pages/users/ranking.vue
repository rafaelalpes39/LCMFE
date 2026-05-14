<template>
  <div class="rankings-page">

    <!-- RANKINGS TABLE -->
    <div class="table-card">
      <div class="table-toolbar">
        <h2 class="table-title">Member Rankings</h2>
        <div class="search-wrap">
          <v-icon size="14" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
          <input v-model="searchQuery" class="search-input" placeholder="Search member…" />
        </div>
        <div class="sort-tabs">
          <button v-for="s in sortOptions" :key="s.value" class="sort-btn" :class="{ active: sortBy === s.value }" @click="sortBy = s.value">{{ s.label }}</button>
        </div>
      </div>

      <div class="rank-list">
        <div
          v-for="member in filteredRanked"
          :key="member.id"
          class="rank-row"
          :class="{ 'is-1': member.rank === 1, 'is-2': member.rank === 2, 'is-3': member.rank === 3 }"
        >
          <!-- Rank -->
          <div class="rank-num" :class="{ gold: member.rank === 1, silver: member.rank === 2, bronze: member.rank === 3 }">
            <span v-if="member.rank === 1">🥇</span>
            <span v-else-if="member.rank === 2">🥈</span>
            <span v-else-if="member.rank === 3">🥉</span>
            <span v-else>#{{ member.rank }}</span>
          </div>

          <!-- Avatar + Name -->
          <div class="member-cell">
            <div class="avatar" :style="{ background: avatarColor(member.name) }">{{ initials(member.name) }}</div>
            <div class="member-info">
              <span class="member-name">{{ member.name }}</span>
              <span class="role-badge" :class="member.role.toLowerCase()">{{ member.role }}</span>
            </div>
          </div>

          <!-- Scores -->
          <div class="scores">
            <div class="score-item">
              <span class="score-label">Readings</span>
              <span class="score-val">{{ member.scores.readings }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">Meetings</span>
              <span class="score-val">{{ member.scores.meetings }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">Mass</span>
              <span class="score-val">{{ member.scores.mass }}</span>
            </div>
          </div>

          <!-- Total -->
          <div class="total-cell">
            <span class="total-num" :class="{ gold: member.rank === 1, silver: member.rank === 2, bronze: member.rank === 3 }">{{ member.totalScore }}</span>
            <span class="total-label">pts</span>
          </div>

          <!-- Attendance rate -->
          <span class="rate-pill" :class="rateClass(member.attendanceRate)">{{ member.attendanceRate }}%</span>

          <!-- Trend -->
          <span class="trend-chip" :class="member.trend">
            <v-icon size="13">{{ member.trend === 'up' ? 'mdi-trending-up' : member.trend === 'down' ? 'mdi-trending-down' : 'mdi-minus' }}</v-icon>
            {{ member.trendDiff > 0 ? '+' : '' }}{{ member.trendDiff !== 0 ? member.trendDiff : '—' }}
          </span>
        </div>

        <div v-if="filteredRanked.length === 0" class="empty">
          <v-icon size="36" color="#cbd5e1">mdi-account-search-outline</v-icon>
          <p>No members found</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from "vue";

definePageMeta({ layout: "authenticated", middleware: "auth" });

const palette     = ["#0369a1","#0891b2","#0c4a6e","#7e22ce","#15803d","#b45309","#dc2626"];
const avatarColor = (name) => palette[(name?.charCodeAt(0) ?? 0) % palette.length];
const initials    = (name) => (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const sortOptions = [
  { label: "Total",    value: "total" },
  { label: "Readings", value: "readings" },
  { label: "Meetings", value: "meetings" },
  { label: "Mass",     value: "mass" },
];

const searchQuery = ref("");
const sortBy      = ref("total");

const allMembers = ref([
  { id: 1, name: "Maria Santos",    role: "Lector",        yearsOfService: 7,  attendanceRate: 93, trend: "up",     trendDiff: 2,  scores: { readings: 48, meetings: 12, mass: 89 } },
  { id: 2, name: "Pedro Dela Cruz", role: "Administrator", yearsOfService: 10, attendanceRate: 88, trend: "stable", trendDiff: 0,  scores: { readings: 35, meetings: 18, mass: 82 } },
  { id: 3, name: "Ana Cruz",        role: "Coordinator",   yearsOfService: 5,  attendanceRate: 91, trend: "up",     trendDiff: 1,  scores: { readings: 40, meetings: 15, mass: 78 } },
  { id: 4, name: "Jose Reyes",      role: "Commentator",   yearsOfService: 4,  attendanceRate: 85, trend: "down",   trendDiff: -1, scores: { readings: 30, meetings: 10, mass: 76 } },
  { id: 5, name: "Luisa Garcia",    role: "Lector",        yearsOfService: 3,  attendanceRate: 80, trend: "up",     trendDiff: 3,  scores: { readings: 38, meetings: 8,  mass: 72 } },
  { id: 6, name: "Carlos Bautista", role: "Commentator",   yearsOfService: 6,  attendanceRate: 78, trend: "down",   trendDiff: -2, scores: { readings: 28, meetings: 9,  mass: 68 } },
  { id: 7, name: "Rosa Mendoza",    role: "Lector",        yearsOfService: 2,  attendanceRate: 75, trend: "stable", trendDiff: 0,  scores: { readings: 25, meetings: 7,  mass: 65 } },
]);

const membersWithTotal = computed(() =>
  allMembers.value.map(m => ({ ...m, totalScore: m.scores.readings + m.scores.meetings + m.scores.mass }))
);

const rankedMembers = computed(() => {
  const sorted = [...membersWithTotal.value].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.map((m, i) => ({ ...m, rank: i + 1 }));
});

const filteredRanked = computed(() => {
  let list = [...rankedMembers.value];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(m => m.name.toLowerCase().includes(q));
  }
  if (sortBy.value !== "total") {
    list = list.sort((a, b) => b.scores[sortBy.value] - a.scores[sortBy.value]);
  }
  return list;
});

const rateClass = (rate) => rate >= 85 ? "rate-green" : rate >= 70 ? "rate-yellow" : "rate-red";
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.rankings-page { font-family: "DM Sans", sans-serif; color: #0f172a; display: flex; flex-direction: column; gap: 20px; }

/* Table card */
.table-card {
  background: white; border-radius: 16px;
  border: 1px solid #e2e8f0; overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.table-toolbar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
}
.table-title { font-family: "DM Serif Display", serif; font-size: 1rem; font-weight: 400; color: #0f172a; margin: 0; flex: 1; }

.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; pointer-events: none; }
.search-input {
  padding: 7px 12px 7px 30px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.82rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; width: 200px; transition: border-color 0.15s;
}
.search-input:focus { border-color: #0369a1; }
.search-input::placeholder { color: #cbd5e1; }

.sort-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 9px; padding: 3px; }
.sort-btn {
  padding: 5px 12px; border: none; border-radius: 7px; background: transparent;
  font-family: "DM Sans", sans-serif; font-size: 0.75rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.sort-btn.active { background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

/* Rank list */
.rank-list { display: flex; flex-direction: column; }

.rank-row {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 20px; border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s;
}
.rank-row:last-child { border-bottom: none; }
.rank-row:hover { background: #fafcff; }
.rank-row.is-1 { background: #fffbeb; }
.rank-row.is-1:hover { background: #fef9e7; }
.rank-row.is-2 { background: #f8fafc; }
.rank-row.is-3 { background: #fdf8f3; }

/* Rank number */
.rank-num {
  font-size: 1.3rem; min-width: 44px; text-align: center; flex-shrink: 0;
  font-weight: 800; color: #94a3b8;
}
.rank-num.gold   { color: #f59e0b; }
.rank-num.silver { color: #94a3b8; }
.rank-num.bronze { color: #cd7f32; }

/* Member cell */
.member-cell { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.avatar {
  width: 38px; height: 38px; min-width: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: white;
}
.member-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.member-name { font-size: 0.9rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.role-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.6rem; font-weight: 700; width: fit-content; }
.role-badge.lector        { background: #eff6ff; color: #1d4ed8; }
.role-badge.commentator   { background: #f0fdf4; color: #15803d; }
.role-badge.coordinator   { background: #fefce8; color: #a16207; }
.role-badge.administrator { background: #fdf4ff; color: #7e22ce; }

/* Scores */
.scores { display: flex; gap: 20px; flex-shrink: 0; }
.score-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.score-label { font-size: 0.6rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.score-val   { font-size: 0.9rem; font-weight: 700; color: #334155; }

/* Total */
.total-cell { display: flex; align-items: baseline; gap: 3px; flex-shrink: 0; min-width: 60px; justify-content: flex-end; }
.total-num  { font-size: 1.3rem; font-weight: 800; color: #0f172a; }
.total-num.gold   { color: #f59e0b; }
.total-num.silver { color: #64748b; }
.total-num.bronze { color: #cd7f32; }
.total-label { font-size: 0.68rem; color: #94a3b8; font-weight: 600; }

/* Pills */
.rate-pill { display: inline-block; padding: 4px 11px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
.rate-green  { background: #f0fdf4; color: #15803d; }
.rate-yellow { background: #fefce8; color: #a16207; }
.rate-red    { background: #fef2f2; color: #dc2626; }

.trend-chip { display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
.trend-chip.up     { background: #f0fdf4; color: #15803d; }
.trend-chip.down   { background: #fef2f2; color: #dc2626; }
.trend-chip.stable { background: #f1f5f9; color: #64748b; }

/* Empty */
.empty { text-align: center; padding: 48px; color: #94a3b8; }
.empty p { margin-top: 10px; font-size: 0.875rem; }

@media (max-width: 700px) {
  .scores { display: none; }
  .rank-row { gap: 10px; }
}
</style>