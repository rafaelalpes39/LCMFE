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

    <!-- TABLE -->
    <div class="table-card">
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
            v-for="(role, index) in filteredRoles"
            :key="role.id"
            class="role-row"
            :class="{ 'is-new': role.isNew }"
          >
            <td class="idx-cell">{{ index + 1 }}</td>
            <td>
              <span class="role-name">{{ role.name }}</span>
            </td>
            <td>
              <div class="perm-pills">
                <span
                  v-for="p in role.permissions.slice(0, 3)"
                  :key="p"
                  class="perm-pill"
                >{{ p }}</span>
                <span v-if="role.permissions.length > 3" class="perm-more">
                  +{{ role.permissions.length - 3 }} more
                </span>
                <span v-if="role.permissions.length === 0" class="perm-none">
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

          <tr v-if="filteredRoles.length === 0">
            <td colspan="4" class="empty-cell">
              <v-icon size="36" color="#cbd5e1">mdi-shield-account-outline</v-icon>
              <p>No roles found</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <!-- ── CREATE MODAL (name only) ─────────────────── -->
    <transition name="modal">
      <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">New Role</h2>
            <button class="modal-close" @click="showCreateModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">
            <label class="field-label">Role Name <span class="req">*</span></label>
            <input
              v-model="createForm.name"
              class="f-input"
              placeholder="e.g. Coordinator"
              @keyup.enter="saveCreate"
              autofocus
            />
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showCreateModal = false">Cancel</button>
            <button class="btn-save" @click="saveCreate" :disabled="!createForm.name.trim()">
              Create
            </button>
          </div>
        </div>
      </div>
    </transition>


    <!-- ── EDIT MODAL (name + permissions checkboxes) ── -->
    <transition name="modal">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Edit Role</h2>
              <p class="modal-sub">Update name and assign permissions</p>
            </div>
            <button class="modal-close" @click="showEditModal = false">
              <v-icon size="18">mdi-close</v-icon>
            </button>
          </div>

          <div class="modal-body">

            <!-- Role name -->
            <div class="edit-name-field">
              <label class="field-label">Role Name <span class="req">*</span></label>
              <input v-model="editForm.name" class="f-input" placeholder="Role name" />
            </div>

            <!-- Permissions -->
            <div class="perm-section">
              <div class="perm-section-header">
                <label class="field-label">Permissions</label>
                <div class="perm-section-actions">
                  <span class="selected-count">{{ editForm.selectedPerms.length }} selected</span>
                  <button class="link-btn" @click="selectAll">Select all</button>
                  <span class="sep">·</span>
                  <button class="link-btn" @click="editForm.selectedPerms = []">Clear</button>
                </div>
              </div>

              <!-- Search inside modal -->
              <div class="perm-search-wrap">
                <v-icon size="14" color="#94a3b8" class="psearch-icon">mdi-magnify</v-icon>
                <input v-model="permSearch" class="perm-search" placeholder="Filter permissions…" />
              </div>

              <!-- Checkboxes list -->
              <div class="perm-list">
                <label
                  v-for="perm in filteredAllPermissions"
                  :key="perm.id"
                  class="perm-check-item"
                  :class="{ checked: editForm.selectedPerms.includes(perm.id) }"
                >
                  <input
                    type="checkbox"
                    :value="perm.id"
                    v-model="editForm.selectedPerms"
                    class="cb"
                  />
                  <code class="perm-slug">{{ perm.name }}</code>
                </label>

                <div v-if="filteredAllPermissions.length === 0" class="no-perms">
                  No permissions match your search
                </div>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showEditModal = false">Cancel</button>
            <button class="btn-save" @click="saveEdit" :disabled="!editForm.name.trim()">
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
            <button class="btn-delete" @click="deleteRole">Delete</button>
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

/* ── All available permissions (from Spatie) ─────── */
const allPermissions = ref([
  { id: 1,  name: "view users" },
  { id: 2,  name: "create users" },
  { id: 3,  name: "edit users" },
  { id: 4,  name: "delete users" },
  { id: 5,  name: "view accounting" },
  { id: 6,  name: "create accounting" },
  { id: 7,  name: "edit accounting" },
  { id: 8,  name: "delete accounting" },
  { id: 9,  name: "view announcements" },
  { id: 10, name: "create announcements" },
  { id: 11, name: "edit announcements" },
  { id: 12, name: "delete announcements" },
  { id: 13, name: "view profile" },
  { id: 14, name: "edit profile" },
  { id: 15, name: "manage permissions" },
  { id: 16, name: "manage roles" },
]);

/* ── Roles (permissions stored as name strings for display) ─ */
const roles = ref([
  {
    id: 1, name: "Administrator", isNew: false,
    permissions: ["view users","create users","edit users","delete users","manage permissions","manage roles"],
  },
  {
    id: 2, name: "Coordinator", isNew: false,
    permissions: ["view users","view announcements","create announcements","edit announcements"],
  },
  {
    id: 3, name: "Lector", isNew: false,
    permissions: ["view announcements","view profile","edit profile"],
  },
  {
    id: 4, name: "Commentator", isNew: false,
    permissions: ["view announcements","view profile","edit profile"],
  },
]);

