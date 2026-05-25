<template>
  <div class="timein-page">

    <!-- UPCOMING SCHEDULES -->
    <div class="section-title">
      <v-icon size="16" color="#0369a1" class="mr-1">mdi-calendar-clock</v-icon>
      Upcoming Schedules
    </div>

    <div v-if="loadingSchedules" class="no-sessions">
      <div class="spinner" />
      <p>Loading your schedules…</p>
    </div>

    <div v-else-if="upcomingSessions.length === 0" class="no-sessions">
      <v-icon size="36" color="#cbd5e1">mdi-calendar-blank-outline</v-icon>
      <p>No upcoming sessions assigned to you</p>
    </div>

    <template v-else>
      <!-- ── DESKTOP TABLE (hidden on mobile) ── -->
      <div v-show="!isMobile" class="table-card">
        <table class="session-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Session</th>
              <th>Type</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="session in upcomingSessions"
              :key="session.id"
              class="session-row"
              :class="{ 'row-done': myEntry(session)?.timeInStamp }"
            >
              <td class="date-cell">
                <span class="date-mon">{{ monthOf(session.date) }}</span>
                <span class="date-day">{{ dayOf(session.date) }}</span>
              </td>
              <td class="session-name-cell">{{ session.title }}</td>
              <td><span class="type-badge">{{ session.type }}</span></td>
              <td class="time-cell">{{ fmtTime(session.time) }}</td>
              <td class="venue-cell">
                <v-icon size="13" class="mr-1" color="#94a3b8">mdi-map-marker-outline</v-icon>
                {{ venueOf(session) }}
              </td>
              <td>
                <div v-if="myEntry(session)?.timeInStamp" class="status-done">
                  <v-icon size="14" color="#15803d" class="mr-1">mdi-check-circle</v-icon>
                  Timed In
                </div>
                <span v-else class="status-pending">Pending</span>
              </td>
              <td>
                <div class="row-actions">
                  <template v-if="!myEntry(session)?.timeInStamp">
                    <button
                      class="btn-timein"
                      :class="{ 'btn-timein-disabled': !isToday(session.date) }"
                      :disabled="!isToday(session.date)"
                      @click="isToday(session.date) && openTimeInModal(session)"
                      :title="!isToday(session.date) ? 'Time In is only available on the day of the session' : 'Click to Time In'"
                    >
                      <v-icon size="15" class="mr-1">{{ isToday(session.date) ? 'mdi-clock-in' : 'mdi-clock-outline' }}</v-icon>
                      {{ isToday(session.date) ? 'Time In' : 'Not Yet' }}
                    </button>
                  </template>
                  <div v-else class="already-in">
                    <v-icon size="14" color="#15803d" class="mr-1">mdi-check-circle-outline</v-icon>
                    {{ fmtDateTime(myEntry(session).timeInStamp) }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── MOBILE CARDS (hidden on desktop) ── -->
      <div v-show="isMobile" class="session-cards">
        <div
          v-for="session in upcomingSessions"
          :key="session.id"
          class="session-mobile-card"
          :class="{ 'card-done': myEntry(session)?.timeInStamp, 'card-today': isToday(session.date) }"
        >
          <!-- Card top: date pill + type badge -->
          <div class="smc-top">
            <div class="smc-date-pill">
              <span class="smc-mon">{{ monthOf(session.date) }}</span>
              <span class="smc-day">{{ dayOf(session.date) }}</span>
            </div>
            <div class="smc-badges">
              <span class="type-badge">{{ session.type }}</span>
              <span v-if="isToday(session.date)" class="today-badge">Today</span>
            </div>
            <!-- Status indicator top-right -->
            <div class="smc-status">
              <div v-if="myEntry(session)?.timeInStamp" class="status-done">
                <v-icon size="13" color="#15803d" class="mr-1">mdi-check-circle</v-icon>
                Timed In
              </div>
              <span v-else class="status-pending">Pending</span>
            </div>
          </div>

          <!-- Card body: title, time, venue -->
          <div class="smc-body">
            <h3 class="smc-title">{{ session.title }}</h3>
            <div class="smc-meta">
              <span class="smc-meta-item">
                <v-icon size="13" color="#94a3b8">mdi-clock-outline</v-icon>
                {{ fmtTime(session.time) }}
              </span>
              <span class="smc-meta-item">
                <v-icon size="13" color="#94a3b8">mdi-map-marker-outline</v-icon>
                {{ venueOf(session) }}
              </span>
            </div>
          </div>

          <!-- Card footer: action button -->
          <div class="smc-footer">
            <template v-if="!myEntry(session)?.timeInStamp">
              <button
                class="btn-timein-mobile"
                :class="{ 'btn-timein-mobile-disabled': !isToday(session.date) }"
                :disabled="!isToday(session.date)"
                @click="isToday(session.date) && openTimeInModal(session)"
              >
                <v-icon size="16" class="mr-1">
                  {{ isToday(session.date) ? 'mdi-clock-in' : 'mdi-clock-outline' }}
                </v-icon>
                {{ isToday(session.date) ? 'Time In Now' : 'Not Yet Available' }}
              </button>
            </template>
            <div v-else class="already-in-mobile">
              <v-icon size="15" color="#15803d" class="mr-1">mdi-check-circle-outline</v-icon>
              {{ fmtDateTime(myEntry(session).timeInStamp) }}
            </div>
          </div>
        </div>
      </div>
    </template>


    <!-- ══ TIME IN MODAL ══ -->
    <transition name="modal">
      <div v-if="showTimeInModal" class="modal-backdrop" @click.self="closeTimeInModal">
        <div class="modal">

          <div class="modal-header">
            <div>
              <h2 class="modal-title">Time In</h2>
              <p class="modal-sub" v-if="activeSession">
                {{ activeSession.title }} · {{ venueOf(activeSession) }}
              </p>
            </div>
            <button class="modal-close" @click="closeTimeInModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- STATUS SELECTOR -->
            <div class="field-group">
              <label class="field-label">Attendance Status</label>
              <div class="status-options">
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  class="status-opt"
                  :class="[opt.cls, { selected: selectedStatus === opt.value }]"
                  @click="selectedStatus = opt.value; subbedName = ''"
                >
                  <v-icon size="16" class="mr-1">{{ opt.icon }}</v-icon>
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- SUBBED NAME INPUT -->
            <transition name="fade-slide">
              <div v-if="selectedStatus === 'Subbed'" class="field-group">
                <label class="field-label">
                  Subbed by <span class="field-required">*</span>
                </label>
                <div class="input-wrap">
                  <v-icon size="16" class="input-icon" color="#7c3aed">mdi-account-switch-outline</v-icon>
                  <input
                    v-model="subbedName"
                    type="text"
                    class="text-input"
                    placeholder="Enter the name of the substitute"
                    maxlength="100"
                  />
                </div>
                <p class="field-hint-text">
                  Status will be saved as <strong>"Subbed by: {{ subbedName || '…' }}"</strong>
                </p>
              </div>
            </transition>

            <!-- PHOTO UPLOAD -->
            <div class="field-group">
              <label class="field-label">
                Photo <span class="field-optional">(optional)</span>
              </label>

              <div
                v-if="!uploadedPreview"
                class="upload-zone"
                :class="{ 'drag-over': isDragging }"
                @click="triggerFileInput"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDrop"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/jpg,image/jpeg,image/png"
                  class="hidden-input"
                  @change="onFileChange"
                />
                <div class="upload-icon-wrap">
                  <v-icon size="32" color="#0369a1">mdi-cloud-upload-outline</v-icon>
                </div>
                <p class="upload-text">Click to upload or drag & drop</p>
                <p class="upload-sub">JPG, JPEG or PNG · max 2 MB</p>
              </div>

              <div v-else class="preview-wrap">
                <img :src="uploadedPreview" class="preview-img" alt="preview" />
                <button class="remove-photo" @click="removePhoto">
                  <v-icon size="16">mdi-close</v-icon>
                  Remove
                </button>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeTimeInModal">Cancel</button>
            <button
              class="btn-send"
              @click="submitTimeIn"
              :disabled="submitting || !selectedStatus || (selectedStatus === 'Subbed' && !subbedName.trim())"
            >
              <span v-if="!submitting">
                <v-icon size="15" class="mr-1">mdi-clock-check-outline</v-icon>
                Confirm Time In
              </span>
              <span v-else class="btn-spinner" />
            </button>
          </div>

        </div>
      </div>
    </transition>


    <!-- ══ SUCCESS CONFIRMATION ══ -->
    <transition name="pop">
      <div v-if="showConfirmation" class="confirm-overlay">
        <div class="confirmation-card">
          <div class="confirm-check">
            <v-icon size="28" color="white">mdi-check</v-icon>
          </div>
          <h3 class="confirm-title">Attendance Recorded!</h3>
          <p class="confirm-session">{{ lastConfirmed?.title }}</p>

          <img
            v-if="lastConfirmed?.selfie"
            :src="lastConfirmed.selfie"
            class="confirm-photo"
            alt="photo"
          />

          <div class="confirm-meta">
            <div class="confirm-row">
              <v-icon size="14" color="#64748b" class="mr-1">mdi-clock-outline</v-icon>
              <span>{{ fmtDateTime(lastConfirmed?.timeInStamp) }}</span>
            </div>
            <div class="confirm-row">
              <v-icon size="14" color="#64748b" class="mr-1">mdi-map-marker-outline</v-icon>
              <span>{{ lastConfirmed?.venue }}</span>
            </div>
            <div class="confirm-row">
              <v-icon size="14" color="#64748b" class="mr-1">mdi-account-check-outline</v-icon>
              <span>{{ lastConfirmed?.status }}</span>
            </div>
          </div>

          <button class="btn-dismiss" @click="showConfirmation = false">Done</button>
        </div>
      </div>
    </transition>


    <!-- ATTENDANCE HISTORY -->
    <div class="section-title mt-6">
      <v-icon size="16" color="#0369a1" class="mr-1">mdi-history</v-icon>
      Attendance History
    </div>

    <!-- ── DESKTOP HISTORY TABLE ── -->
    <div v-show="!isMobile" class="table-card">
      <table class="session-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Session</th>
            <th>Type</th>
            <th>Schedule Time</th>
            <th>Venue</th>
            <th>Time In</th>
            <th>Photo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in attendanceHistory"
            :key="record.scheduleId + '-' + record.memberId"
            class="session-row"
          >
            <td class="date-cell">
              <span class="date-mon">{{ monthOf(record.date) }}</span>
              <span class="date-day">{{ dayOf(record.date) }}</span>
            </td>
            <td class="session-name-cell">{{ record.title }}</td>
            <td><span class="type-badge">{{ record.type }}</span></td>
            <td class="time-cell">{{ fmtTime(record.time) }}</td>
            <td class="venue-cell">{{ record.location ?? '—' }}</td>
            <td class="time-cell">{{ fmtDateTime(record.timeInStamp) }}</td>
            <td>
              <img v-if="record.selfie" :src="record.selfie" class="selfie-thumb" alt="photo" />
              <span v-else class="no-selfie">—</span>
            </td>
            <td>
              <span class="att-badge" :class="badgeClass(record.status)">
                {{ record.status ?? 'Pending' }}
              </span>
            </td>
          </tr>
          <tr v-if="attendanceHistory.length === 0">
            <td colspan="8" class="empty-cell">
              <v-icon size="32" color="#cbd5e1">mdi-history</v-icon>
              <p>No attendance records yet</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── MOBILE HISTORY CARDS ── -->
    <div v-show="isMobile">
      <div v-if="attendanceHistory.length === 0" class="no-sessions">
        <v-icon size="32" color="#cbd5e1">mdi-history</v-icon>
        <p>No attendance records yet</p>
      </div>
      <div v-else class="history-cards">
        <div
          v-for="record in attendanceHistory"
          :key="record.scheduleId + '-' + record.memberId"
          class="history-mobile-card"
        >
          <div class="hmc-left">
            <div class="hmc-date">
              <span class="hmc-mon">{{ monthOf(record.date) }}</span>
              <span class="hmc-day">{{ dayOf(record.date) }}</span>
            </div>
            <img v-if="record.selfie" :src="record.selfie" class="hmc-selfie" alt="photo" />
            <div v-else class="hmc-no-selfie">
              <v-icon size="16" color="#cbd5e1">mdi-camera-off-outline</v-icon>
            </div>
          </div>
          <div class="hmc-body">
            <div class="hmc-title-row">
              <span class="hmc-title">{{ record.title }}</span>
              <span class="att-badge" :class="badgeClass(record.status)">
                {{ record.status ?? 'Pending' }}
              </span>
            </div>
            <div class="hmc-meta">
              <span class="hmc-meta-item">
                <v-icon size="12" color="#94a3b8">mdi-tag-outline</v-icon>
                {{ record.type }}
              </span>
              <span class="hmc-meta-item">
                <v-icon size="12" color="#94a3b8">mdi-clock-outline</v-icon>
                {{ fmtTime(record.time) }}
              </span>
              <span class="hmc-meta-item">
                <v-icon size="12" color="#94a3b8">mdi-map-marker-outline</v-icon>
                {{ record.location ?? '—' }}
              </span>
            </div>
            <div class="hmc-timein" v-if="record.timeInStamp">
              <v-icon size="12" color="#7c3aed">mdi-clock-check-outline</v-icon>
              <span>{{ fmtDateTime(record.timeInStamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const config = useRuntimeConfig();
const auth   = useAuthStore();
const { user } = storeToRefs(auth);

const currentUserId = computed(() => user.value?.id ?? user.value?.user?.id ?? null);

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const now = ref(new Date());

const monthOf = (d) => new Date(d).toLocaleDateString("en-US", { month: "short" });
const dayOf   = (d) => new Date(d).getDate();

const todayStr = computed(() => {
  const d  = now.value;
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dy}`;
});

const isToday = (date) => {
  if (!date) return false;
  return date === todayStr.value;
};

const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const fmtDateTime = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  const date = d.toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
};

const venueOf = (s) => s.venue ?? s.location ?? "—";

const badgeClass = (status) => {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s === "present")        return "present";
  if (s === "absent")         return "absent";
  if (s.startsWith("subbed")) return "subbed";
  return "pending";
};

let clockInterval;
onMounted(()  => { clockInterval = setInterval(() => (now.value = new Date()), 1000); });
onUnmounted(() => clearInterval(clockInterval));

/* ─────────────────────────────────────────────────────────
   RESPONSIVE BREAKPOINT
───────────────────────────────────────────────────────── */
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 700;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});

/* ─────────────────────────────────────────────────────────
   STATUS OPTIONS
───────────────────────────────────────────────────────── */
const statusOptions = [
  { value: "Present", label: "Present", icon: "mdi-check-circle-outline",  cls: "opt-present" },
  { value: "Absent",  label: "Absent",  icon: "mdi-close-circle-outline",   cls: "opt-absent"  },
  { value: "Subbed",  label: "Subbed",  icon: "mdi-account-switch-outline", cls: "opt-subbed"  },
];

/* ─────────────────────────────────────────────────────────
   SCHEDULES
───────────────────────────────────────────────────────── */
const allSchedules     = ref([]);
const loadingSchedules = ref(true);

const fetchSchedules = async () => {
  loadingSchedules.value = true;
  try {
    const data = await $fetch(`${config.public.apiBase}/api/schedules`);
    allSchedules.value = data;
  } finally {
    loadingSchedules.value = false;
  }
};

onMounted(fetchSchedules);

watch(
  () => currentUserId.value,
  (id, prevId) => { if (id && id !== prevId) fetchSchedules(); }
);

const myEntry = (session) =>
  (session.members ?? []).find(
    (m) => String(m.memberId) === String(currentUserId.value)
  ) ?? null;

const upcomingSessions = computed(() => {
  if (!currentUserId.value) return [];
  return allSchedules.value
    .filter((s) => {
      const assigned = (s.members ?? []).some(
        (m) => String(m.memberId) === String(currentUserId.value)
      );
      const notDone  = !myEntry(s)?.timeInStamp;
      const isFuture = s.date >= todayStr.value;
      return assigned && notDone && isFuture;
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));
});

const attendanceHistory = computed(() => {
  if (!currentUserId.value) return [];
  const rows = [];
  for (const s of allSchedules.value) {
    const entry = (s.members ?? []).find(
      (m) => String(m.memberId) === String(currentUserId.value)
    );
    if (!entry || !entry.timeInStamp) continue;
    rows.push({
      scheduleId:  s.id,
      memberId:    entry.memberId,
      title:       s.title,
      type:        s.type,
      date:        s.date,
      time:        s.time,
      location:    venueOf(s),
      timeInStamp: entry.timeInStamp,
      selfie:      entry.selfie,
      status:      entry.status,
    });
  }
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
});

/* ─────────────────────────────────────────────────────────
   TIME IN MODAL
───────────────────────────────────────────────────────── */
const showTimeInModal = ref(false);
const activeSession   = ref(null);
const selectedStatus  = ref("Present");
const subbedName      = ref("");

const openTimeInModal = (session) => {
  activeSession.value   = session;
  selectedStatus.value  = "Present";
  subbedName.value      = "";
  uploadedFile          = null;
  uploadedPreview.value = null;
  isDragging.value      = false;
  showTimeInModal.value = true;
};

const closeTimeInModal = () => {
  showTimeInModal.value = false;
  activeSession.value   = null;
  uploadedFile          = null;
  uploadedPreview.value = null;
};

/* ─────────────────────────────────────────────────────────
   PHOTO UPLOAD
───────────────────────────────────────────────────────── */
const fileInputRef    = ref(null);
const uploadedPreview = ref(null);
const isDragging      = ref(false);
let   uploadedFile    = null;

const MAX_SIZE = 2 * 1024 * 1024;

const triggerFileInput = () => fileInputRef.value?.click();

const processFile = (file) => {
  if (!file) return;
  if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
    alert("Only JPG, JPEG, or PNG files are allowed.");
    return;
  }
  if (file.size > MAX_SIZE) {
    alert("File size must not exceed 2 MB.");
    return;
  }
  uploadedFile          = file;
  uploadedPreview.value = URL.createObjectURL(file);
};

const onFileChange = (e) => processFile(e.target.files?.[0]);

const onDrop = (e) => {
  isDragging.value = false;
  processFile(e.dataTransfer.files?.[0]);
};

const removePhoto = () => {
  uploadedFile          = null;
  uploadedPreview.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
};

/* ─────────────────────────────────────────────────────────
   SUBMIT
───────────────────────────────────────────────────────── */
const showConfirmation = ref(false);
const lastConfirmed    = ref(null);
const submitting       = ref(false);

const resolvedStatus = computed(() => {
  if (selectedStatus.value === "Subbed") {
    return `Subbed by: ${subbedName.value.trim()}`;
  }
  return selectedStatus.value;
});

const submitTimeIn = async () => {
  if (!activeSession.value || !currentUserId.value) return;
  if (selectedStatus.value === "Subbed" && !subbedName.value.trim()) return;

  submitting.value = true;
  const session = activeSession.value;

  const formData = new FormData();
  formData.append("memberId", currentUserId.value);
  formData.append("status",   resolvedStatus.value);
  if (uploadedFile) {
    formData.append("selfie", uploadedFile);
  }

  try {
    const response = await $fetch(
      `${config.public.apiBase}/api/schedules/${session.id}/time-in`,
      { method: "POST", body: formData }
    );

    const updated = response?.data;
    const idx = allSchedules.value.findIndex((s) => s.id === session.id);
    if (idx !== -1 && updated) {
      allSchedules.value[idx] = updated;
    } else {
      const entry = myEntry(session);
      if (entry) {
        entry.status      = resolvedStatus.value;
        entry.timeInStamp = new Date().toISOString();
        if (uploadedPreview.value) entry.selfie = uploadedPreview.value;
      }
    }

    lastConfirmed.value = {
      title:       session.title,
      venue:       venueOf(session),
      timeInStamp: new Date().toISOString(),
      selfie:      uploadedPreview.value,
      status:      resolvedStatus.value,
    };

    showTimeInModal.value  = false;
    showConfirmation.value = true;
  } catch (err) {
    console.error("Time In failed:", err);
  } finally {
    submitting.value      = false;
    activeSession.value   = null;
    uploadedFile          = null;
    uploadedPreview.value = null;
  }
};
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.timein-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
}

/* ── Section title ── */
.section-title {
  font-size: 0.78rem; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.07em;
  display: flex; align-items: center; margin-bottom: 12px;
}
.mt-6 { margin-top: 30px; }

/* ── Empty / loading ── */
.no-sessions {
  text-align: center; padding: 32px; background: white; border-radius: 14px;
  border: 1px dashed #e2e8f0; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.no-sessions p { margin: 0; font-size: 0.85rem; }

/* ════════════════════════════
   DESKTOP TABLE
════════════════════════════ */
.table-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0; overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.session-table { width: 100%; border-collapse: collapse; }
.session-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.session-table th {
  padding: 11px 16px; text-align: left;
  font-size: 0.7rem; font-weight: 700; color: #64748b;
  letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap;
}
.session-table th:last-child { text-align: right; }
.session-table td {
  padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}
.session-table td:last-child { text-align: right; }
.session-row { transition: background 0.1s; }
.session-row:hover { background: #fafcff; }
.session-row:last-child td { border-bottom: none; }
.session-row.row-done { opacity: 0.6; background: #f0fdf4; }
.session-row.row-done:hover { opacity: 0.8; }

.session-name-cell { font-weight: 600; color: #0f172a; font-size: 0.875rem; }
.time-cell  { font-size: 0.82rem; color: #475569; white-space: nowrap; }
.venue-cell { font-size: 0.82rem; color: #64748b; display: flex; align-items: center; }
.date-cell  { white-space: nowrap; }
.date-mon   { display: block; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
.date-day   { display: block; font-size: 1rem; font-weight: 700; color: #0f172a; line-height: 1; }

.row-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
.already-in  {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.75rem; color: #15803d; font-weight: 500; white-space: nowrap;
}

/* ── Desktop Time In button ── */
.btn-timein {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 16px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.8rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 3px 10px rgba(3,105,161,0.28);
  transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
}
.btn-timein:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-timein.btn-timein-disabled,
.btn-timein:disabled {
  background: #e2e8f0; color: #94a3b8;
  box-shadow: none; cursor: not-allowed; opacity: 1; transform: none;
}

/* ════════════════════════════
   MOBILE SESSION CARDS
════════════════════════════ */
.session-cards { display: flex; flex-direction: column; gap: 12px; }

.session-mobile-card {
  background: white; border-radius: 16px;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.session-mobile-card.card-today {
  border-color: #bae6fd;
  box-shadow: 0 2px 16px rgba(3,105,161,0.1);
}
.session-mobile-card.card-done {
  opacity: 0.65; background: #f0fdf4; border-color: #bbf7d0;
}

/* Card top row */
.smc-top {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px 8px;
  border-bottom: 1px solid #f1f5f9;
}
.smc-date-pill {
  display: flex; flex-direction: column; align-items: center;
  background: linear-gradient(160deg, #0c4a6e, #0369a1);
  color: white; border-radius: 10px;
  padding: 6px 10px; min-width: 40px; text-align: center; flex-shrink: 0;
}
.smc-mon { font-size: 0.55rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; }
.smc-day { font-size: 1.15rem; font-weight: 700; line-height: 1; }

.smc-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }

.today-badge {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: 0.62rem; font-weight: 700;
  background: #dbeafe; color: #0369a1; border: 1px solid #bae6fd;
  white-space: nowrap;
}

.smc-status { margin-left: auto; flex-shrink: 0; }

/* Card body */
.smc-body { padding: 10px 14px 8px; }
.smc-title {
  font-family: "DM Serif Display", serif;
  font-size: 1rem; font-weight: 400; color: #0f172a;
  margin: 0 0 6px;
}
.smc-meta { display: flex; flex-wrap: wrap; gap: 10px; }
.smc-meta-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.78rem; color: #64748b;
}

/* Card footer */
.smc-footer {
  padding: 10px 14px 14px;
  border-top: 1px solid #f1f5f9;
}

/* Mobile Time In button */
.btn-timein-mobile {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 11px 16px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 14px rgba(3,105,161,0.3);
  transition: opacity 0.15s, transform 0.1s;
}
.btn-timein-mobile:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.btn-timein-mobile-disabled,
.btn-timein-mobile:disabled {
  background: #e2e8f0; color: #94a3b8;
  box-shadow: none; cursor: not-allowed; opacity: 1; transform: none;
}

.already-in-mobile {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 0.78rem; color: #15803d; font-weight: 600;
  padding: 8px 0;
}

/* ════════════════════════════
   MOBILE HISTORY CARDS
════════════════════════════ */
.history-cards { display: flex; flex-direction: column; gap: 10px; }

.history-mobile-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px;
}
.hmc-left {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.hmc-date {
  display: flex; flex-direction: column; align-items: center;
  background: #f1f5f9; border-radius: 8px;
  padding: 5px 8px; text-align: center; min-width: 36px;
}
.hmc-mon { font-size: 0.52rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.06em; }
.hmc-day { font-size: 0.9rem; font-weight: 700; color: #0f172a; line-height: 1; }

.hmc-selfie {
  width: 40px; height: 40px; border-radius: 8px;
  object-fit: cover; border: 2px solid #e2e8f0;
}
.hmc-no-selfie {
  width: 40px; height: 40px; border-radius: 8px;
  background: #f1f5f9; border: 1.5px dashed #e2e8f0;
  display: flex; align-items: center; justify-content: center;
}

.hmc-body { flex: 1; min-width: 0; }
.hmc-title-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 5px; flex-wrap: wrap;
}
.hmc-title { font-weight: 600; color: #0f172a; font-size: 0.875rem; }

.hmc-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 5px; }
.hmc-meta-item {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.72rem; color: #64748b;
}
.hmc-timein {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.7rem; color: #7c3aed; font-weight: 600;
  background: #faf5ff; border: 1px solid #e9d5ff;
  padding: 3px 8px; border-radius: 20px;
  width: fit-content; margin-top: 2px;
}

/* ── Shared badges ── */
.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700;
  background: #eff6ff; color: #0369a1; border: 1px solid #bae6fd; white-space: nowrap;
}
.status-done {
  display: flex; align-items: center;
  font-size: 0.72rem; font-weight: 600; color: #15803d; white-space: nowrap;
}
.status-pending {
  font-size: 0.7rem; font-weight: 600; color: #94a3b8;
  background: #f1f5f9; padding: 2px 9px; border-radius: 20px;
  white-space: nowrap;
}
.att-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700;
}
.att-badge.present { background: #f0fdf4; color: #15803d; }
.att-badge.absent  { background: #fef2f2; color: #dc2626; }
.att-badge.subbed  { background: #faf5ff; color: #7c3aed; }
.att-badge.pending { background: #f1f5f9; color: #94a3b8; }

.selfie-thumb {
  width: 36px; height: 36px; border-radius: 8px;
  object-fit: cover; border: 2px solid #e2e8f0;
}
.no-selfie { font-size: 0.78rem; color: #cbd5e1; }

.empty-cell {
  text-align: center !important;
  padding: 48px 20px !important;
  color: #94a3b8;
}
.empty-cell > * { display: block; margin: 0 auto; text-align: center; }
.empty-cell p { margin: 10px auto 0; font-size: 0.875rem; width: 100%; text-align: center; }

.spinner {
  width: 38px; height: 38px; border: 3px solid #e2e8f0;
  border-top-color: #0369a1; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ════════════════════════════
   MODAL
════════════════════════════ */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.modal {
  background: white; border-radius: 18px;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}

/* On mobile, modal slides up from bottom */
@media (max-width: 700px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }
  .modal {
    border-radius: 20px 20px 0 0;
    max-height: 92vh;
    max-width: 100%;
  }
}

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-family: "DM Serif Display", serif; font-size: 1.15rem;
  font-weight: 400; color: #0f172a; margin: 0;
}
.modal-sub { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
}

@media (max-width: 700px) {
  .modal-footer {
    flex-direction: column-reverse;
    padding-bottom: 28px;
  }
  .modal-footer .btn-cancel,
  .modal-footer .btn-send {
    width: 100%;
    justify-content: center;
  }
}

/* ── Field groups ── */
.field-group { display: flex; flex-direction: column; gap: 8px; }
.field-label {
  font-size: 0.75rem; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.field-required { color: #dc2626; }
.field-optional { font-weight: 400; color: #94a3b8; text-transform: none; letter-spacing: 0; }
.field-hint-text { font-size: 0.72rem; color: #94a3b8; margin: 0; }
.field-hint-text strong { color: #7c3aed; }

/* ── Status options ── */
.status-options { display: flex; gap: 10px; flex-wrap: wrap; }
.status-opt {
  flex: 1; min-width: 80px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 14px; border-radius: 10px; border: 2px solid #e2e8f0;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.82rem; font-weight: 700; cursor: pointer;
  transition: all 0.15s; color: #475569;
}
.status-opt.opt-present.selected { border-color: #16a34a; background: #f0fdf4; color: #15803d; }
.status-opt.opt-absent.selected  { border-color: #dc2626; background: #fef2f2; color: #dc2626; }
.status-opt.opt-subbed.selected  { border-color: #7c3aed; background: #faf5ff; color: #7c3aed; }
.status-opt.opt-present:hover { border-color: #16a34a; }
.status-opt.opt-absent:hover  { border-color: #dc2626; }
.status-opt.opt-subbed:hover  { border-color: #7c3aed; }

/* ── Subbed name input ── */
.input-wrap {
  display: flex; align-items: center; gap: 10px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 10px 14px; background: white; transition: border-color 0.15s;
}
.input-wrap:focus-within { border-color: #7c3aed; }
.input-icon { flex-shrink: 0; }
.text-input {
  flex: 1; border: none; outline: none;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem;
  color: #0f172a; background: transparent;
}
.text-input::placeholder { color: #cbd5e1; }

/* ── Upload zone ── */
.upload-zone {
  border: 2px dashed #bae6fd; border-radius: 14px;
  background: #f8fafc; padding: 28px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
}
.upload-zone:hover, .upload-zone.drag-over {
  background: #eff6ff; border-color: #0369a1;
}
.upload-icon-wrap {
  width: 56px; height: 56px; border-radius: 50%;
  background: #eff6ff; display: flex; align-items: center; justify-content: center;
}
.upload-text { font-size: 0.88rem; font-weight: 600; color: #334155; margin: 0; }
.upload-sub  { font-size: 0.72rem; color: #94a3b8; margin: 0; }
.hidden-input { display: none; }

/* ── Preview ── */
.preview-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.preview-img  {
  width: 100%; max-width: 260px; border-radius: 12px;
  object-fit: cover; border: 2px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.remove-photo {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 20px;
  border: 1.5px solid #fecaca; background: #fef2f2;
  color: #dc2626; font-family: "DM Sans", sans-serif;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.remove-photo:hover { background: #fee2e2; }

/* ── Modal buttons ── */
.btn-cancel {
  padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer;
  transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: #94a3b8; }
.btn-send {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 9px 24px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #065f46, #059669);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(5,150,105,0.28);
  transition: opacity 0.15s; min-width: 160px; min-height: 42px;
}
.btn-send:hover:not(:disabled) { opacity: 0.88; }
.btn-send:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-spinner {
  width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}

/* ════════════════════════════
   SUCCESS CONFIRMATION
════════════════════════════ */
.confirm-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirmation-card {
  background: white; border-radius: 20px; padding: 32px 28px;
  text-align: center; max-width: 360px; width: 100%;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2); border: 1.5px solid #bbf7d0;
}
.confirm-check {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px; box-shadow: 0 6px 18px rgba(34,197,94,0.35);
}
.confirm-title   { font-family: "DM Serif Display", serif; font-size: 1.3rem; color: #0f172a; margin: 0 0 4px; }
.confirm-session { font-size: 0.82rem; color: #64748b; margin: 0 0 16px; }
.confirm-photo {
  width: 100px; height: 100px; object-fit: cover; border-radius: 50%;
  border: 3px solid #bbf7d0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: block; margin: 0 auto 16px;
}
.confirm-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 22px; }
.confirm-row  {
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem; color: #475569;
}
.btn-dismiss {
  width: 100%; padding: 11px 28px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.25); transition: opacity 0.15s;
}
.btn-dismiss:hover { opacity: 0.9; }

/* ── Transitions ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from,  .modal-leave-to      { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform 0.22s ease, opacity 0.18s ease;
}
.modal-enter-from .modal, .modal-leave-to .modal {
  transform: scale(0.96) translateY(8px); opacity: 0;
}

/* Mobile modal slides up */
@media (max-width: 700px) {
  .modal-enter-from .modal, .modal-leave-to .modal {
    transform: translateY(100%); opacity: 1;
  }
}

.pop-enter-active { transition: opacity 0.25s ease; }
.pop-leave-active { transition: opacity 0.18s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; }

.fade-slide-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-slide-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-slide-enter-from   { opacity: 0; transform: translateY(-6px); }
.fade-slide-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>