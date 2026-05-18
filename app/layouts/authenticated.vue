<template>
  <v-app class="app-bg">
    <v-layout>

      <!-- SIDEBAR -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail && !isMobile"
        :temporary="isMobile"
        color="#0c4a6e"
        theme="dark"
        class="sidebar"
      >
        <!-- Logo / Toggle -->
        <div
          class="sidebar-logo"
          :class="{ 'rail-logo': rail && !isMobile }"
          @click.stop="isMobile ? null : (rail = !rail)"
        >
          <div class="logo-mark">
            <v-icon color="white" size="20">mdi-church</v-icon>
            <v-icon v-if="!isMobile" class="toggle-arrow" size="14" color="rgba(255,255,255,0.7)">
              {{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
            </v-icon>
          </div>
          <transition name="fade">
            <span v-if="!rail || isMobile" class="logo-label">SJB Parish</span>
          </transition>
        </div>

        <v-divider class="sidebar-divider" />

        <!-- Navigation -->
        <v-list density="comfortable" nav class="nav-list mt-1" style="overflow-y: auto; overflow-x: hidden; max-height: calc(100vh - 80px);">
          <template v-for="item in sidebar" :key="item.name">

            <!-- Item WITH sub-menu -->
            <template v-if="item.children">
              <!-- Rail mode: show as normal item with tooltip -->
              <v-tooltip v-if="rail && !isMobile" location="right" :text="item.name">
                <template #activator="{ props: tooltipProps }">
                  <v-list-item
                    v-bind="tooltipProps"
                    :prepend-icon="item.icon"
                    rounded="lg"
                    class="nav-item"
                    @click.stop="rail = false"
                  />
                </template>
              </v-tooltip>

              <!-- Expanded mode: collapsible group -->
              <v-list-group v-else :value="item.name" class="nav-group">
                <template #activator="{ props: groupProps }">
                  <v-list-item
                    v-bind="groupProps"
                    :prepend-icon="item.icon"
                    :title="item.name"
                    rounded="lg"
                    class="nav-item nav-parent"
                  />
                </template>

                <v-list-item
                  v-for="child in item.children"
                  :key="child.name"
                  :prepend-icon="child.icon"
                  :title="child.name"
                  :to="child.to"
                  rounded="lg"
                  color="white"
                  class="nav-item nav-child"
                  @click="isMobile ? drawer = false : null"
                />
              </v-list-group>
            </template>

            <!-- Regular item (no children) -->
            <template v-else>
              <v-tooltip v-if="rail && !isMobile" location="right" :text="item.name">
                <template #activator="{ props: tooltipProps }">
                  <v-list-item
                    v-bind="tooltipProps"
                    :prepend-icon="item.icon"
                    :to="item.to"
                    rounded="lg"
                    color="white"
                    class="nav-item"
                    @click="isMobile ? drawer = false : null"
                  />
                </template>
              </v-tooltip>

              <v-list-item
                v-else
                :prepend-icon="item.icon"
                :title="item.name"
                :to="item.to"
                rounded="lg"
                color="white"
                class="nav-item"
                @click="isMobile ? drawer = false : null"
              />
            </template>

          </template>
        </v-list>

      </v-navigation-drawer>


      <!-- HEADER (must be direct child of v-layout) -->
      <v-app-bar flat :height="isMobile ? 60 : 72" color="white" class="header" scroll-target="#main-scroll">
        <div class="header-inner">

          <v-btn
            v-if="isMobile"
            icon variant="text"
            color="#0369a1"
            class="mr-2"
            @click="drawer = !drawer"
          >
            <v-icon>mdi-menu</v-icon>
          </v-btn>

          <div class="header-title-block">
            <h1 class="header-title">
              <span v-if="!isMobile">Lectors &amp; Commentators Ministry</span>
              <span v-else>LCM</span>
            </h1>
            <p v-if="!isMobile" class="header-subtitle">
              <v-icon size="13" color="#0284c7" class="mr-1">mdi-map-marker</v-icon>
              Saint John Bosco Parish · Tondo, Manila
            </p>
          </div>

          <v-spacer />

          <div class="header-actions">
            <!-- Notification Bell with Dropdown -->
            <v-menu v-model="notifMenu" location="bottom end" :offset="[0, 8]" transition="scale-transition" :close-on-content-click="false">
              <template #activator="{ props: notifProps }">
                <v-btn icon variant="text" color="#64748b" v-bind="notifProps">
                  <v-icon>mdi-bell-outline</v-icon>
                  <v-badge color="#0284c7" content="3" floating />
                </v-btn>
              </template>

              <v-card class="notif-card" elevation="4" rounded="xl" width="320">
                <div class="notif-header">
                  <span class="notif-title">Notifications</span>
                  <v-chip size="x-small" color="#0284c7" class="notif-count-chip">3 new</v-chip>
                </div>
                <v-divider />
                <v-list density="compact" class="notif-list" style="max-height: 280px; overflow-y: auto;">
                  <v-list-item
                    v-for="notif in notifications"
                    :key="notif.id"
                    rounded="lg"
                    class="notif-item"
                    :class="{ 'notif-unread': !notif.read }"
                  >
                    <template #prepend>
                      <v-avatar size="36" :color="notif.iconBg" class="notif-avatar">
                        <v-icon size="18" :color="notif.iconColor">{{ notif.icon }}</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="notif-item-title">{{ notif.title }}</v-list-item-title>
                    <v-list-item-subtitle class="notif-item-sub">{{ notif.message }}</v-list-item-subtitle>
                    <template #append>
                      <span class="notif-time">{{ notif.time }}</span>
                    </template>
                  </v-list-item>
                </v-list>
                <v-divider />
                <div class="notif-footer">
                  <v-btn variant="text" color="#0284c7" size="small" block class="notif-view-all">
                    View all notifications
                  </v-btn>
                </div>
              </v-card>
            </v-menu>

            <v-menu v-model="profileMenu" location="bottom end" :offset="[0, 8]" transition="scale-transition">
              <template #activator="{ props }">
                <v-avatar v-if="isMobile" size="34" class="header-avatar ml-1" v-bind="props" style="cursor:pointer">
                  <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="John Leider" />
                </v-avatar>
                <div v-else class="profile-chip" v-bind="props">
                  <v-avatar size="34" class="header-avatar">
                    <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="John Leider" />
                  </v-avatar>
                  <div class="profile-chip-info">
                    <span class="profile-chip-name">{{ auth.user?.name}}</span>
                    <span class="profile-chip-role">{{ auth.user?.team}}</span>
                  </div>
                  <v-icon size="16" color="#94a3b8" class="ml-1">
                    {{ profileMenu ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </div>
              </template>

              <v-card class="profile-menu-card" elevation="4" rounded="xl" width="210">
                <div class="menu-profile-header">
                  <v-avatar size="44" class="menu-avatar">
                    <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="John Leider" />
                  </v-avatar>
                  <div class="menu-profile-info">
                    <div class="menu-profile-name">{{ auth.user?.name}}</div>
                    <div class="menu-profile-role">{{ auth.user?.team}}</div>
                  </div>
                </div>
                <v-divider />
                <v-list density="compact" nav class="menu-list">
                  <v-list-item prepend-icon="mdi-account-circle-outline" title="My Profile" to="/profile" rounded="lg" class="menu-item" />
                  <v-list-item prepend-icon="mdi-cog-outline" title="Settings" to="/settings" rounded="lg" class="menu-item" />
                </v-list>
                <v-divider />
                <div class="menu-logout-area">
                  <v-btn block variant="text" color="#ef4444" prepend-icon="mdi-logout" class="logout-btn" @click=logout()>
                    Log Out
                  </v-btn>
                </div>
              </v-card>
            </v-menu>
          </div>
        </div>
      </v-app-bar>

      <!-- MAIN -->
      <v-main class="main-content">
        <div class="scroll-wrapper" id="main-scroll">

          <!-- Context bar -->
          <div v-if="!isSmallMobile" class="context-bar">
            <div class="context-inner">
              <v-icon size="14" color="#0284c7" class="mr-1">mdi-calendar-outline</v-icon>
              <span>{{ todayFormatted }}</span>
              <span class="context-sep">·</span>
              <span v-if="!isMobile">Ordinary Time · Week VII</span>
            </div>
          </div>

          <!-- CONTENT -->
          <v-container fluid class="page-container">
{{ auth.user }}
            <slot />
          </v-container>

        </div>
      </v-main>
    </v-layout>
  </v-app>
</template>


<script setup>
import { useAuthStore } from "~/stores/auth";
import { ref, computed, onMounted, onUnmounted } from "vue";
const auth = useAuthStore();
// const {user} = storeToRefs(auth);
const drawer = ref(true);
const rail = ref(true);
const profileMenu = ref(false);
const notifMenu = ref(false);
const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);

const isMobile = computed(() => windowWidth.value < 960);
const isSmallMobile = computed(() => windowWidth.value < 480);

function onResize() {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value < 960) {
    drawer.value = false;
    rail.value = false;
  } else {
    drawer.value = true;
    rail.value = true;
  }
}
const logout = ()=>{
  console.log('log-out')
  auth.logout()
}
onMounted(() => { window.addEventListener("resize", onResize); onResize(); });
onUnmounted(() => { window.removeEventListener("resize", onResize); });

const notifications = ref([
  {
    id: 1,
    icon: "mdi-calendar-check",
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
    title: "Mass Schedule Updated",
    message: "Sunday 8AM mass assignment has been updated.",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    icon: "mdi-account-plus",
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    title: "New Member Joined",
    message: "Maria Santos joined the Lectors ministry.",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    icon: "mdi-bullhorn",
    iconBg: "#fef9c3",
    iconColor: "#ca8a04",
    title: "Announcement Posted",
    message: "Formation seminar scheduled for March 15.",
    time: "3h ago",
    read: false,
  },
  {
    id: 4,
    icon: "mdi-check-circle",
    iconBg: "#f1f5f9",
    iconColor: "#94a3b8",
    title: "Attendance Recorded",
    message: "Your attendance for Feb 25 has been logged.",
    time: "1d ago",
    read: true,
  },
]);

const sidebar = ref([
  {
    name: "Dashboard",
    icon: "mdi-view-dashboard-outline",
    to: "/dashboard",
  },
  {
    name: "Statement of Account",
    icon: "mdi-file-document-outline",
    to: "/statement-of-account",
  },
  {
    name: "Attendance",
    icon: "mdi-calendar-check-outline",
    to: "/attendance",
  },
  {
    name: "Profile Status",
    icon: "mdi-account-check-outline",
    to: "/profile",
  },
  {
    name: "Accounting",
    icon: "mdi-calculator-variant-outline",
    to: "/accounting",
  },
  {
    name: "Scheduling",
    icon: "mdi-calculator-variant-outline",
    to: "/scheduling",
  },
  {
    name: "Announcement",
    icon: "mdi-bullhorn-outline",
    to: "/announcements",
  },
  {
    name: "User",
    icon: "mdi-account-cog-outline",
    children: [
      { 
        name: "Users List", 
        icon: "mdi-account-outline", 
        to: "/users" 
      },
      { 
        name: "Roles", 
        icon: "mdi-account-group-outline", 
        to: "/users/roles" 
      },
      { 
        name: "Permissions", 
        icon: "mdi-shield-key-outline", 
        to: "/users/permissions" 
      },
      { 
        name: "Ranking", 
        icon: "mdi-shield-key-outline", 
        to: "/users/ranking" 
      },
    ],
  },
]);

const todayFormatted = computed(() => {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());
});
</script>


<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

/* ── Sidebar nav — global to pierce Vuetify ───── */
.sidebar .v-list-item .v-list-item-title {
  color: rgba(186, 230, 253, 0.85) !important;
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  font-family: 'DM Sans', sans-serif !important;
}
.sidebar .v-list-item .v-icon {
  color: rgba(186, 230, 253, 0.7) !important;
  opacity: 1 !important;
}
/* Fix: ensure icon color shows in rail mode too */
.sidebar .v-list-item__prepend .v-icon {
  color: rgba(186, 230, 253, 0.7) !important;
  opacity: 1 !important;
}
.sidebar .v-list-item:hover .v-list-item-title,
.sidebar .v-list-item:hover .v-icon,
.sidebar .v-list-item:hover .v-list-item__prepend .v-icon {
  color: white !important;
}
.sidebar .v-list-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}
.sidebar .v-list-item--active {
  background: rgba(56, 189, 248, 0.22) !important;
  border-left: 3px solid #38bdf8 !important;
}
.sidebar .v-list-item--active .v-list-item-title {
  color: white !important;
  font-weight: 600 !important;
}
.sidebar .v-list-item--active .v-icon,
.sidebar .v-list-item--active .v-list-item__prepend .v-icon {
  color: #7dd3fc !important;
}

