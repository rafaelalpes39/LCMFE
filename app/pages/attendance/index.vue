<template>
  <div class="timein-page">

    <!-- TODAY'S SESSIONS -->
    <div class="section-title">
      <v-icon size="16" color="#0369a1" class="mr-1">mdi-calendar-today</v-icon>
      Today's Schedule
    </div>

    <div v-if="todaysSessions.length === 0" class="no-sessions">
      <v-icon size="36" color="#cbd5e1">mdi-calendar-blank-outline</v-icon>
      <p>No sessions assigned to you today</p>
    </div>

    <div v-else class="table-card">
      <table class="session-table">
        <thead>
          <tr>
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
            v-for="session in todaysSessions"
            :key="session.id"
            class="session-row"
            :class="{ 'row-done': session.timedIn }"
          >
            <td class="session-name-cell">{{ session.title }}</td>
            <td>
              <span class="type-badge">{{ session.type }}</span>
            </td>
            <td class="time-cell">{{ session.time }}</td>
            <td class="venue-cell">
              <v-icon size="13" class="mr-1" color="#94a3b8">mdi-map-marker-outline</v-icon>
              {{ session.venue }}
            </td>
            <td>
              <div v-if="session.timedIn" class="status-done">
                <v-icon size="14" color="#15803d" class="mr-1">mdi-check-circle</v-icon>
                Timed in · {{ session.timeInStamp }}
              </div>
              <span v-else class="status-pending">Pending</span>
            </td>
            <td>
              <div class="row-actions">
                <!-- TIME IN button — shows when not timed in yet -->
                <button
                  v-if="!session.timedIn"
                  class="btn-timein"
                  :class="{ active: activeSession?.id === session.id && clockStep === 'timed' }"
                  @click="handleTimeIn(session)"
                  :disabled="activeSession?.id === session.id && clockStep === 'timed'"
                >
                  <v-icon size="15" class="mr-1">mdi-clock-in</v-icon>
                  {{ activeSession?.id === session.id && clockStep === 'timed' ? 'Timed In ✓' : 'Time In' }}
                </button>

                <!-- SEND PICTURE button — only visible after Time In -->
                <button
                  v-if="!session.timedIn && activeSession?.id === session.id && clockStep === 'timed'"
                  class="btn-sendpic"
                  @click="openCamera(session)"
                >
                  <v-icon size="15" class="mr-1">mdi-camera-outline</v-icon>
                  Send Picture
                </button>

                <!-- Already submitted -->
                <div v-if="session.timedIn && session.selfie" class="selfie-thumb-wrap">
                  <img :src="session.selfie" class="selfie-thumb" alt="selfie" />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <!-- ══ CAMERA MODAL ══ -->
    <transition name="modal">
      <div v-if="showCameraModal" class="modal-backdrop" @click.self="closeCameraModal">
        <div class="modal">

          <div class="modal-header">
            <div>
              <h2 class="modal-title">Send Your Selfie</h2>
              <p class="modal-sub" v-if="activeSession">
                {{ activeSession.title }} · {{ activeSession.venue }}
              </p>
            </div>
            <button class="modal-close" @click="closeCameraModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- STEP: idle -->
            <div v-if="cameraState === 'idle'" class="camera-placeholder" @click="startCamera">
              <div class="camera-icon-wrap">
                <v-icon size="40" color="#0369a1">mdi-camera-outline</v-icon>
              </div>
              <p class="cam-text">Click to open camera</p>
              <p class="cam-sub">Take a selfie at the venue to confirm your attendance</p>
            </div>

            <!-- STEP: loading -->
            <div v-if="cameraState === 'loading'" class="camera-placeholder">
              <div class="spinner" />
              <p class="cam-text">Starting camera…</p>
            </div>

            <!-- STEP: live -->
            <div v-if="cameraState === 'live'" class="camera-live-wrap">
              <video ref="videoEl" autoplay playsinline muted class="camera-video" />
              <div class="cam-overlay">
                <div class="cam-frame" />
              </div>
              <p class="cam-hint">Position your face inside the circle</p>
            </div>

            <!-- STEP: preview -->
            <div v-if="cameraState === 'preview'" class="camera-live-wrap">
              <canvas ref="canvasEl" class="camera-video" />
              <div class="retake-bar">
                <button class="retake-btn" @click="retake">
                  <v-icon size="14" class="mr-1">mdi-camera-retake</v-icon>
                  Retake
                </button>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <!-- Capture button when live -->
            <template v-if="cameraState === 'live'">
              <button class="btn-cancel" @click="closeCameraModal">Cancel</button>
              <button class="btn-capture" @click="capturePhoto">
                <v-icon size="16" class="mr-1">mdi-camera</v-icon>
                Capture
              </button>
            </template>

            <!-- Send button when preview ready -->
            <template v-if="cameraState === 'preview'">
              <button class="btn-cancel" @click="closeCameraModal">Cancel</button>
              <button class="btn-send" @click="submitSelfie" :disabled="submitting">
                <span v-if="!submitting">
                  <v-icon size="15" class="mr-1">mdi-send-outline</v-icon>
                  Send Picture
                </span>
                <span v-else class="btn-spinner" />
              </button>
            </template>

            <!-- Idle -->
            <template v-if="cameraState === 'idle' || cameraState === 'loading'">
              <button class="btn-cancel" @click="closeCameraModal">Cancel</button>
            </template>
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

          <img v-if="lastConfirmed?.selfie" :src="lastConfirmed.selfie" class="confirm-photo" alt="selfie" />

          <div class="confirm-meta">
            <div class="confirm-row">
              <v-icon size="14" color="#64748b" class="mr-1">mdi-clock-outline</v-icon>
              <span>{{ lastConfirmed?.timeInStamp }}</span>
            </div>
            <div class="confirm-row">
              <v-icon size="14" color="#64748b" class="mr-1">mdi-map-marker-outline</v-icon>
              <span>{{ lastConfirmed?.venue }}</span>
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

    <div class="table-card">
      <table class="session-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Session</th>
            <th>Type</th>
            <th>Time</th>
            <th>Venue</th>
            <th>Time In</th>
            <th>Selfie</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in attendanceHistory" :key="record.id" class="session-row">
            <td class="date-cell">
              <span class="date-mon">{{ monthOf(record.date) }}</span>
              <span class="date-day">{{ dayOf(record.date) }}</span>
            </td>
            <td class="session-name-cell">{{ record.title }}</td>
            <td><span class="type-badge">{{ record.type }}</span></td>
            <td class="time-cell">{{ record.time }}</td>
            <td class="venue-cell">{{ record.venue }}</td>
            <td class="time-cell">{{ record.timeInStamp ?? '—' }}</td>
            <td>
              <img v-if="record.selfie" :src="record.selfie" class="selfie-thumb" alt="selfie" />
              <span v-else class="no-selfie">—</span>
            </td>
            <td>
              <span class="att-badge" :class="record.status">{{ record.status }}</span>
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

  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

