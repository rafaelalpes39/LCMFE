<template>
  <div class="perm-page">

    <!-- HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Permissions</h1>
        <p class="page-sub">{{ permissions.length }} permission{{ permissions.length !== 1 ? 's' : '' }} total</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <v-icon size="16" class="mr-1">mdi-plus</v-icon>
        New Permission
      </button>
    </div>

    <!-- SEARCH -->
    <div class="search-wrap">
      <v-icon size="16" color="#94a3b8" class="search-icon">mdi-magnify</v-icon>
      <input v-model="search" class="search-input" placeholder="Search permissions…" />
      <button v-if="search" class="search-clear" @click="search = ''">
        <v-icon size="13">mdi-close</v-icon>
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="#0369a1" size="32" />
      <p>Loading permissions…</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="error" class="error-wrap">
      <v-icon size="32" color="#ef4444">mdi-alert-circle-outline</v-icon>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="fetchPermissions">Retry</button>
    </div>

    <!-- TABLE -->
    <div v-else class="table-card">
      <table class="perm-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Permission Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(perm, index) in pagedPermissions"
            :key="perm.id"
            class="perm-row"
            :class="{ 'is-new': perm.isNew }"
          >
            <td class="idx-cell">{{ pageStart + index }}</td>
            <td>
              <code class="perm-slug">{{ perm.name }}</code>
            </td>
            <td>
              <div class="action-btns">
                <button class="act-btn edit" @click="openEditModal(perm)" title="Edit">
                  <v-icon size="15">mdi-pencil-outline</v-icon>
                  <span>Edit</span>
                </button>
                <button class="act-btn delete" @click="confirmDelete(perm)" title="Delete">
                  <v-icon size="15">mdi-trash-can-outline</v-icon>
                  <span>Delete</span>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="pagedPermissions.length === 0">
            <td colspan="3" class="empty-cell">
              <!-- SVG matches your users table empty-state style -->
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-svg">
                <circle cx="20" cy="16" r="7" stroke="#cbd5e1" stroke-width="2.2" fill="none"/>
                <path d="M6 38c0-7.18 6.268-13 14-13" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <circle cx="34" cy="34" r="8" stroke="#cbd5e1" stroke-width="2.2" fill="none"/>
                <line x1="40.2" y1="40.2" x2="44" y2="44" stroke="#cbd5e1" stroke-width="2.4" stroke-linecap="round"/>
              </svg>
              <p>No permissions found</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- PAGINATION BAR -->
      <div class="pagination-bar">
        <span class="pg-info">
          Showing {{ pagedPermissions.length === 0 ? 0 : pageStart }}–{{ pageEnd }} of
          {{ filteredPermissions.length }} permission{{ filteredPermissions.length !== 1 ? 's' : '' }}
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
              <button
                v-else
                class="pg-btn"
                :class="{ active: page === currentPage }"
                @click="currentPage = page"
              >{{ page }}</button>
            </template>
            <button class="pg-btn" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++">
              <v-icon size="15">mdi-chevron-right</v-icon>
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- CREATE / EDIT MODAL -->
    <transition name="modal">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">

          <div class="modal-header">
            <h2 class="modal-title">{{ isEditing ? 'Edit Permission' : 'New Permission' }}</h2>
            <button class="modal-close" @click="closeModal">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">
            <label class="field-label">
              Permission Name <span class="req">*</span>
            </label>
            <input
              v-model="form.name"
              class="f-input"
              placeholder="e.g. view users"
              @keyup.enter="savePermission"
              autofocus
            />
            <p class="field-hint">Use lowercase with spaces (e.g. <code>edit announcements</code>)</p>
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button class="btn-save" @click="savePermission" :disabled="!form.name.trim() || saving">
              <v-progress-circular v-if="saving" indeterminate size="14" width="2" color="white" class="mr-1" />
              {{ isEditing ? 'Save Changes' : 'Create' }}
            </button>
          </div>

        </div>
      </div>
    </transition>


    <!-- DELETE CONFIRM MODAL -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal modal-sm">
          <div class="del-icon-wrap">
            <v-icon size="28" color="#ef4444">mdi-trash-can-outline</v-icon>
          </div>
          <h2 class="modal-title">Delete Permission</h2>
          <p class="del-msg">
            Are you sure you want to delete <code class="perm-slug">{{ deleteTarget?.name }}</code>?
          </p>
          <div class="modal-footer centered">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-delete" @click="deletePermission" :disabled="deleting">
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
const permissions    = ref([]);
const search         = ref("");
const loading        = ref(false);
const error          = ref(null);
const saving         = ref(false);
const deleting       = ref(false);
const formError      = ref(null);

// ── Pagination state ──
const currentPage = ref(1);
const perPage     = ref(10);