/* Sub-menu group header chevron color */
.sidebar .nav-group > .v-list-group__items {
  background: rgba(0, 0, 0, 0.15) !important;
  border-radius: 10px;
  margin: 2px 0;
}
.sidebar .v-list-group__header .v-list-item-title {
  color: rgba(186, 230, 253, 0.9) !important;
  font-weight: 600 !important;
}
.sidebar .v-list-group__header .v-icon {
  color: rgba(186, 230, 253, 0.7) !important;
}

/* Profile dropdown */
.profile-menu-card .menu-list .v-list-item .v-list-item-title {
  font-size: 0.85rem !important;
  font-family: 'DM Sans', sans-serif !important;
  color: #334155 !important;
}
.profile-menu-card .menu-list .v-list-item .v-icon {
  color: #64748b !important;
}
.profile-menu-card .menu-list .v-list-item:hover {
  background: #f0f9ff !important;
}

/* Notification dropdown */
.notif-card .notif-list .v-list-item .v-list-item-title {
  font-size: 0.82rem !important;
  font-family: 'DM Sans', sans-serif !important;
  color: #1e293b !important;
  font-weight: 600 !important;
}
.notif-card .notif-list .v-list-item .v-list-item-subtitle {
  font-size: 0.75rem !important;
  color: #64748b !important;
  font-family: 'DM Sans', sans-serif !important;
}
</style>