/* ── Helpers ─────────────────────────────────────── */
const now         = ref(new Date());
const monthOf     = (d) => new Date(d).toLocaleDateString("en-US", { month: "short" });
const dayOf       = (d) => new Date(d).getDate();
const pad         = (n) => String(n).padStart(2, "0");
const todayStr    = computed(() => now.value.toISOString().slice(0, 10));
const stamp       = () => now.value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

let clockInterval;
onMounted(()   => { clockInterval = setInterval(() => now.value = new Date(), 1000); });
onUnmounted(() => { clearInterval(clockInterval); stopCamera(); });

/* ── Sessions ────────────────────────────────────── */
const sessions = ref([
  {
    id: 1, type: "Sunday Mass", title: "Sunday Mass 8AM",
    date: new Date().toISOString().slice(0, 10),
    time: "8:00 AM", venue: "Main Altar",
    timedIn: false, timeInStamp: null, selfie: null,
  },
  {
    id: 2, type: "Meeting", title: "Monthly Coordinator Meeting",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00 AM", venue: "Parish Hall",
    timedIn: false, timeInStamp: null, selfie: null,
  },
]);

const todaysSessions = computed(() =>
  sessions.value.filter(s => s.date === todayStr.value)
);

/* ── Step tracking ───────────────────────────────── */
const activeSession = ref(null);
const clockStep     = ref(null);