// ── Computed ──
const filteredPermissions = computed(() =>
  permissions.value.filter(p =>
    !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

// Reset to page 1 whenever search changes
watch(() => search.value, () => { currentPage.value = 1; });

const totalPages = computed(() => Math.ceil(filteredPermissions.value.length / perPage.value) || 1);
const pageStart  = computed(() => filteredPermissions.value.length === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1);
const pageEnd    = computed(() => Math.min(currentPage.value * perPage.value, filteredPermissions.value.length));

const pagedPermissions = computed(() =>
  filteredPermissions.value.slice(
    (currentPage.value - 1) * perPage.value,
    currentPage.value * perPage.value
  )
);

const visiblePages = computed(() => {
  const total = totalPages.value;
  const cur   = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (cur >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', cur - 1, cur, cur + 1, '...', total);
  }
  return pages;
});

// ── Fetch all permissions ──
const fetchPermissions = async () => {
  loading.value = true;
  error.value   = null;
  try {
    const data = await $fetch(`${config.public.apiBase}/api/permissions`);
    // Support both { data: [...] } and plain array responses
    permissions.value = (data?.data ?? data).map(p => ({ ...p, isNew: false }));
  } catch (err) {
    error.value = err?.data?.message ?? "Failed to load permissions.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPermissions);

// ── Modal ──
const showModal  = ref(false);
const isEditing  = ref(false);
const editTarget = ref(null);
const form       = ref({ name: "" });

const openCreateModal = () => {
  form.value      = { name: "" };
  formError.value = null;
  isEditing.value = false;
  showModal.value = true;
};

const openEditModal = (perm) => {
  form.value       = { name: perm.name };
  formError.value  = null;
  isEditing.value  = true;
  editTarget.value = perm;
  showModal.value  = true;
};

const closeModal = () => {
  if (saving.value) return;
  showModal.value = false;
};

const savePermission = async () => {
  if (!form.value.name.trim() || saving.value) return;
  saving.value    = true;
  formError.value = null;

  const payload = { name: form.value.name.toLowerCase().trim() };

  try {
    if (isEditing.value && editTarget.value) {
      // PUT /api/permissions/{id}
      const data = await $fetch(
        `${config.public.apiBase}/api/permissions/${editTarget.value.id}`,
        { method: "PUT", body: payload }
      );
      const updated = data?.data ?? data;
      const idx = permissions.value.findIndex(p => p.id === editTarget.value.id);
      if (idx !== -1) permissions.value[idx] = { ...updated, isNew: false };
    } else {
      // POST /api/permissions
      const data = await $fetch(
        `${config.public.apiBase}/api/permissions`,
        { method: "POST", body: payload }
      );
      const created = data?.data ?? data;
      permissions.value.unshift({ ...created, isNew: true });
      setTimeout(() => {
        const p = permissions.value.find(p => p.id === created.id);
        if (p) p.isNew = false;
      }, 2000);
    }
    saving.value = false;
    showModal.value = false;
  } catch (err) {
    formError.value = err?.data?.message ?? "Something went wrong. Please try again.";
    saving.value = false;
  }
};

// ── Delete ──
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);

const confirmDelete = (perm) => {
  deleteTarget.value    = perm;
  showDeleteModal.value = true;
};

const deletePermission = async () => {
  if (deleting.value) return;
  deleting.value = true;
  try {
    // DELETE /api/permissions/{id}
    await $fetch(
      `${config.public.apiBase}/api/permissions/${deleteTarget.value.id}`,
      { method: "DELETE" }
    );
    permissions.value    = permissions.value.filter(p => p.id !== deleteTarget.value.id);
    showDeleteModal.value = false;
  } catch (err) {
    // Keep modal open and show error in console; you can add a toast here
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

.perm-page {
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

.perm-table { width: 100%; border-collapse: collapse; }

.perm-table thead tr {
  background: #f8fafc; border-bottom: 1px solid #e2e8f0;
}
.perm-table th {
  padding: 11px 18px; text-align: left;
  font-size: 0.7rem; font-weight: 700; color: #64748b;
  letter-spacing: 0.07em; text-transform: uppercase;
}
.perm-table th:last-child { text-align: right; }
.perm-table td:last-child { text-align: right; }
.perm-table td.empty-cell { text-align: center !important; }

.perm-table td { padding: 12px 18px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.perm-row { transition: background 0.1s; }
.perm-row:hover { background: #fafcff; }
.perm-row:last-child td { border-bottom: none; }

.perm-row.is-new { animation: flash 2s ease-out; }
@keyframes flash { 0% { background: #dbeafe; } 100% { background: transparent; } }

.idx-cell { color: #cbd5e1; font-size: 0.78rem; width: 40px; }

.perm-slug {
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 0.8rem; background: #f1f5f9; color: #0c4a6e;
  padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0;
}

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

/* ── Empty state ── */
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
  background: white; outline: none; cursor: pointer;
  appearance: auto;
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

/* ── Modal ── */
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
.modal-sm { max-width: 360px; padding: 28px 24px; text-align: center; }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  font-family: "DM Serif Display", serif;
  font-size: 1.1rem; font-weight: 400; color: #0f172a; margin: 0;
}
.modal-close {
  background: none; border: none; cursor: pointer; color: #94a3b8;
  padding: 4px; border-radius: 6px; display: flex;
  transition: color 0.15s, background 0.15s;
}
.modal-close:hover { color: #475569; background: #f1f5f9; }

.modal-body { padding: 20px 24px; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #334155; display: block; margin-bottom: 6px; }
.req { color: #ef4444; }
.field-hint { font-size: 0.72rem; color: #94a3b8; margin: 6px 0 0; }
.field-hint code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; color: #0c4a6e; font-size: 0.7rem; }

.form-error {
  font-size: 0.78rem; color: #ef4444;
  margin: 8px 0 0; padding: 8px 10px;
  background: #fef2f2; border-radius: 7px; border: 1px solid #fecaca;
}

.f-input {
  width: 100%; padding: 10px 13px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 0.875rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.f-input:focus { border-color: #0369a1; background: white; box-shadow: 0 0 0 3px rgba(3,105,161,0.1); }
.f-input::placeholder { color: #cbd5e1; }

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

/* Delete modal */
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