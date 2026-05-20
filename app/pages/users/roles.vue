<template>
  <div class="roles-page">

    <!-- HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Roles</h1>
        <p class="page-sub">{{ roles.length }} role{{ roles.length !== 1 ? 's' : '' }} total</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <v-icon size="16" class="mr-1">mdi-plus</v-icon>
        New Role
      </button>
    </div>

    <!-- SEARCH -->
    <div class="search-wrap">
      <v-icon size="16" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
      <input v-model="search" class="search-input" placeholder="Search roles…" />
      <button v-if="search" class="search-clear" @click="search = ''">
        <v-icon size="13">mdi-close</v-icon>
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="#0369a1" size="32" />
      <p>Loading roles…</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="error-wrap">
      <v-icon size="32" color="#ef4444">mdi-alert-circle-outline</v-icon>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="fetchRoles">Retry</button>
    </div>

    <!-- TABLE -->
    <div v-else class="table-card">
      <table class="roles-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Role Name</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(role, index) in pagedRoles"
            :key="role.id"
            class="role-row"
            :class="{ 'is-new': role.isNew }"
          >
            <td class="idx-cell">{{ pageStart + index }}</td>
            <td>
              <span class="role-name">{{ role.name }}</span>
            </td>
            <td>
              <div class="perm-pills">
                <span
                  v-for="p in (role.permissions || []).slice(0, 3)"
                  :key="p.id ?? p"
                  class="perm-pill"
                >{{ p.name ?? p }}</span>
                <span v-if="(role.permissions || []).length > 3" class="perm-more">
                  +{{ role.permissions.length - 3 }} more
                </span>
                <span v-if="(role.permissions || []).length === 0" class="perm-none">
                  No permissions
                </span>
              </div>
            </td>
            <td>
              <div class="action-btns">
                <button class="act-btn edit" @click="openEditModal(role)">
                  <v-icon size="15">mdi-pencil-outline</v-icon>
                  <span>Edit</span>
                </button>
                <button class="act-btn delete" @click="confirmDelete(role)">
                  <v-icon size="15">mdi-trash-can-outline</v-icon>
                  <span>Delete</span>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="pagedRoles.length === 0">
            <td colspan="4" class="empty-cell">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-svg">
                <circle cx="20" cy="16" r="7" stroke="#cbd5e1" stroke-width="2.2" fill="none"/>
                <path d="M6 38c0-7.18 6.268-13 14-13" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <circle cx="34" cy="34" r="8" stroke="#cbd5e1" stroke-width="2.2" fill="none"/>
                <line x1="40.2" y1="40.2" x2="44" y2="44" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/>
              </svg>
              <p>No roles found</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- PAGINATION BAR -->
      <div class="pagination-bar">
        <span class="pg-info">
          Showing {{ pagedRoles.length === 0 ? 0 : pageStart }}–{{ pageEnd }} of
          {{ filteredRoles.length }} role{{ filteredRoles.length !== 1 ? 's' : '' }}
        </span>
        <div class="pg-controls">
          <span class="pg-label">Show</span>
          <select v-model="perPage" class="pg-select" @change="currentPage = 1">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <span class="pg-label">per page</span>
          <div class="pg-nav">
            <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
              <v-icon size="15">mdi-chevron-left</v-icon>
            </button>
            <template v-for="page in visiblePages" :key="page">
              <span v-if="page === '...'" class="pg-ellipsis">…</span>
              <button v-else class="pg-btn" :class="{ active: page === currentPage }" @click="currentPage = page">
                {{ page }}
              </button>
            </template>
            <button class="pg-btn" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++">
              <v-icon size="15">mdi-chevron-right</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- ── CREATE MODAL ─────────────────────────────── -->
    <transition name="modal">
      <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">New Role</h2>
              <p class="modal-sub">Set a name and optionally assign permissions</p>
            </div>
            <button class="modal-close" @click="closeCreateModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">
            <!-- Role name -->
            <div class="edit-name-field">
              <label class="field-label">Role Name <span class="req">*</span></label>
              <input
                v-model="createForm.name"
                class="f-input"
                placeholder="e.g. Coordinator"
                autofocus
              />
            </div>

            <!-- Permissions -->
            <div class="perm-section">
              <div class="perm-section-header">
                <label class="field-label">Permissions</label>
                <div class="perm-section-actions">
                  <span class="selected-count">{{ createForm.selectedPerms.length }} selected</span>
                  <button class="link-btn" @click="selectAllCreate">Select all</button>
                  <span class="sep">·</span>
                  <button class="link-btn" @click="createForm.selectedPerms = []">Clear</button>
                </div>
              </div>

              <div class="perm-search-wrap">
                <v-icon size="14" color="#94a3b8" class="psearch-icon">mdi-magnify</v-icon>
                <input v-model="createPermSearch" class="perm-search" placeholder="Filter permissions…" />
              </div>

              <div v-if="permsLoading" class="perm-loading">
                <v-progress-circular indeterminate color="#0369a1" size="20" />
                <span>Loading permissions…</span>
              </div>

              <div v-else class="perm-list">
                <label
                  v-for="perm in filteredCreatePermissions"
                  :key="perm.id"
                  class="perm-check-item"
                  :class="{ checked: createForm.selectedPerms.includes(perm.id) }"
                >
                  <input type="checkbox" :value="perm.id" v-model="createForm.selectedPerms" class="cb" />
                  <code class="perm-slug">{{ perm.name }}</code>
                </label>

                <div v-if="filteredCreatePermissions.length === 0" class="no-perms">
                  No permissions match your search
                </div>
              </div>
            </div>

            <p v-if="createError" class="form-error">{{ createError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeCreateModal">Cancel</button>
            <button class="btn-save" @click="saveCreate" :disabled="!createForm.name.trim() || creating">
              <v-progress-circular v-if="creating" indeterminate size="14" width="2" color="white" class="mr-1" />
              Create
            </button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ── EDIT MODAL ───────────────────────────────── -->
    <transition name="modal">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Edit Role</h2>
              <p class="modal-sub">Update name and assign permissions</p>
            </div>
            <button class="modal-close" @click="closeEditModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">
            <div class="edit-name-field">
              <label class="field-label">Role Name <span class="req">*</span></label>
              <input v-model="editForm.name" class="f-input" placeholder="Role name" />
            </div>

            <div class="perm-section">
              <div class="perm-section-header">
                <label class="field-label">Permissions</label>
                <div class="perm-section-actions">
                  <span class="selected-count">{{ editForm.selectedPerms.length }} selected</span>
                  <button class="link-btn" @click="selectAllEdit">Select all</button>
                  <span class="sep">·</span>
                  <button class="link-btn" @click="editForm.selectedPerms = []">Clear</button>
                </div>
              </div>

              <div class="perm-search-wrap">
                <v-icon size="14" color="#94a3b8" class="psearch-icon">mdi-magnify</v-icon>
                <input v-model="editPermSearch" class="perm-search" placeholder="Filter permissions…" />
              </div>

              <div v-if="permsLoading" class="perm-loading">
                <v-progress-circular indeterminate color="#0369a1" size="20" />
                <span>Loading permissions…</span>
              </div>

              <div v-else class="perm-list">
                <label
                  v-for="perm in filteredEditPermissions"
                  :key="perm.id"
                  class="perm-check-item"
                  :class="{ checked: editForm.selectedPerms.includes(perm.id) }"
                >
                  <input type="checkbox" :value="perm.id" v-model="editForm.selectedPerms" class="cb" />
                  <code class="perm-slug">{{ perm.name }}</code>
                </label>

                <div v-if="filteredEditPermissions.length === 0" class="no-perms">
                  No permissions match your search
                </div>
              </div>
            </div>

            <p v-if="editError" class="form-error">{{ editError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeEditModal">Cancel</button>
            <button class="btn-save" @click="saveEdit" :disabled="!editForm.name.trim() || saving">
              <v-progress-circular v-if="saving" indeterminate size="14" width="2" color="white" class="mr-1" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ── DELETE CONFIRM ────────────────────────────── -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal modal-sm">
          <div class="del-icon-wrap">
            <v-icon size="28" color="#ef4444">mdi-trash-can-outline</v-icon>
          </div>
          <h2 class="modal-title">Delete Role</h2>
          <p class="del-msg">
            Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?
          </p>
          <div class="modal-footer centered">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-delete" @click="deleteRole" :disabled="deleting">
              <v-progress-circular v-if="deleting" indeterminate size="14" width="2" color="white" class="mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from "vue";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const config = useRuntimeConfig();

// ── State ──
const roles       = ref([]);
const allPerms    = ref([]);   // fetched from /api/permissions
const loading     = ref(false);
const permsLoading = ref(false);
const error       = ref(null);
const creating    = ref(false);
const saving      = ref(false);
const deleting    = ref(false);
const createError = ref(null);
const editError   = ref(null);

// ── Pagination ──
const search      = ref("");
const currentPage = ref(1);
const perPage     = ref(10);

watch(() => search.value, () => { currentPage.value = 1; });

const filteredRoles = computed(() =>
  roles.value.filter(r =>
    !search.value || r.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const totalPages = computed(() => Math.ceil(filteredRoles.value.length / perPage.value) || 1);
const pageStart  = computed(() => filteredRoles.value.length === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1);
const pageEnd    = computed(() => Math.min(currentPage.value * perPage.value, filteredRoles.value.length));

const pagedRoles = computed(() =>
  filteredRoles.value.slice(
    (currentPage.value - 1) * perPage.value,
    currentPage.value * perPage.value
  )
);

const visiblePages = computed(() => {
  const total = totalPages.value;
  const cur   = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4)        return [1, 2, 3, 4, 5, '...', total];
  if (cur >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', cur-1, cur, cur+1, '...', total];
});

// ── Fetch roles ──
const fetchRoles = async () => {
  loading.value = true;
  error.value   = null;
  try {
    const data = await $fetch(`${config.public.apiBase}/api/roles`);
    roles.value = (data?.data ?? data).map(r => ({ ...r, isNew: false }));
  } catch (err) {
    error.value = err?.data?.message ?? "Failed to load roles.";
  } finally {
    loading.value = false;
  }
};

// ── Fetch all permissions (for checkboxes) ──
const fetchPermissions = async () => {
  permsLoading.value = true;
  try {
    const data = await $fetch(`${config.public.apiBase}/api/permissions`);
    allPerms.value = data?.data ?? data;
  } catch (err) {
    console.error("Failed to load permissions:", err);
  } finally {
    permsLoading.value = false;
  }
};

onMounted(() => {
  fetchRoles();
  fetchPermissions();
});

// ── CREATE modal ──
const showCreateModal  = ref(false);
const createPermSearch = ref("");
const createForm       = ref({ name: "", selectedPerms: [] });

const filteredCreatePermissions = computed(() =>
  allPerms.value.filter(p =>
    !createPermSearch.value || p.name.toLowerCase().includes(createPermSearch.value.toLowerCase())
  )
);

const openCreateModal = () => {
  createForm.value      = { name: "", selectedPerms: [] };
  createPermSearch.value = "";
  createError.value     = null;
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  if (creating.value) return;
  showCreateModal.value = false;
};

const selectAllCreate = () => {
  createForm.value.selectedPerms = filteredCreatePermissions.value.map(p => p.id);
};

const saveCreate = async () => {
  if (!createForm.value.name.trim() || creating.value) return;
  creating.value    = true;
  createError.value = null;

  try {
    // POST /api/roles — send name + permission_ids
    const data = await $fetch(`${config.public.apiBase}/api/roles`, {
      method: "POST",
      body: {
        name: createForm.value.name.trim(),
        permission_ids: createForm.value.selectedPerms,
      },
    });
    const created = data?.data ?? data;
    roles.value.unshift({ ...created, isNew: true });
    setTimeout(() => {
      const r = roles.value.find(r => r.id === created.id);
      if (r) r.isNew = false;
    }, 2000);
    creating.value        = false;
    showCreateModal.value = false;
  } catch (err) {
    createError.value = err?.data?.message ?? "Something went wrong. Please try again.";
    creating.value    = false;
  }
};

// ── EDIT modal ──
const showEditModal  = ref(false);
const editTarget     = ref(null);
const editPermSearch = ref("");
const editForm       = ref({ name: "", selectedPerms: [] });

const filteredEditPermissions = computed(() =>
  allPerms.value.filter(p =>
    !editPermSearch.value || p.name.toLowerCase().includes(editPermSearch.value.toLowerCase())
  )
);

const openEditModal = (role) => {
  editTarget.value    = role;
  editPermSearch.value = "";
  editError.value     = null;

  // selectedPerms: role.permissions may be objects {id, name} or plain strings
  const selectedIds = (role.permissions ?? []).map(p =>
    typeof p === "object" ? p.id : allPerms.value.find(a => a.name === p)?.id
  ).filter(Boolean);

  editForm.value      = { name: role.name, selectedPerms: selectedIds };
  showEditModal.value = true;
};

const closeEditModal = () => {
  if (saving.value) return;
  showEditModal.value = false;
};

const selectAllEdit = () => {
  editForm.value.selectedPerms = filteredEditPermissions.value.map(p => p.id);
};

const saveEdit = async () => {
  if (!editForm.value.name.trim() || saving.value || !editTarget.value) return;
  saving.value    = true;
  editError.value = null;

  try {
    // PUT /api/roles/{id}
    const data = await $fetch(
      `${config.public.apiBase}/api/roles/${editTarget.value.id}`,
      {
        method: "PUT",
        body: {
          name: editForm.value.name.trim(),
          permission_ids: editForm.value.selectedPerms,
        },
      }
    );
    const updated = data?.data ?? data;
    const idx = roles.value.findIndex(r => r.id === editTarget.value.id);
    if (idx !== -1) roles.value[idx] = { ...updated, isNew: false };
    saving.value        = false;
    showEditModal.value = false;
  } catch (err) {
    editError.value = err?.data?.message ?? "Something went wrong. Please try again.";
    saving.value    = false;
  }
};

// ── DELETE modal ──
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);

const confirmDelete = (role) => {
  deleteTarget.value    = role;
  showDeleteModal.value = true;
};

const deleteRole = async () => {
  if (deleting.value) return;
  deleting.value = true;
  try {
    // DELETE /api/roles/{id}
    await $fetch(`${config.public.apiBase}/api/roles/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    roles.value           = roles.value.filter(r => r.id !== deleteTarget.value.id);
    showDeleteModal.value = false;
  } catch (err) {
    console.error("Delete failed:", err?.data?.message ?? err);
  } finally {
    deleting.value = false;
  }
};
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap");
</style>

<style scoped>
* { box-sizing: border-box; }

.roles-page {
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
}

/* ── Header ── */
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

/* ── Search ── */
.search-wrap {
  position: relative; margin-bottom: 14px;
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

/* ── Loading / Error ── */
.loading-wrap, .error-wrap {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px;
  color: #94a3b8; font-size: 0.875rem;
}
.error-wrap { color: #ef4444; }
.error-wrap p { color: #64748b; }

/* ── Table ── */
.table-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0; overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}
.roles-table { width: 100%; border-collapse: collapse; }
.roles-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.roles-table th {
  padding: 11px 18px; text-align: left;
  font-size: 0.7rem; font-weight: 700; color: #64748b;
  letter-spacing: 0.07em; text-transform: uppercase;
}
.roles-table th:last-child { text-align: right; }
.roles-table td { padding: 13px 18px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.roles-table td:last-child { text-align: right; }
.roles-table td.empty-cell { text-align: center !important; }
.role-row { transition: background 0.1s; }
.role-row:hover { background: #fafcff; }
.role-row:last-child td { border-bottom: none; }
.role-row.is-new { animation: flash 2s ease-out; }
@keyframes flash { 0% { background: #dbeafe; } 100% { background: transparent; } }

.idx-cell { color: #cbd5e1; font-size: 0.78rem; width: 40px; }
.role-name { font-weight: 600; font-size: 0.9rem; color: #0f172a; }

/* Permission pills */
.perm-pills { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.perm-pill {
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 0.68rem; background: #f1f5f9; color: #0c4a6e;
  padding: 2px 8px; border-radius: 5px; border: 1px solid #e2e8f0;
}
.perm-more  { font-size: 0.72rem; color: #94a3b8; font-weight: 500; }
.perm-none  { font-size: 0.75rem; color: #cbd5e1; font-style: italic; }

/* Action buttons */
.action-btns { display: flex; gap: 6px; justify-content: flex-end; }
.act-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px;
  border: 1.5px solid #e2e8f0; background: white;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  font-family: "DM Sans", sans-serif; color: #64748b;
  transition: all 0.15s;
}
.act-btn.edit:hover   { border-color: #0369a1; background: #eff6ff; color: #0369a1; }
.act-btn.delete:hover { border-color: #ef4444; background: #fef2f2; color: #ef4444; }

/* Empty state */
.empty-svg { display: block; margin: 0 auto 10px; opacity: 0.7; }
.empty-cell {
  text-align: center !important; padding: 52px 16px !important;
  color: #94a3b8;
}
.empty-cell p { margin: 0; font-size: 0.875rem; color: #94a3b8; }

/* ── Pagination bar ── */
.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-top: 1px solid #f1f5f9;
  background: #fafcff; flex-wrap: wrap; gap: 10px;
}
.pg-info { font-size: 0.78rem; color: #94a3b8; }
.pg-controls { display: flex; align-items: center; gap: 8px; }
.pg-label { font-size: 0.78rem; color: #64748b; }
.pg-select {
  padding: 4px 24px 4px 10px; border: 1.5px solid #e2e8f0; border-radius: 7px;
  font-size: 0.8rem; font-family: "DM Sans", sans-serif; color: #334155;
  background: white; outline: none; cursor: pointer; appearance: auto;
  transition: border-color 0.15s;
}
.pg-select:focus { border-color: #0369a1; }
.pg-nav { display: flex; align-items: center; gap: 3px; margin-left: 4px; }
.pg-btn {
  min-width: 30px; height: 30px; padding: 0 6px;
  border: 1.5px solid #e2e8f0; border-radius: 7px;
  background: white; font-size: 0.78rem; font-weight: 600;
  font-family: "DM Sans", sans-serif; color: #475569;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.pg-btn:hover:not(:disabled):not(.active) { border-color: #0369a1; color: #0369a1; background: #eff6ff; }
.pg-btn.active { background: linear-gradient(135deg, #0c4a6e, #0369a1); color: white; border-color: transparent; }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-ellipsis { font-size: 0.8rem; color: #94a3b8; padding: 0 4px; line-height: 30px; }

/* ── Modal base ── */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
}
.modal-lg { max-width: 560px; }
.modal-sm { max-width: 360px; padding: 28px 24px; text-align: center; }

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0;
}
.modal-sub { font-size: 0.75rem; color: #94a3b8; margin: 3px 0 0; }
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex;
  transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }

.modal-body {
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 18px;
  max-height: 65vh; overflow-y: auto;
}
.modal-body::-webkit-scrollbar { width: 5px; }
.modal-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9;
}
.modal-footer.centered { justify-content: center; border-top: none; padding-top: 0; }

/* Form elements */
.edit-name-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #334155; display: block; }
.req { color: #ef4444; }

.f-input {
  width: 100%; padding: 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.f-input:focus { border-color: #0369a1; background: white; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.f-input::placeholder { color: #cbd5e1; }

/* Permissions section */
.perm-section { display: flex; flex-direction: column; gap: 10px; }
.perm-section-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.perm-section-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.selected-count { font-size: 0.75rem; color: #94a3b8; }
.link-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  font-size: 0.75rem; font-weight: 600; color: #0369a1;
  font-family: "DM Sans", sans-serif; transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }
.sep { color: #cbd5e1; font-size: 0.75rem; }

.perm-search-wrap { position: relative; display: flex; align-items: center; }
.psearch-icon { position: absolute; left: 10px; pointer-events: none; }
.perm-search {
  width: 100%; padding: 7px 12px 7px 30px;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 0.82rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none; transition: border-color 0.15s;
}
.perm-search:focus { border-color: #0369a1; }
.perm-search::placeholder { color: #cbd5e1; }

.perm-loading {
  display: flex; align-items: center; gap: 10px;
  padding: 20px; font-size: 0.82rem; color: #94a3b8;
  justify-content: center;
}

.perm-list {
  max-height: 220px; overflow-y: auto;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 6px; display: flex; flex-direction: column; gap: 2px;
}
.perm-list::-webkit-scrollbar { width: 5px; }
.perm-list::-webkit-scrollbar-track { background: transparent; }
.perm-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

.perm-check-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 7px;
  cursor: pointer; transition: background 0.1s;
}
.perm-check-item:hover { background: #f8fafc; }
.perm-check-item.checked { background: #eff6ff; }
.cb { width: 15px; height: 15px; accent-color: #0369a1; cursor: pointer; flex-shrink: 0; }

.perm-slug {
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 0.78rem; background: #f1f5f9; color: #0c4a6e;
  padding: 3px 8px; border-radius: 5px; border: 1px solid #e2e8f0;
}
.perm-check-item.checked .perm-slug { background: #dbeafe; border-color: #bae6fd; color: #1e40af; }
.no-perms { text-align: center; padding: 20px; font-size: 0.82rem; color: #94a3b8; }

.form-error {
  font-size: 0.78rem; color: #ef4444;
  padding: 8px 10px; background: #fef2f2;
  border-radius: 7px; border: 1px solid #fecaca; margin: 0;
}

/* Buttons */
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

.del-icon-wrap {
  width: 56px; height: 56px; border-radius: 50%;
  background: #fef2f2; border: 2px solid #fecaca;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
}
.del-msg { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin: 8px 0 20px; }
.btn-delete {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 20px; border: none; border-radius: 9px;
  background: #ef4444; color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-delete:hover:not(:disabled) { opacity: 0.88; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
</style>