/* ── Search (table) ──────────────────────────────── */
const search = ref("");
const filteredRoles = computed(() =>
  roles.value.filter(r =>
    !search.value || r.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

/* ── CREATE modal ────────────────────────────────── */
const showCreateModal = ref(false);
const createForm      = ref({ name: "" });

const openCreateModal = () => {
  createForm.value = { name: "" };
  showCreateModal.value = true;
};

const saveCreate = () => {
  if (!createForm.value.name.trim()) return;
  roles.value.unshift({
    id: Date.now(),
    name: createForm.value.name.trim(),
    permissions: [],
    isNew: true,
  });
  setTimeout(() => {
    const r = roles.value.find(r => r.isNew);
    if (r) r.isNew = false;
  }, 2000);
  showCreateModal.value = false;
};

/* ── EDIT modal ──────────────────────────────────── */
const showEditModal = ref(false);
const editTarget    = ref(null);
const permSearch    = ref("");

const editForm = ref({ name: "", selectedPerms: [] });

// permission search inside edit modal
const filteredAllPermissions = computed(() =>
  allPermissions.value.filter(p =>
    !permSearch.value || p.name.toLowerCase().includes(permSearch.value.toLowerCase())
  )
);

const openEditModal = (role) => {
  editTarget.value = role;
  permSearch.value = "";
  editForm.value = {
    name: role.name,
    // match by name → get ids
    selectedPerms: allPermissions.value
      .filter(p => role.permissions.includes(p.name))
      .map(p => p.id),
  };
  showEditModal.value = true;
};

const selectAll = () => {
  editForm.value.selectedPerms = filteredAllPermissions.value.map(p => p.id);
};

const saveEdit = () => {
  if (!editForm.value.name.trim() || !editTarget.value) return;
  editTarget.value.name = editForm.value.name.trim();
  editTarget.value.permissions = allPermissions.value
    .filter(p => editForm.value.selectedPerms.includes(p.id))
    .map(p => p.name);
  showEditModal.value = false;
};

/* ── DELETE modal ────────────────────────────────── */
const showDeleteModal = ref(false);
const deleteTarget    = ref(null);

const confirmDelete = (role) => { deleteTarget.value = role; showDeleteModal.value = true; };
const deleteRole    = () => {
  roles.value = roles.value.filter(r => r.id !== deleteTarget.value.id);
  showDeleteModal.value = false;
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
.role-row { transition: background 0.1s; }
.role-row:hover { background: #fafcff; }
.role-row:last-child td { border-bottom: none; }
.role-row.is-new { animation: flash 2s ease-out; }
@keyframes flash { 0% { background: #dbeafe; } 100% { background: transparent; } }

.idx-cell { color: #cbd5e1; font-size: 0.78rem; width: 40px; }

.role-name { font-weight: 600; font-size: 0.9rem; color: #0f172a; }

/* Permission pills (preview) */
.perm-pills { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.perm-pill {
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 0.68rem; background: #f1f5f9; color: #0c4a6e;
  padding: 2px 8px; border-radius: 5px; border: 1px solid #e2e8f0;
}
.perm-more {
  font-size: 0.72rem; color: #94a3b8; font-weight: 500;
}
.perm-none { font-size: 0.75rem; color: #cbd5e1; font-style: italic; }

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

.empty-cell { text-align: center; padding: 48px 16px !important; color: #94a3b8; }
.empty-cell p { margin: 10px 0 0; font-size: 0.875rem; }

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
.modal-lg  { max-width: 560px; }
.modal-sm  { max-width: 360px; padding: 28px 24px; text-align: center; }

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

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }

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

/* Permissions section inside edit modal */
.perm-section { display: flex; flex-direction: column; gap: 10px; }

.perm-section-header {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.selected-count { font-size: 0.75rem; color: #94a3b8; margin-left: auto; }
.link-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  font-size: 0.75rem; font-weight: 600; color: #0369a1;
  font-family: "DM Sans", sans-serif; transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }
.sep { color: #cbd5e1; font-size: 0.75rem; }

/* Search inside modal */
.perm-search-wrap {
  position: relative; display: flex; align-items: center;
}
.psearch-icon { position: absolute; left: 10px; pointer-events: none; }
.perm-search {
  width: 100%; padding: 7px 12px 7px 30px;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 0.82rem; font-family: "DM Sans", sans-serif; color: #0f172a;
  background: #f8fafc; outline: none;
  transition: border-color 0.15s;
}
.perm-search:focus { border-color: #0369a1; }
.perm-search::placeholder { color: #cbd5e1; }

/* Checkbox list */
.perm-list {
  max-height: 280px; overflow-y: auto;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 6px;
  display: flex; flex-direction: column; gap: 2px;
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
.perm-check-item.checked .perm-slug {
  background: #dbeafe; border-color: #bae6fd; color: #1e40af;
}

.no-perms {
  text-align: center; padding: 20px; font-size: 0.82rem; color: #94a3b8;
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
  padding: 8px 20px; border: none; border-radius: 9px;
  background: linear-gradient(135deg, #0c4a6e, #0369a1);
  color: white; font-family: "DM Sans", sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(3,105,161,0.25);
  transition: opacity 0.15s;
}
.btn-save:hover:not(:disabled) { opacity: 0.9; }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

/* Delete */
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