const handleTimeIn = (session) => {
  if (activeSession.value && activeSession.value.id !== session.id) {
    activeSession.value = null;
    clockStep.value = null;
  }
  activeSession.value = session;
  clockStep.value     = "timed";
  session.timeInStamp = stamp();
};

/* ── Camera ──────────────────────────────────────── */
const showCameraModal = ref(false);
const cameraState     = ref("idle");
const videoEl         = ref(null);
const canvasEl        = ref(null);
let stream            = null;
let capturedDataUrl   = null;
const submitting      = ref(false);

const openCamera = (session) => {
  activeSession.value   = session;
  cameraState.value     = "idle";
  capturedDataUrl       = null;
  showCameraModal.value = true;
};

const closeCameraModal = () => {
  stopCamera();
  cameraState.value     = "idle";
  showCameraModal.value = false;
};

const startCamera = async () => {
  cameraState.value = "loading";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 520, height: 520 },
      audio: false,
    });
    cameraState.value = "live";
    setTimeout(() => {
      if (videoEl.value) { videoEl.value.srcObject = stream; videoEl.value.play(); }
    }, 60);
  } catch {
    cameraState.value = "preview";
    capturedDataUrl   = null;
  }
};

const stopCamera = () => {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
};

const capturePhoto = () => {
  if (!videoEl.value || !canvasEl.value) return;
  const v = videoEl.value;
  const c = canvasEl.value;
  c.width  = v.videoWidth  || 480;
  c.height = v.videoHeight || 480;
  c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
  capturedDataUrl = c.toDataURL("image/jpeg", 0.85);
  stopCamera();
  cameraState.value = "preview";
};

const retake = () => {
  capturedDataUrl   = null;
  cameraState.value = "idle";
};

/* ── Submit selfie ───────────────────────────────── */
const showConfirmation = ref(false);
const lastConfirmed    = ref(null);

const submitSelfie = async () => {
  if (!activeSession.value) return;
  submitting.value = true;
  await new Promise(r => setTimeout(r, 1100));

  const s = activeSession.value;
  s.selfie  = capturedDataUrl ?? null;
  s.timedIn = true;
  clockStep.value = "done";

  attendanceHistory.value.unshift({
    id:          Date.now(),
    title:       s.title,
    type:        s.type,
    time:        s.time,
    venue:       s.venue,
    date:        todayStr.value,
    timeInStamp: s.timeInStamp,
    selfie:      s.selfie,
    status:      "present",
  });

  lastConfirmed.value    = { title: s.title, venue: s.venue, timeInStamp: s.timeInStamp, selfie: s.selfie };
  submitting.value       = false;
  showCameraModal.value  = false;
  showConfirmation.value = true;

  stopCamera();
  capturedDataUrl     = null;
  activeSession.value = null;
  clockStep.value     = null;
};