<style scoped>
.app-bg {
  background: #e0f2fe !important;
  font-family: 'DM Sans', sans-serif;
}

/* ── Sidebar ──────────────────────────────────── */
.sidebar {
  box-shadow: 4px 0 32px rgba(12, 74, 110, 0.35) !important;
  background: linear-gradient(180deg, #0c4a6e 0%, #0369a1 100%) !important;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  padding: 18px 14px 16px;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  flex-shrink: 0;
}
.sidebar-logo:hover { background: rgba(255,255,255,0.06); }
.sidebar-logo.rail-logo { justify-content: center; padding: 18px 8px 16px; }

.logo-mark {
  width: 38px; height: 38px; min-width: 38px;
  border-radius: 12px;
  background: rgba(56,189,248,0.2);
  border: 1px solid rgba(125,211,252,0.35);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  transition: background 0.15s;
}
.sidebar-logo:hover .logo-mark { background: rgba(56,189,248,0.3); }

.toggle-arrow {
  position: absolute; bottom: -2px; right: -4px;
  background: #0369a1; border-radius: 50%;
  width: 16px; height: 16px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(125,211,252,0.3);
}

.logo-label {
  font-family: 'DM Serif Display', serif;
  color: white; font-size: 1.05rem;
  white-space: nowrap; letter-spacing: 0.01em;
}

.sidebar-divider {
  border-color: rgba(125,211,252,0.15) !important;
  margin: 0 12px !important;
  flex-shrink: 0;
}

.nav-list { padding: 8px !important; }

/* Child items — indented + slightly smaller */
.nav-child {
  padding-left: 12px !important;
}
.nav-child :deep(.v-list-item-title) {
  font-size: 0.82rem !important;
}

/* ── Header ───────────────────────────────────── */
.header {
  border-bottom: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06) !important;
  overflow: hidden !important;
}
.header-inner {
  display: flex; align-items: center;
  padding: 0 16px; width: 100%; height: 100%;
}
@media (min-width: 960px) { .header-inner { padding: 0 24px; } }

