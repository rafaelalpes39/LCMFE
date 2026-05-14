<template>
  <div class="att-page">

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Attendance</h1>
        <p class="page-sub">Mass schedules, meetings & member attendance tracking</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <v-icon size="16" class="mr-1">{{ tab.icon }}</v-icon>
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>


    <!-- ══════════ MASS SCHEDULE TAB ══════════ -->
    <div v-if="activeTab === 'mass'">
      <div class="section-toolbar">
        <div class="search-wrap">
          <v-icon size="15" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
          <input v-model="massSearch" class="search-input" placeholder="Search mass schedule…" />
        </div>
        <button class="btn-primary" @click="openMassModal()">
          <v-icon size="15" class="mr-1">mdi-plus</v-icon>
          New Mass Schedule
        </button>
      </div>

      <div class="session-list">
        <div
          v-for="ms in filteredMasses"
          :key="ms.id"
          class="session-card"
          :class="{ past: isPast(ms.date), 'is-new': ms.isNew }"
        >
          <div class="sc-left">
            <div class="date-block">
              <span class="db-month">{{ monthOf(ms.date) }}</span>
              <span class="db-day">{{ dayOf(ms.date) }}</span>
              <span class="db-year">{{ yearOf(ms.date) }}</span>
            </div>
          </div>

          <div class="sc-body">
            <div class="sc-top">
              <div class="sc-title-row">
                <h3 class="sc-title">{{ ms.massType }}</h3>
                <span class="mass-type-badge" :class="ms.massType.toLowerCase().replace(/\s+/g,'-')">
                  {{ ms.massType }}
                </span>
              </div>
              <div class="sc-meta">
                <span class="meta-item"><v-icon size="13" class="mr-1" color="#64748b">mdi-clock-outline</v-icon>{{ ms.time }}</span>
                <span class="meta-item"><v-icon size="13" class="mr-1" color="#64748b">mdi-map-marker-outline</v-icon>{{ ms.venue }}</span>
                <span class="meta-item">
                  <v-icon size="13" class="mr-1" color="#64748b">mdi-account-group-outline</v-icon>
                  {{ ms.assigned.length }} assigned
                </span>
              </div>

              <div class="assigned-preview" v-if="ms.assigned.length > 0">
                <div class="ap-avatars">
                  <div
                    v-for="(a, i) in ms.assigned.slice(0, 5)"
                    :key="a.memberId"
                    class="ap-avatar"
                    :style="{ background: avatarColor(getMember(a.memberId)?.name ?? ''), zIndex: 10 - i }"
                    :title="getMember(a.memberId)?.name"
                  >{{ initials(getMember(a.memberId)?.name ?? '?') }}</div>
                  <span v-if="ms.assigned.length > 5" class="ap-more">+{{ ms.assigned.length - 5 }}</span>
                </div>
              </div>
            </div>

            <div class="sc-footer">
              <div class="att-summary" v-if="ms.assigned.length > 0">
                <span class="att-present">
                  <span class="att-dot present" />
                  {{ presentCount(ms) }} Present
                </span>
                <span class="att-absent">
                  <span class="att-dot absent" />
                  {{ ms.assigned.length - presentCount(ms) }} Absent
                </span>
                <!-- Time-in indicator -->
                <span class="att-timein-count" v-if="timedInCount(ms) > 0">
                  <v-icon size="12" color="#7e22ce" class="mr-1">mdi-clock-check-outline</v-icon>
                  {{ timedInCount(ms) }} self-logged
                </span>
              </div>
              <div v-else class="att-summary muted">No members assigned</div>

              <div class="sc-actions">
                <button class="act-btn assign" @click="openAssignModal(ms)">
                  <v-icon size="14">mdi-account-plus-outline</v-icon>
                  <span>Assign</span>
                </button>
                <button class="act-btn attend" @click="openAttendanceModal(ms, 'mass')">
                  <v-icon size="14">mdi-clipboard-check-outline</v-icon>
                  <span>Attendance</span>
                </button>
                <button class="act-btn edit-s" @click="openMassModal(ms)">
                  <v-icon size="14">mdi-pencil-outline</v-icon>
                </button>
                <button class="act-btn del-s" @click="confirmDeleteSession(ms, 'mass')">
                  <v-icon size="14">mdi-trash-can-outline</v-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredMasses.length === 0" class="empty-state">
          <v-icon size="40" color="#cbd5e1">mdi-church</v-icon>
          <p>No mass schedules yet</p>
        </div>
      </div>
    </div>


    <!-- ══════════ MEETING SCHEDULE TAB ══════════ -->
    <div v-if="activeTab === 'meeting'">
      <div class="section-toolbar">
        <div class="search-wrap">
          <v-icon size="15" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
          <input v-model="meetSearch" class="search-input" placeholder="Search meeting…" />
        </div>
        <button class="btn-primary" @click="openMeetingModal()">
          <v-icon size="15" class="mr-1">mdi-plus</v-icon>
          New Meeting
        </button>
      </div>

      <div class="session-list">
        <div
          v-for="mt in filteredMeetings"
          :key="mt.id"
          class="session-card meeting"
          :class="{ past: isPast(mt.date), 'is-new': mt.isNew }"
        >
          <div class="sc-left meeting-left">
            <div class="date-block blue">
              <span class="db-month">{{ monthOf(mt.date) }}</span>
              <span class="db-day">{{ dayOf(mt.date) }}</span>
              <span class="db-year">{{ yearOf(mt.date) }}</span>
            </div>
          </div>

          <div class="sc-body">
            <div class="sc-top">
              <div class="sc-title-row">
                <h3 class="sc-title">{{ mt.title }}</h3>
                <span class="required-badge">{{ mt.required.length }} required</span>
              </div>
              <div class="sc-meta">
                <span class="meta-item"><v-icon size="13" class="mr-1" color="#64748b">mdi-clock-outline</v-icon>{{ mt.time }}</span>
                <span class="meta-item"><v-icon size="13" class="mr-1" color="#64748b">mdi-map-marker-outline</v-icon>{{ mt.location }}</span>
              </div>
              <p v-if="mt.agenda" class="sc-agenda">{{ mt.agenda }}</p>

              <div class="assigned-preview" v-if="mt.required.length > 0">
                <div class="ap-avatars">
                  <div
                    v-for="(memberId, i) in mt.required.slice(0, 5)"
                    :key="memberId"
                    class="ap-avatar blue"
                    :style="{ background: '#0369a1', zIndex: 10 - i }"
                    :title="getMember(memberId)?.name"
                  >{{ initials(getMember(memberId)?.name ?? '?') }}</div>
                  <span v-if="mt.required.length > 5" class="ap-more">+{{ mt.required.length - 5 }}</span>
                </div>
              </div>
            </div>

            <div class="sc-footer">
              <div class="att-summary" v-if="mt.required.length > 0">
                <span class="att-present">
                  <span class="att-dot present" />
                  {{ meetPresentCount(mt) }} Present
                </span>
                <span class="att-absent">
                  <span class="att-dot absent" />
                  {{ mt.required.length - meetPresentCount(mt) }} Absent
                </span>
                <span class="att-timein-count" v-if="meetTimedInCount(mt) > 0">
                  <v-icon size="12" color="#7e22ce" class="mr-1">mdi-clock-check-outline</v-icon>
                  {{ meetTimedInCount(mt) }} self-logged
                </span>
              </div>
              <div v-else class="att-summary muted">No required members set</div>

              <div class="sc-actions">
                <button class="act-btn attend" @click="openAttendanceModal(mt, 'meeting')">
                  <v-icon size="14">mdi-clipboard-check-outline</v-icon>
                  <span>Attendance</span>
                </button>
                <button class="act-btn edit-s" @click="openMeetingModal(mt)">
                  <v-icon size="14">mdi-pencil-outline</v-icon>
                </button>
                <button class="act-btn del-s" @click="confirmDeleteSession(mt, 'meeting')">
                  <v-icon size="14">mdi-trash-can-outline</v-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredMeetings.length === 0" class="empty-state">
          <v-icon size="40" color="#cbd5e1">mdi-account-group-outline</v-icon>
          <p>No meetings scheduled yet</p>
        </div>
      </div>
    </div>


    <!-- ══ MASS SCHEDULE MODAL ══ -->
    <transition name="modal">
      <div v-if="showMassModal" class="modal-backdrop" @click.self="showMassModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingMass ? 'Edit Mass Schedule' : 'New Mass Schedule' }}</h2>
            <button class="modal-close" @click="showMassModal = false"><v-icon size="18">mdi-close</v-icon></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field full">
                <label class="field-label">Mass Type <span class="req">*</span></label>
                <div class="select-wrap">
                  <select v-model="massForm.massType" class="f-select">
                    <option v-for="t in massTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <v-icon size="15" class="select-arrow">mdi-chevron-down</v-icon>
                </div>
              </div>
              <div class="form-field">
                <label class="field-label">Date <span class="req">*</span></label>
                <input v-model="massForm.date" type="date" class="f-input" />
              </div>
              <div class="form-field">
                <label class="field-label">Time <span class="req">*</span></label>
                <input v-model="massForm.time" type="time" class="f-input" />
              </div>
              <div class="form-field full">
                <label class="field-label">Venue</label>
                <input v-model="massForm.venue" class="f-input" placeholder="e.g. Main Altar" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showMassModal = false">Cancel</button>
            <button class="btn-save" @click="saveMass" :disabled="!massForm.date || !massForm.time">
              {{ editingMass ? 'Save Changes' : 'Create Schedule' }}
            </button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ══ ASSIGN MEMBERS MODAL ══ -->
    <transition name="modal">
      <div v-if="showAssignModal" class="modal-backdrop" @click.self="showAssignModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Assign Members</h2>
              <p class="modal-sub" v-if="assignTarget">{{ assignTarget.massType }} · {{ fmtDate(assignTarget.date) }} {{ assignTarget.time }}</p>
            </div>
            <button class="modal-close" @click="showAssignModal = false"><v-icon size="18">mdi-close</v-icon></button>
          </div>
          <div class="modal-body">
            <div class="assign-search-wrap">
              <v-icon size="14" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
              <input v-model="assignSearch" class="perm-search" placeholder="Filter members…" />
            </div>
            <div class="assign-list">
              <label
                v-for="member in filteredAssignMembers"
                :key="member.id"
                class="assign-item"
                :class="{ checked: assignForm.includes(member.id) }"
              >
                <input type="checkbox" :value="member.id" v-model="assignForm" class="cb" />
                <div class="avatar sm" :style="{ background: avatarColor(member.name) }">{{ initials(member.name) }}</div>
                <div class="assign-info">
                  <span class="assign-name">{{ member.name }}</span>
                  <span class="role-badge sm" :class="member.role.toLowerCase()">{{ member.role }}</span>
                </div>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <span class="assign-hint">{{ assignForm.length }} member(s) selected</span>
            <button class="btn-cancel" @click="showAssignModal = false">Cancel</button>
            <button class="btn-save" @click="saveAssign">Save Assignment</button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ══ MEETING MODAL ══ -->
    <transition name="modal">
      <div v-if="showMeetingModal" class="modal-backdrop" @click.self="showMeetingModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingMeeting ? 'Edit Meeting' : 'New Meeting' }}</h2>
            <button class="modal-close" @click="showMeetingModal = false"><v-icon size="18">mdi-close</v-icon></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field full">
                <label class="field-label">Meeting Title <span class="req">*</span></label>
                <input v-model="meetForm.title" class="f-input" placeholder="e.g. Monthly Coordinator Meeting" />
              </div>
              <div class="form-field">
                <label class="field-label">Date <span class="req">*</span></label>
                <input v-model="meetForm.date" type="date" class="f-input" />
              </div>
              <div class="form-field">
                <label class="field-label">Time <span class="req">*</span></label>
                <input v-model="meetForm.time" type="time" class="f-input" />
              </div>
              <div class="form-field full">
                <label class="field-label">Location</label>
                <input v-model="meetForm.location" class="f-input" placeholder="e.g. Parish Hall" />
              </div>
              <div class="form-field full">
                <label class="field-label">Agenda / Notes</label>
                <textarea v-model="meetForm.agenda" class="f-textarea" rows="2" placeholder="Brief agenda or notes…" />
              </div>
              <div class="form-field full">
                <label class="field-label">Required Members</label>
                <div class="assign-search-wrap">
                  <v-icon size="14" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
                  <input v-model="meetMemberSearch" class="perm-search" placeholder="Filter members…" />
                </div>
                <div class="assign-list compact">
                  <label
                    v-for="member in filteredMeetMembers"
                    :key="member.id"
                    class="assign-item"
                    :class="{ checked: meetForm.required.includes(member.id) }"
                  >
                    <input type="checkbox" :value="member.id" v-model="meetForm.required" class="cb" />
                    <div class="avatar sm" :style="{ background: avatarColor(member.name) }">{{ initials(member.name) }}</div>
                    <div class="assign-info">
                      <span class="assign-name">{{ member.name }}</span>
                      <span class="role-badge sm" :class="member.role.toLowerCase()">{{ member.role }}</span>
                    </div>
                  </label>
                </div>
                <p class="field-hint">{{ meetForm.required.length }} member(s) required to attend</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showMeetingModal = false">Cancel</button>
            <button class="btn-save" @click="saveMeeting" :disabled="!meetForm.title.trim() || !meetForm.date">
              {{ editingMeeting ? 'Save Changes' : 'Create Meeting' }}
            </button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ══ ATTENDANCE MODAL (ENHANCED) ══ -->
    <transition name="modal">
      <div v-if="showAttModal" class="modal-backdrop" @click.self="showAttModal = false">
        <div class="modal modal-xl">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Attendance Log</h2>
              <p class="modal-sub" v-if="attSession">
                {{ attSession.massType ?? attSession.title }} ·
                {{ fmtDate(attSession.date) }} ·
                {{ attSession.time }}
                <span v-if="attSession.venue ?? attSession.location">
                  · {{ attSession.venue ?? attSession.location }}
                </span>
              </p>
            </div>
            <button class="modal-close" @click="showAttModal = false"><v-icon size="18">mdi-close</v-icon></button>
          </div>

          <div class="modal-body">

            <!-- Summary bar -->
            <div class="att-summary-bar">
              <div class="summary-pill present-pill">
                <span class="att-dot present" />
                <strong>{{ attPresentCount }}</strong> Present
              </div>
              <div class="summary-pill absent-pill">
                <span class="att-dot absent" />
                <strong>{{ attMembers.length - attPresentCount }}</strong> Absent
              </div>
              <div class="summary-pill timein-pill" v-if="attSelfLoggedCount > 0">
                <v-icon size="13" color="#7e22ce" class="mr-1">mdi-clock-check-outline</v-icon>
                <strong>{{ attSelfLoggedCount }}</strong> Self-logged
              </div>
              <div class="summary-spacer" />
              <!-- Quick mark all -->
              <button class="quick-btn present-all" @click="markAll('present')">
                <v-icon size="13" class="mr-1">mdi-check-all</v-icon>All Present
              </button>
              <button class="quick-btn absent-all" @click="markAll('absent')">
                <v-icon size="13" class="mr-1">mdi-close</v-icon>All Absent
              </button>
            </div>

            <!-- Member attendance rows -->
            <div class="att-log-list">
              <div
                v-for="item in attMembers"
                :key="item.memberId"
                class="att-log-row"
                :class="item.status"
              >
                <!-- Left: avatar + name + role -->
                <div class="alr-member">
                  <div class="avatar sm" :style="{ background: avatarColor(getMember(item.memberId)?.name ?? '') }">
                    {{ initials(getMember(item.memberId)?.name ?? '?') }}
                  </div>
                  <div class="alr-info">
                    <span class="alr-name">{{ getMember(item.memberId)?.name }}</span>
                    <span class="role-badge sm" :class="getMember(item.memberId)?.role.toLowerCase()">
                      {{ getMember(item.memberId)?.role }}
                    </span>
                  </div>
                </div>

                <!-- Center: Time-in log -->
                <div class="alr-timelog">
                  <div v-if="item.timeInStamp" class="timelog-chip">
                    <v-icon size="13" color="#7e22ce" class="mr-1">mdi-clock-check-outline</v-icon>
                    <span class="timelog-label">Timed in</span>
                    <strong class="timelog-time">{{ item.timeInStamp }}</strong>
                  </div>
                  <div v-else class="timelog-none">
                    <v-icon size="13" color="#cbd5e1" class="mr-1">mdi-clock-outline</v-icon>
                    <span>No time-in recorded</span>
                  </div>
                </div>

                <!-- Center: Selfie -->
                <div class="alr-selfie-col">
                  <template v-if="item.selfie">
                    <img
                      :src="item.selfie"
                      class="alr-selfie"
                      alt="selfie"
                      :title="`${getMember(item.memberId)?.name}'s selfie`"
                      @click="openLightbox(item)"
                    />
                    <span class="selfie-badge">
                      <v-icon size="10" color="#15803d">mdi-check</v-icon>
                      Photo
                    </span>
                  </template>
                  <div v-else class="alr-no-selfie">
                    <v-icon size="18" color="#e2e8f0">mdi-camera-off-outline</v-icon>
                  </div>
                </div>

                <!-- Right: Present/Absent toggle -->
                <div class="att-toggle">
                  <button
                    class="att-opt"
                    :class="{ active: item.status === 'present' }"
                    @click="item.status = 'present'"
                  >
                    <v-icon size="13">mdi-check</v-icon>
                    Present
                  </button>
                  <button
                    class="att-opt absent-opt"
                    :class="{ active: item.status === 'absent' }"
                    @click="item.status = 'absent'"
                  >
                    <v-icon size="13">mdi-close</v-icon>
                    Absent
                  </button>
                </div>
              </div>

              <div v-if="attMembers.length === 0" class="no-data">
                No members assigned to this session
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showAttModal = false">Cancel</button>
            <button class="btn-save" @click="saveAttendance">Save Attendance</button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ══ SELFIE LIGHTBOX ══ -->
    <transition name="modal">
      <div v-if="lightboxItem" class="lightbox-backdrop" @click="lightboxItem = null">
        <div class="lightbox-card" @click.stop>
          <button class="lightbox-close" @click="lightboxItem = null">
            <v-icon size="20" color="white">mdi-close</v-icon>
          </button>
          <img :src="lightboxItem.selfie" class="lightbox-img" alt="selfie" />
          <div class="lightbox-meta">
            <div class="lb-avatar" :style="{ background: avatarColor(getMember(lightboxItem.memberId)?.name ?? '') }">
              {{ initials(getMember(lightboxItem.memberId)?.name ?? '?') }}
            </div>
            <div>
              <p class="lb-name">{{ getMember(lightboxItem.memberId)?.name }}</p>
              <p class="lb-time" v-if="lightboxItem.timeInStamp">
                <v-icon size="13" color="#94a3b8" class="mr-1">mdi-clock-outline</v-icon>
                Timed in at {{ lightboxItem.timeInStamp }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </transition>


    <!-- ══ DELETE CONFIRM ══ -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal modal-sm">
          <div class="del-icon-wrap">
            <v-icon size="28" color="#ef4444">mdi-trash-can-outline</v-icon>
          </div>
          <h2 class="modal-title">Delete Session</h2>
          <p class="del-msg">This will permanently remove the schedule and all attendance records.</p>
          <div class="modal-footer centered">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-delete" @click="deleteSession">Delete</button>
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

/* ── Members ─────────────────────────────────────── */
const members = ref([
  { id: 1, name: "Maria Santos",    role: "Lector",        email: "m.santos@sjb.org" },
  { id: 2, name: "Jose Reyes",      role: "Commentator",   email: "j.reyes@sjb.org" },
  { id: 3, name: "Ana Cruz",        role: "Coordinator",   email: "a.cruz@sjb.org" },
  { id: 4, name: "Pedro Dela Cruz", role: "Administrator", email: "p.delacruz@sjb.org" },
  { id: 5, name: "Luisa Garcia",    role: "Lector",        email: "l.garcia@sjb.org" },
  { id: 6, name: "Carlos Bautista", role: "Commentator",   email: "c.bautista@sjb.org" },
  { id: 7, name: "Rosa Mendoza",    role: "Lector",        email: "r.mendoza@sjb.org" },
]);

const getMember = (id) => members.value.find(m => m.id === id);

/* ── Helpers ─────────────────────────────────────── */
const palette     = ["#0369a1","#0891b2","#0c4a6e","#0e7490","#075985","#155e75","#164e63"];
const avatarColor = (name) => palette[(name?.charCodeAt(0) ?? 0) % palette.length];
const initials    = (name) => (name ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const monthOf     = (d) => new Date(d).toLocaleDateString("en-US", { month: "short" });
const dayOf       = (d) => new Date(d).getDate();
const yearOf      = (d) => new Date(d).getFullYear();
const fmtDate     = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const isPast      = (d) => new Date(d) < new Date();

/* ── Tabs ────────────────────────────────────────── */
const activeTab = ref("mass");

/* ══════════════ MASS SCHEDULES ══════════════ */
const massTypes = ["Sunday Mass", "Weekday Mass", "Feast Day Mass", "Special Mass", "Anticipated Mass"];

// NOTE: assigned entries now have { memberId, status, timeInStamp, selfie }
// so the secretary sees what the member submitted from the Time-In portal.
const masses = ref([
  {
    id: 1, massType: "Sunday Mass", date: "2025-03-09", time: "08:00", venue: "Main Altar",
    assigned: [
      { memberId: 1, status: "present", timeInStamp: "7:52 AM", selfie: null },
      { memberId: 2, status: "present", timeInStamp: "7:58 AM", selfie: null },
      { memberId: 5, status: "absent",  timeInStamp: null,       selfie: null },
    ],
    isNew: false,
  },
  {
    id: 2, massType: "Sunday Mass", date: "2025-03-09", time: "10:00", venue: "Main Altar",
    assigned: [
      { memberId: 6, status: "present", timeInStamp: "9:55 AM", selfie: null },
      { memberId: 7, status: "present", timeInStamp: "9:57 AM", selfie: null },
    ],
    isNew: false,
  },
  {
    id: 3, massType: "Weekday Mass", date: "2025-03-12", time: "06:00", venue: "Side Chapel",
    assigned: [
      { memberId: 3, status: null, timeInStamp: null, selfie: null },
    ],
    isNew: false,
  },
  {
    id: 4, massType: "Feast Day Mass", date: "2025-03-19", time: "09:00", venue: "Main Altar",
    assigned: [],
    isNew: false,
  },
]);

const massSearch = ref("");
const filteredMasses = computed(() =>
  masses.value.filter(m =>
    !massSearch.value ||
    m.massType.toLowerCase().includes(massSearch.value.toLowerCase()) ||
    m.venue.toLowerCase().includes(massSearch.value.toLowerCase())
  ).sort((a, b) => new Date(a.date) - new Date(b.date))
);

const presentCount    = (ms) => ms.assigned.filter(a => a.status === "present").length;
const timedInCount    = (ms) => ms.assigned.filter(a => a.timeInStamp).length;

const meetPresentCount  = (mt) => (mt.attendance ?? []).filter(a => a.status === "present").length;
const meetTimedInCount  = (mt) => (mt.attendance ?? []).filter(a => a.timeInStamp).length;

/* Mass modal */
const showMassModal = ref(false);
const editingMass   = ref(null);
const massForm      = ref({ massType: "Sunday Mass", date: "", time: "", venue: "" });

const openMassModal = (ms = null) => {
  editingMass.value = ms;
  massForm.value = ms
    ? { massType: ms.massType, date: ms.date, time: ms.time, venue: ms.venue }
    : { massType: "Sunday Mass", date: "", time: "", venue: "Main Altar" };
  showMassModal.value = true;
};

const saveMass = () => {
  if (!massForm.value.date || !massForm.value.time) return;
  if (editingMass.value) {
    Object.assign(editingMass.value, { ...massForm.value });
  } else {
    masses.value.push({ id: Date.now(), ...massForm.value, assigned: [], isNew: true });
    setTimeout(() => { const m = masses.value.find(m => m.isNew); if (m) m.isNew = false; }, 2000);
  }
  showMassModal.value = false;
};

/* Assign modal */
const showAssignModal = ref(false);
const assignTarget    = ref(null);
const assignForm      = ref([]);
const assignSearch    = ref("");

const filteredAssignMembers = computed(() =>
  members.value.filter(m =>
    !assignSearch.value || m.name.toLowerCase().includes(assignSearch.value.toLowerCase())
  )
);

const openAssignModal = (ms) => {
  assignTarget.value    = ms;
  assignForm.value      = ms.assigned.map(a => a.memberId);
  assignSearch.value    = "";
  showAssignModal.value = true;
};

const saveAssign = () => {
  if (!assignTarget.value) return;
  const existing = assignTarget.value.assigned;
  assignTarget.value.assigned = assignForm.value.map(id => {
    const ex = existing.find(a => a.memberId === id);
    return ex ?? { memberId: id, status: null, timeInStamp: null, selfie: null };
  });
  showAssignModal.value = false;
};

/* ══════════════ MEETINGS ══════════════ */
const meetings = ref([
  {
    id: 1, title: "Monthly Coordinator Meeting", date: "2025-03-15",
    time: "09:00", location: "Parish Hall", agenda: "Review Q1 schedule, budget updates",
    required: [3, 4],
    attendance: [
      { memberId: 3, status: "present", timeInStamp: "8:58 AM", selfie: null },
      { memberId: 4, status: "present", timeInStamp: "9:01 AM", selfie: null },
    ],
    isNew: false,
  },
  {
    id: 2, title: "Formation Seminar", date: "2025-03-22",
    time: "14:00", location: "Parish Hall", agenda: "Annual formation for all active members",
    required: [1, 2, 5, 6, 7],
    attendance: [],
    isNew: false,
  },
]);

const meetSearch = ref("");
const filteredMeetings = computed(() =>
  meetings.value.filter(m =>
    !meetSearch.value ||
    m.title.toLowerCase().includes(meetSearch.value.toLowerCase()) ||
    m.location.toLowerCase().includes(meetSearch.value.toLowerCase())
  ).sort((a, b) => new Date(a.date) - new Date(b.date))
);

const showMeetingModal = ref(false);
const editingMeeting   = ref(null);
const meetMemberSearch = ref("");
const meetForm = ref({ title: "", date: "", time: "", location: "", agenda: "", required: [] });

const filteredMeetMembers = computed(() =>
  members.value.filter(m =>
    !meetMemberSearch.value || m.name.toLowerCase().includes(meetMemberSearch.value.toLowerCase())
  )
);

const openMeetingModal = (mt = null) => {
  editingMeeting.value   = mt;
  meetMemberSearch.value = "";
  meetForm.value = mt
    ? { title: mt.title, date: mt.date, time: mt.time, location: mt.location, agenda: mt.agenda, required: [...mt.required] }
    : { title: "", date: "", time: "", location: "Parish Hall", agenda: "", required: [] };
  showMeetingModal.value = true;
};

const saveMeeting = () => {
  if (!meetForm.value.title.trim() || !meetForm.value.date) return;
  if (editingMeeting.value) {
    Object.assign(editingMeeting.value, { ...meetForm.value });
  } else {
    meetings.value.push({ id: Date.now(), ...meetForm.value, attendance: [], isNew: true });
    setTimeout(() => { const m = meetings.value.find(m => m.isNew); if (m) m.isNew = false; }, 2000);
  }
  showMeetingModal.value = false;
};

/* ══════════════ ATTENDANCE MODAL ══════════════ */
const showAttModal = ref(false);
const attSession   = ref(null);
const attType      = ref("mass");
const attMembers   = ref([]);

const attPresentCount   = computed(() => attMembers.value.filter(a => a.status === "present").length);
const attSelfLoggedCount = computed(() => attMembers.value.filter(a => a.timeInStamp).length);

const openAttendanceModal = (session, type) => {
  attSession.value = session;
  attType.value    = type;

  if (type === "mass") {
    // Preserve timeInStamp and selfie from member time-in portal
    attMembers.value = session.assigned.map(a => ({ ...a }));
  } else {
    const existing = session.attendance ?? [];
    attMembers.value = session.required.map(id => {
      const ex = existing.find(a => a.memberId === id);
      return ex
        ? { ...ex }
        : { memberId: id, status: null, timeInStamp: null, selfie: null };
    });
  }
  showAttModal.value = true;
};

const markAll = (status) => { attMembers.value.forEach(a => a.status = status); };

const saveAttendance = () => {
  if (!attSession.value) return;
  if (attType.value === "mass") {
    attSession.value.assigned = attMembers.value.map(a => ({ ...a }));
  } else {
    attSession.value.attendance = attMembers.value.map(a => ({ ...a }));
  }
  showAttModal.value = false;
};

/* ══════════════ SELFIE LIGHTBOX ══════════════ */
const lightboxItem = ref(null);
const openLightbox = (item) => { lightboxItem.value = item; };

/* ══════════════ DELETE ══════════════ */
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);
const deleteType      = ref("mass");

const confirmDeleteSession = (session, type) => {
  deleteTarget.value    = session;
  deleteType.value      = type;
  showDeleteModal.value = true;
};

const deleteSession = () => {
  if (deleteType.value === "mass") {
    masses.value = masses.value.filter(m => m.id !== deleteTarget.value.id);
  } else {
    meetings.value = meetings.value.filter(m => m.id !== deleteTarget.value.id);
  }
  showDeleteModal.value = false;
};

/* ── Tabs ─────────────────────────────────────────── */
const tabs = computed(() => [
  { value: "mass",    label: "Mass Schedule",    icon: "mdi-church",               count: masses.value.length },
  { value: "meeting", label: "Meeting Schedule", icon: "mdi-account-group-outline", count: meetings.value.length },
]);
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.att-page { font-family: "DM Sans", sans-serif; color: #0f172a; }

/* ── Header ── */
.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; gap: 12px;
}
.page-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.55rem; font-weight: 400; color: #0f172a; margin: 0;
}
.page-sub { font-size: 0.78rem; color: #94a3b8; margin: 3px 0 0; }

/* ── Tabs ── */
.tab-bar {
  display: flex; gap: 4px; margin-bottom: 20px;
  background: #f1f5f9; padding: 4px; border-radius: 12px; width: fit-content;
}
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border: none; border-radius: 9px;
  background: transparent; color: #64748b;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.tab-btn.active { background: white; color: #0f172a; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.tab-count {
  background: #e2e8f0; color: #64748b; font-size: 0.68rem; font-weight: 700;
  padding: 1px 6px; border-radius: 10px; min-width: 20px; text-align: center;
}
.tab-btn.active .tab-count { background: #dbeafe; color: #0369a1; }

/* ── Toolbar ── */
.section-toolbar { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 180px; display: flex; align-items: center; }
.search-icon { position: absolute; left: 11px; pointer-events: none; }
.search-input {
  width: 100%; padding: 8px 12px 8px 32px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: white; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus { border-color: #0369a1; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.search-input::placeholder { color: #cbd5e1; }

.btn-primary {
  display: flex; align-items: center; gap: 4px;
  padding: 9px 18px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1); color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 12px rgba(3,105,161,0.28);
  transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Session cards ── */
.session-list { display: flex; flex-direction: column; gap: 12px; }
.session-card {
  background: white; border-radius: 14px; border: 1px solid #e2e8f0;
  display: flex; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s, transform 0.1s;
}
.session-card:hover { box-shadow: 0 4px 16px rgba(3,105,161,0.09); transform: translateY(-1px); }
.session-card.past { opacity: 0.55; }
.session-card.is-new { animation: flash-border 2s ease-out; }
@keyframes flash-border {
  0%   { box-shadow: 0 0 0 3px rgba(59,130,246,0.35); }
  100% { box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
}

.sc-left {
  width: 72px; min-width: 72px;
  background: linear-gradient(160deg, #0c4a6e, #0369a1);
  display: flex; align-items: center; justify-content: center;
}
.meeting-left { background: linear-gradient(160deg, #1e3a5f, #0369a1); }
.date-block { display: flex; flex-direction: column; align-items: center; color: white; text-align: center; }
.db-month { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.8; }
.db-day   { font-size: 2rem; font-weight: 700; line-height: 1; }
.db-year  { font-size: 0.6rem; opacity: 0.6; }

.sc-body { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.sc-top  { display: flex; flex-direction: column; gap: 6px; }
.sc-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sc-title { font-family: "DM Serif Display", serif; font-size: 1rem; font-weight: 400; color: #0f172a; margin: 0; }

.mass-type-badge {
  font-size: 0.65rem; font-weight: 700; padding: 2px 9px; border-radius: 20px;
  letter-spacing: 0.04em; text-transform: uppercase;
  background: #eff6ff; color: #0369a1; border: 1px solid #bae6fd;
}
.required-badge {
  font-size: 0.68rem; font-weight: 700; padding: 2px 9px; border-radius: 20px;
  background: #fdf4ff; color: #7e22ce; border: 1px solid #e9d5ff;
}

.sc-meta { display: flex; gap: 14px; flex-wrap: wrap; }
.meta-item { display: flex; align-items: center; font-size: 0.78rem; color: #64748b; }
.sc-agenda { font-size: 0.78rem; color: #94a3b8; margin: 0; line-height: 1.5; }

.assigned-preview { margin-top: 4px; }
.ap-avatars { display: flex; align-items: center; }
.ap-avatar {
  width: 26px; height: 26px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.58rem; font-weight: 700; color: white;
  border: 2px solid white; margin-right: -6px; flex-shrink: 0;
}
.ap-more { font-size: 0.72rem; color: #94a3b8; margin-left: 10px; }

.sc-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.att-summary { display: flex; gap: 14px; align-items: center; font-size: 0.78rem; }
.att-summary.muted { color: #cbd5e1; font-style: italic; }
.att-present, .att-absent { display: flex; align-items: center; gap: 5px; font-weight: 500; }
.att-present { color: #15803d; }
.att-absent  { color: #dc2626; }
.att-dot { width: 8px; height: 8px; border-radius: 50%; }
.att-dot.present { background: #22c55e; }
.att-dot.absent  { background: #ef4444; }
.att-timein-count { display: flex; align-items: center; font-size: 0.72rem; color: #7e22ce; font-weight: 600; }

.sc-actions { display: flex; gap: 5px; flex-wrap: wrap; }
.act-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; background: white;
  font-size: 0.75rem; font-weight: 600; cursor: pointer;
  font-family: "DM Sans", sans-serif; color: #64748b; transition: all 0.15s;
}
.act-btn.assign:hover { border-color: #7e22ce; background: #fdf4ff; color: #7e22ce; }
.act-btn.attend:hover { border-color: #0369a1; background: #eff6ff; color: #0369a1; }
.act-btn.edit-s:hover { border-color: #0369a1; background: #eff6ff; color: #0369a1; }
.act-btn.del-s:hover  { border-color: #ef4444; background: #fef2f2; color: #ef4444; }

.empty-state {
  text-align: center; padding: 48px; color: #94a3b8;
  background: white; border-radius: 14px; border: 1px dashed #e2e8f0;
}
.empty-state p { margin: 12px 0 0; font-size: 0.875rem; }

/* ── Modal base ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
}
.modal-lg  { max-width: 560px; }
.modal-xl  { max-width: 680px; }
.modal-sm  { max-width: 380px; padding: 28px 24px; text-align: center; }

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; background: white; z-index: 2;
}
.modal-title { font-family: "DM Serif Display", serif; font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0; }
.modal-sub   { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex; flex-shrink: 0; transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
  position: sticky; bottom: 0; background: white;
}
.modal-footer.centered { justify-content: center; border-top: none; padding-top: 0; }

/* ── Attendance Modal — enhanced ── */
.att-summary-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px;
  padding: 10px 14px;
}
.summary-pill {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 600; padding: 4px 12px;
  border-radius: 20px;
}
.present-pill { background: #f0fdf4; color: #15803d; }
.absent-pill  { background: #fef2f2; color: #dc2626; }
.timein-pill  { background: #fdf4ff; color: #7e22ce; }
.summary-spacer { flex: 1; }

.quick-btn {
  display: flex; align-items: center;
  padding: 5px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0;
  background: white; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; font-family: "DM Sans", sans-serif;
  transition: all 0.15s; color: #475569;
}
.quick-btn.present-all:hover { border-color: #22c55e; background: #f0fdf4; color: #15803d; }
.quick-btn.absent-all:hover  { border-color: #ef4444; background: #fef2f2; color: #dc2626; }

/* Attendance log rows */
.att-log-list { display: flex; flex-direction: column; gap: 8px; }

.att-log-row {
  display: grid;
  grid-template-columns: 1fr 160px 64px auto;
  align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px;
  border: 1.5px solid #f1f5f9; background: white;
  transition: background 0.1s, border-color 0.1s;
}
.att-log-row.present { background: #f0fdf4; border-color: #bbf7d0; }
.att-log-row.absent  { background: #fef2f2; border-color: #fecaca; }

/* Member info */
.alr-member { display: flex; align-items: center; gap: 10px; min-width: 0; }
.alr-info   { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.alr-name   { font-size: 0.875rem; font-weight: 600; color: #0f172a; white-space: nowrap; }

/* Time-in log */
.alr-timelog { display: flex; align-items: center; }
.timelog-chip {
  display: flex; align-items: center; gap: 4px;
  background: #fdf4ff; border: 1px solid #e9d5ff;
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.72rem; color: #7e22ce;
}
.timelog-label { color: #9333ea; }
.timelog-time  { font-weight: 700; color: #6b21a8; }
.timelog-none  {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: #cbd5e1; font-style: italic;
}

/* Selfie column */
.alr-selfie-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.alr-selfie {
  width: 44px; height: 44px; border-radius: 10px;
  object-fit: cover; border: 2px solid #bbf7d0;
  cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.alr-selfie:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,0,0,0.18); }
.selfie-badge {
  display: flex; align-items: center; gap: 2px;
  font-size: 0.6rem; font-weight: 700; color: #15803d;
  background: #dcfce7; border-radius: 20px; padding: 1px 5px;
}
.alr-no-selfie {
  width: 44px; height: 44px; border-radius: 10px;
  background: #f1f5f9; border: 1.5px dashed #e2e8f0;
  display: flex; align-items: center; justify-content: center;
}

/* Toggle */
.att-toggle { display: flex; gap: 4px; flex-shrink: 0; }
.att-opt {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 11px; border-radius: 7px;
  border: 1.5px solid #e2e8f0; background: white;
  font-size: 0.72rem; font-weight: 600; cursor: pointer;
  font-family: "DM Sans", sans-serif; color: #94a3b8; transition: all 0.15s;
}
.att-opt.active            { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.att-opt.absent-opt.active { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.no-data { text-align: center; padding: 20px; font-size: 0.82rem; color: #cbd5e1; font-style: italic; }

/* ── Selfie Lightbox ── */
.lightbox-backdrop {
  position: fixed; inset: 0; z-index: 1200;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.lightbox-card {
  background: #0f172a; border-radius: 18px; overflow: hidden;
  max-width: 380px; width: 100%; position: relative;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
}
.lightbox-close {
  position: absolute; top: 12px; right: 12px; z-index: 2;
  background: rgba(0,0,0,0.5); border: none; border-radius: 50%;
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s;
}
.lightbox-close:hover { background: rgba(0,0,0,0.8); }
.lightbox-img {
  width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;
  transform: scaleX(-1);
}
.lightbox-meta {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; background: #0f172a;
}
.lb-avatar {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: white;
}
.lb-name { font-size: 0.9rem; font-weight: 600; color: white; margin: 0 0 2px; }
.lb-time { font-size: 0.72rem; color: #94a3b8; margin: 0; display: flex; align-items: center; }

/* ── Form styles ── */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field.full { grid-column: 1 / -1; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #334155; }
.req { color: #ef4444; }
.field-hint { font-size: 0.72rem; color: #94a3b8; margin-top: 2px; }
.f-input, .f-textarea {
  width: 100%; padding: 10px 13px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.f-input:focus, .f-textarea:focus { border-color: #0369a1; background: white; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.f-input::placeholder, .f-textarea::placeholder { color: #cbd5e1; }
.f-textarea { resize: vertical; min-height: 72px; }
.select-wrap { position: relative; }
.f-select {
  width: 100%; padding: 10px 32px 10px 13px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; appearance: none; cursor: pointer; transition: border-color 0.15s;
}
.f-select:focus { border-color: #0369a1; }
.select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

/* Assign list */
.assign-search-wrap { position: relative; display: flex; align-items: center; }
.perm-search {
  width: 100%; padding: 7px 12px 7px 30px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 0.82rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; transition: border-color 0.15s;
}
.perm-search:focus { border-color: #0369a1; }
.perm-search::placeholder { color: #cbd5e1; }
.assign-list {
  max-height: 280px; overflow-y: auto; border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 5px; display: flex; flex-direction: column; gap: 2px; margin-top: 8px;
}
.assign-list.compact { max-height: 200px; }
.assign-list::-webkit-scrollbar { width: 4px; }
.assign-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.assign-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-radius: 7px; cursor: pointer; transition: background 0.1s;
}
.assign-item:hover { background: #f8fafc; }
.assign-item.checked { background: #eff6ff; }
.cb { width: 15px; height: 15px; accent-color: #0369a1; cursor: pointer; flex-shrink: 0; }

.avatar { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: white; flex-shrink: 0; }
.avatar.sm { width: 26px; height: 26px; border-radius: 7px; font-size: 0.6rem; }
.assign-info { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
.assign-name { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
.assign-hint { flex: 1; font-size: 0.78rem; color: #94a3b8; }

.role-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 700; white-space: nowrap; }
.role-badge.lector        { background: #eff6ff; color: #1d4ed8; }
.role-badge.commentator   { background: #f0fdf4; color: #15803d; }
.role-badge.coordinator   { background: #fefce8; color: #a16207; }
.role-badge.administrator { background: #fdf4ff; color: #7e22ce; }
.role-badge.sm { font-size: 0.62rem; padding: 1px 6px; }

/* Buttons */
.btn-cancel {
  padding: 8px 18px; border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: white; font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  color: #475569; cursor: pointer; transition: border-color 0.15s;
}
.btn-cancel:hover { border-color: #94a3b8; }
.btn-save {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 20px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1); color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 12px rgba(3,105,161,0.25); transition: opacity 0.15s;
}
.btn-save:hover:not(:disabled) { opacity: 0.9; }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

.del-icon-wrap {
  width: 56px; height: 56px; border-radius: 50%; background: #fef2f2; border: 2px solid #fecaca;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
}
.del-msg { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin: 8px 0 20px; }
.btn-delete {
  padding: 8px 20px; border: none; border-radius: 9px; background: #ef4444; color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-delete:hover { opacity: 0.88; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
.modal-enter-active .lightbox-card, .modal-leave-active .lightbox-card { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .lightbox-card, .modal-leave-to .lightbox-card { transform: scale(0.9); opacity: 0; }
</style>