/* ── Attendance history ──────────────────────────── */
const attendanceHistory = ref([
  { id: 101, title: "Sunday Mass 8AM",        type: "Sunday Mass",  time: "8:00 AM",  venue: "Main Altar",  date: "2025-03-02", timeInStamp: "7:52 AM", selfie: null, status: "present" },
  { id: 102, title: "Monthly Lectors Meeting", type: "Meeting",      time: "3:00 PM",  venue: "Parish Hall", date: "2025-02-28", timeInStamp: "2:58 PM", selfie: null, status: "present" },
  { id: 103, title: "Weekday Mass",            type: "Weekday Mass", time: "6:00 AM",  venue: "Side Chapel", date: "2025-02-26", timeInStamp: null,      selfie: null, status: "absent"  },
  { id: 104, title: "Sunday Mass 10AM",        type: "Sunday Mass",  time: "10:00 AM", venue: "Main Altar",  date: "2025-02-23", timeInStamp: "9:55 AM", selfie: null, status: "present" },
]);
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

/* ── Empty ── */
.no-sessions {
  text-align: center; padding: 32px;
  background: white; border-radius: 14px;
  border: 1px dashed #e2e8f0; color: #94a3b8;
}
.no-sessions p { margin: 10px 0 0; font-size: 0.85rem; }

/* ── Table card ── */
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
.session-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.session-table td:last-child { text-align: right; }