.header-title {
  font-family: 'DM Serif Display', serif;
  font-size: 1rem; font-weight: 400; color: #0f172a;
  line-height: 1.2; letter-spacing: -0.01em; margin: 0;
}
@media (min-width: 960px) { .header-title { font-size: 1.15rem; } }

.header-subtitle {
  font-size: 0.78rem; color: #94a3b8;
  margin: 3px 0 0; display: flex; align-items: center;
}

.header-actions { display: flex; align-items: center; gap: 4px; }

.profile-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 12px 6px 6px; border-radius: 40px;
  border: 1px solid #e2e8f0; background: #f8fafc;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  user-select: none;
}
.profile-chip:hover {
  background: #f0f9ff; border-color: #bae6fd;
  box-shadow: 0 0 0 3px rgba(2,132,199,0.08);
}

.header-avatar { border: 2px solid #bae6fd; }
.profile-chip-info { display: flex; flex-direction: column; line-height: 1.2; }
.profile-chip-name { font-size: 0.82rem; font-weight: 600; color: #1e293b; }
.profile-chip-role { font-size: 0.7rem; color: #94a3b8; }

/* ── Profile Dropdown ─────────────────────────── */
.profile-menu-card { border: 1px solid #e2e8f0 !important; overflow: hidden; }
.menu-profile-header {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.menu-avatar { border: 2px solid #bae6fd; flex-shrink: 0; }
.menu-profile-name { font-size: 0.85rem; font-weight: 700; color: #0f172a; font-family: 'DM Sans', sans-serif; }
.menu-profile-role { font-size: 0.72rem; color: #0284c7; font-weight: 500; font-family: 'DM Sans', sans-serif; }
.menu-list { padding: 6px !important; }
.menu-logout-area { padding: 6px 8px 8px; }
.logout-btn {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.85rem !important; font-weight: 600 !important;
  letter-spacing: 0 !important; border-radius: 10px !important;
}
.logout-btn:hover { background: #fef2f2 !important; }

/* ── Notification Dropdown ────────────────────── */
.notif-card { border: 1px solid #e2e8f0 !important; overflow: hidden; }
.notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}
.notif-title {
  font-size: 0.9rem; font-weight: 700; color: #0f172a;
  font-family: 'DM Sans', sans-serif;
}
.notif-count-chip { font-family: 'DM Sans', sans-serif; font-weight: 600; }
.notif-list { padding: 6px !important; }
.notif-item {
  border-radius: 10px !important;
  margin-bottom: 2px;
  padding: 8px 10px !important;
}
.notif-unread {
  background: #f0f9ff !important;
}
.notif-item-title {
  font-weight: 600 !important;
  white-space: normal !important;
  line-height: 1.3 !important;
}
.notif-item-sub {
  white-space: normal !important;
  line-height: 1.4 !important;
  margin-top: 2px !important;
}
.notif-avatar { flex-shrink: 0; }
.notif-time {
  font-size: 0.7rem; color: #94a3b8;
  font-family: 'DM Sans', sans-serif;
  white-space: nowrap;
  align-self: flex-start;
  margin-top: 2px;
}
.notif-footer { padding: 6px 8px 8px; }
.notif-view-all {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  border-radius: 10px !important;
}
.notif-view-all:hover { background: #f0f9ff !important; }

/* ── Context Bar ──────────────────────────────── */
.context-bar {
  background: #e0f2fe;
  border-bottom: 1px solid #bae6fd;
  flex-shrink: 0;
}
.context-inner {
  padding: 6px 16px; display: flex; align-items: center;
  gap: 8px; font-size: 0.78rem; color: #64748b; font-family: 'DM Sans', sans-serif;
}
@media (min-width: 960px) { .context-inner { padding: 7px 28px; } }
.context-sep { color: #7dd3fc; }

/* ── Main ─────────────────────────────────────── */
.main-content {
  background: #e0f2fe !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  height: 100vh !important;
}

.scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}

.page-container {
  padding: 16px !important;
  background: #e0f2fe !important;
}
@media (min-width: 600px)  { .page-container { padding: 20px !important; } }
@media (min-width: 960px)  { .page-container { padding: 24px !important; } }

/* ── Transitions ──────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>