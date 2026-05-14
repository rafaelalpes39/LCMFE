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

    <!-- TABLE -->
    <div class="table-card">
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
            v-for="(perm, index) in filteredPermissions"
            :key="perm.id"
            class="perm-row"
            :class="{ 'is-new': perm.isNew }"
          >
            <td class="idx-cell">{{ index + 1 }}</td>
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

          <tr v-if="filteredPermissions.length === 0">
            <td colspan="3" class="empty-cell">
              <v-icon size="36" color="#cbd5e1">mdi-shield-search-outline</v-icon>
              <p>No permissions found</p>
            </td>
          </tr>
        </tbody>
      </table>
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
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button class="btn-save" @click="savePermission" :disabled="!form.name.trim()">
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
            <button class="btn-delete" @click="deletePermission">Delete</button>
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
const permissions = ref([
  { id: 1,  name: "view users",           isNew: false },
  { id: 2,  name: "create users",         isNew: false },
  { id: 3,  name: "edit users",           isNew: false },
  { id: 4,  name: "delete users",         isNew: false },
  { id: 5,  name: "view accounting",      isNew: false },
  { id: 6,  name: "create accounting",    isNew: false },
  { id: 7,  name: "edit accounting",      isNew: false },
  { id: 8,  name: "delete accounting",    isNew: false },
  { id: 9,  name: "view announcements",   isNew: false },
  { id: 10, name: "create announcements", isNew: false },
  { id: 11, name: "edit announcements",   isNew: false },
  { id: 12, name: "delete announcements", isNew: false },
  { id: 13, name: "manage permissions",   isNew: false },
  { id: 14, name: "manage roles",         isNew: false },
]);

const search = ref("");

const filteredPermissions = computed(() =>
  permissions.value.filter(p =>
    !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

/* ── Modal ── */
const showModal  = ref(false);
const isEditing  = ref(false);
const editTarget = ref(null);
const form       = ref({ name: "" });

const openCreateModal = () => {
  form.value = { name: "" };
  isEditing.value = false;
  showModal.value = true;
};

const openEditModal = (perm) => {
  form.value = { name: perm.name };
  isEditing.value  = true;
  editTarget.value = perm;
  showModal.value  = true;
};

const closeModal = () => { showModal.value = false; };

const savePermission = () => {
  if (!form.value.name.trim()) return;
  if (isEditing.value && editTarget.value) {
    editTarget.value.name  = form.value.name.toLowerCase().trim();
    editTarget.value.isNew = false;
  } else {
    permissions.value.unshift({
      id: Date.now(),
      name: form.value.name.toLowerCase().trim(),
      isNew: true,
    });
    setTimeout(() => {
      const p = permissions.value.find(p => p.isNew);
      if (p) p.isNew = false;
    }, 2000);
  }
  closeModal();
};

/* ── Delete ── */
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);

const confirmDelete = (perm) => { deleteTarget.value = perm; showDeleteModal.value = true; };
const deletePermission = () => {
  permissions.value = permissions.value.filter(p => p.id !== deleteTarget.value.id);
  showDeleteModal.value = false;
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

.empty-cell {
  text-align: center; padding: 48px 16px !important;
  color: #94a3b8;
}
.empty-cell p { margin: 10px 0 0; font-size: 0.875rem; }

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
  padding: 8px 20px; border: none; border-radius: 9px;
  background: #ef4444; color: white;
  font-family: "DM Sans", sans-serif; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
}
.btn-delete:hover { opacity: 0.88; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96) translateY(8px); opacity: 0; }
</style>