.session-row { transition: background 0.1s; }
.session-row:hover { background: #fafcff; }
.session-row:last-child td { border-bottom: none; }
.session-row.row-done { opacity: 0.6; background: #f0fdf4; }
.session-row.row-done:hover { opacity: 0.8; }

/* Cells */
.session-name-cell { font-weight: 600; color: #0f172a; font-size: 0.875rem; }
.time-cell  { font-size: 0.82rem; color: #475569; white-space: nowrap; }
.venue-cell { font-size: 0.82rem; color: #64748b; display: flex; align-items: center; }

.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700;
  background: #eff6ff; color: #0369a1; border: 1px solid #bae6fd;
  white-space: nowrap;
}

.status-done {
  display: flex; align-items: center;
  font-size: 0.75rem; font-weight: 600; color: #15803d; white-space: nowrap;
}
.status-pending {
  font-size: 0.72rem; font-weight: 600; color: #94a3b8;
  background: #f1f5f9; padding: 2px 9px; border-radius: 20px;
}

/* Date cell (history) */
.date-cell { white-space: nowrap; }
.date-mon { display: block; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
.date-day { display: block; font-size: 1rem; font-weight: 700; color: #0f172a; line-height: 1; }

/* Row actions */
.row-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

/* Time In button */
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
.btn-timein.active { background: linear-gradient(135deg, #065f46, #059669); box-shadow: 0 3px 10px rgba(5,150,105,0.28); cursor: default; }
.btn-timein:disabled { cursor: default; }

/* Send Picture button */
.btn-sendpic {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 16px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.8rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 3px 10px rgba(124,58,237,0.28);
  transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
  animation: pulse-btn 1.5s infinite;
}
.btn-sendpic:hover { opacity: 0.88; transform: translateY(-1px); animation: none; }

@keyframes pulse-btn {
  0%, 100% { box-shadow: 0 3px 10px rgba(124,58,237,0.28); }
  50%       { box-shadow: 0 3px 20px rgba(124,58,237,0.55); }
}

/* Selfie thumb in table */
.selfie-thumb {
  width: 36px; height: 36px; border-radius: 8px;
  object-fit: cover; border: 2px solid #e2e8f0; cursor: pointer;
}
.selfie-thumb-wrap { display: flex; justify-content: flex-end; }
.no-selfie { font-size: 0.78rem; color: #cbd5e1; }

/* Attendance badges */
.att-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 0.68rem; font-weight: 700; text-transform: capitalize;
}
.att-badge.present { background: #f0fdf4; color: #15803d; }
.att-badge.absent  { background: #fef2f2; color: #dc2626; }

/* Empty cell */
.empty-cell { text-align: center; padding: 40px !important; color: #94a3b8; }
.empty-cell p { margin: 10px 0 0; font-size: 0.875rem; }

/* ── Camera Modal ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 18px;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title { font-family: "DM Serif Display", serif; font-size: 1.15rem; font-weight: 400; color: #0f172a; margin: 0; }
.modal-sub   { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }

.modal-body { padding: 20px 24px; }

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
}

/* Camera inside modal */
.camera-placeholder {
  aspect-ratio: 1/1; width: 100%; max-width: 380px;
  margin: 0 auto; border-radius: 14px;
  background: #f8fafc; border: 2px dashed #bae6fd;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; cursor: pointer; transition: background 0.15s;
}
.camera-placeholder:hover { background: #eff6ff; }

.camera-icon-wrap {
  width: 80px; height: 80px; border-radius: 50%;
  background: #eff6ff; display: flex; align-items: center; justify-content: center;
}
.cam-text { font-size: 0.9rem; font-weight: 600; color: #334155; margin: 0; }
.cam-sub  { font-size: 0.75rem; color: #94a3b8; margin: 0; text-align: center; padding: 0 20px; }

.spinner {
  width: 38px; height: 38px; border: 3px solid #e2e8f0;
  border-top-color: #0369a1; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.camera-live-wrap {
  position: relative; width: 100%; max-width: 380px; margin: 0 auto;
  border-radius: 14px; overflow: hidden; aspect-ratio: 1/1;
  background: #0f172a;
}
.camera-video {
  width: 100%; height: 100%; object-fit: cover;
  display: block; transform: scaleX(-1);
}
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.cam-frame {
  width: 210px; height: 210px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.65);
  box-shadow: 0 0 0 3000px rgba(0,0,0,0.38);
}
.cam-hint {
  position: absolute; bottom: 14px; left: 0; right: 0;
  text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.75); font-weight: 500;
}

.retake-bar {
  position: absolute; bottom: 14px; left: 0; right: 0;
  display: flex; justify-content: center;
}
.retake-btn {
  display: flex; align-items: center;
  padding: 6px 18px; border-radius: 20px;
  background: rgba(0,0,0,0.55); border: 1.5px solid rgba(255,255,255,0.25);
  color: white; font-size: 0.78rem; font-weight: 600;
  font-family: "DM Sans", sans-serif; cursor: pointer;
  transition: background 0.15s;
}
.retake-btn:hover { background: rgba(0,0,0,0.75); }

/* Modal footer buttons */
.btn-cancel {
  padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer;
  transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: #94a3b8; }

.btn-capture {
  display: flex; align-items: center; gap: 4px;
  padding: 9px 22px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.28);
  transition: opacity 0.15s;
}
.btn-capture:hover { opacity: 0.88; }

.btn-send {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 9px 24px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(124,58,237,0.28);
  transition: opacity 0.15s; min-width: 140px; min-height: 42px;
}
.btn-send:hover:not(:disabled) { opacity: 0.88; }
.btn-send:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-spinner {
  width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}

/* ── Confirmation overlay ── */
.confirm-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirmation-card {
  background: white; border-radius: 20px; padding: 32px 28px;
  text-align: center; max-width: 360px; width: 100%;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  border: 1.5px solid #bbf7d0;
}
.confirm-check {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  box-shadow: 0 6px 18px rgba(34,197,94,0.35);
}
.confirm-title   { font-family: "DM Serif Display", serif; font-size: 1.3rem; color: #0f172a; margin: 0 0 4px; }
.confirm-session { font-size: 0.82rem; color: #64748b; margin: 0 0 16px; }
.confirm-photo {
  width: 100px; height: 100px; object-fit: cover;
  border-radius: 50%; border: 3px solid #bbf7d0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: block; margin: 0 auto 16px;
}
.confirm-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 22px; }
.confirm-row  { display: flex; align-items: center; justify-content: center; font-size: 0.82rem; color: #475569; }
.btn-dismiss {
  padding: 10px 28px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.25);
  transition: opacity 0.15s;
}
.btn-dismiss:hover { opacity: 0.9; }

/* ── Transitions ── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }

.pop-enter-active { transition: opacity 0.25s ease; }
.pop-leave-active { transition: opacity 0.18s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; }
</style>