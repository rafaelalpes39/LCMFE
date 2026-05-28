<template>
  <div class="settings-page">

    <div class="settings-grid">

      <!-- LEFT -->
      <div class="settings-left">

        <!-- PERSONAL INFO -->
        <div class="card">

          <div class="section-header">
            <div>
              <h2>Personal Information</h2>
              <p>Manage your account details and profile information.</p>
            </div>

            <!-- PHOTO -->
            <div class="photo-section">

              <div class="avatar-wrapper">
                <img
                  v-if="previewPhoto || form.profile_photo"
                  :src="previewPhoto || form.profile_photo"
                  class="profile-avatar"
                />

                <div
                  v-else
                  class="profile-avatar placeholder-avatar"
                >
                  {{ initials(form.name) }}
                </div>
              </div>

              <label class="upload-btn">
                <v-icon size="16">mdi-camera-outline</v-icon>
                Upload

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  @change="handlePhotoUpload"
                />
              </label>

            </div>
          </div>

          <div class="form-grid">

            <div class="form-group full-width">
              <label>Full Name</label>

              <input
                v-model="form.name"
                type="text"
                class="input"
                placeholder="Enter full name"
              />
            </div>

            <div class="form-group">
              <label>Email Address</label>

              <input
                v-model="form.email"
                type="email"
                class="input"
                placeholder="Enter email address"
              />
            </div>

            <div class="form-group">
              <label>Contact Number</label>

              <input
                v-model="form.cp_number"
                type="text"
                class="input"
                placeholder="09XXXXXXXXX"
              />
            </div>

            <div class="form-group">
              <label>Birthday</label>

              <input
                v-model="form.birthday"
                type="date"
                class="input"
              />
            </div>

          </div>
        </div>

        <!-- MEMBERSHIP -->
        <div class="card">

          <div class="section-header-simple">
            <div>
              <h2>Membership Details</h2>
              <p>Manage church and membership information.</p>
            </div>
          </div>

          <div class="form-grid">

            <div class="form-group">
              <label>Membership ID</label>

              <input
                v-model="form.membership_id"
                type="text"
                class="input"
                placeholder="Membership ID"
              />
            </div>

            <div class="form-group">
              <label>Date Joined</label>

              <input
                v-model="form.date_joined"
                type="date"
                class="input"
              />
            </div>

            <div class="form-group">
              <label>Parish</label>

              <input
                v-model="form.parish"
                type="text"
                class="input"
                placeholder="Parish"
              />
            </div>

            <div class="form-group">
              <label>Marital Status</label>

              <select
                v-model="form.marital_status"
                class="input"
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>

          </div>

        </div>

      </div>

      <!-- RIGHT -->
      <div class="settings-right">

        <!-- SECURITY -->
        <div class="card">

          <div class="section-header-simple">
            <div>
              <h2>Security</h2>
              <p>Update and secure your password.</p>
            </div>
          </div>

          <div class="form-grid single-grid">

            <div class="form-group">
              <label>Current Password</label>

              <input
                v-model="passwordForm.current_password"
                type="password"
                class="input"
                placeholder="Current password"
              />
            </div>

            <div class="form-group">
              <label>New Password</label>

              <input
                v-model="passwordForm.new_password"
                type="password"
                class="input"
                placeholder="New password"
              />
            </div>

            <div class="form-group">
              <label>Confirm Password</label>

              <input
                v-model="passwordForm.confirm_password"
                type="password"
                class="input"
                placeholder="Confirm password"
              />
            </div>

          </div>

          <button
            class="save-btn secondary-btn"
            @click="changePassword"
          >
            <v-icon size="16">mdi-lock-reset</v-icon>
            Change Password
          </button>

        </div>

        <!-- SAVE -->
        <div class="card save-card">

          <div class="save-content">

            <div>
              <h2>Save Changes</h2>
              <p>Save all updated information.</p>
            </div>

            <button
              class="save-btn"
              @click="saveProfile"
            >
              <v-icon size="16">mdi-content-save-outline</v-icon>
              Save Profile
            </button>

          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'authenticated',
  middleware: 'auth',
})

const config = useRuntimeConfig()

const form = ref({
  name: '',
  email: '',
  cp_number: '',
  birthday: '',
  membership_id: '',
  date_joined: '',
  parish: '',
  marital_status: '',
  profile_photo: '',
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const previewPhoto = ref(null)

const initials = (name) => {
  return (name || '?')
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const fetchProfile = async () => {
  try {

    const token = localStorage.getItem('token')

    const response = await $fetch(
      `${config.public.apiBase}/api/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    form.value = {
      ...form.value,
      ...response,
    }

  } catch (error) {
    console.error('Failed to fetch profile:', error)
  }
}

const handlePhotoUpload = (event) => {
  const file = event.target.files[0]

  if (!file) return

  previewPhoto.value = URL.createObjectURL(file)
  form.value.profile_photo = file
}

const saveProfile = async () => {
  try {

    const token = localStorage.getItem('token')

    const payload = new FormData()

    Object.keys(form.value).forEach((key) => {
      if (
        form.value[key] !== null &&
        form.value[key] !== ''
      ) {
        payload.append(key, form.value[key])
      }
    })

    await $fetch(
      `${config.public.apiBase}/api/profile/update`,
      {
        method: 'POST',
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    alert('Profile updated successfully')

  } catch (error) {
    console.error(error)
    alert('Failed to update profile')
  }
}

const changePassword = async () => {
  try {

    if (
      passwordForm.value.new_password !==
      passwordForm.value.confirm_password
    ) {
      return alert('Password confirmation does not match')
    }

    const token = localStorage.getItem('token')

    await $fetch(
      `${config.public.apiBase}/api/change-password`,
      {
        method: 'POST',
        body: passwordForm.value,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    alert('Password changed successfully')

    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: '',
    }

  } catch (error) {
    console.error(error)
    alert('Failed to change password')
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}



.settings-grid {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr;
  gap: 20px;
  align-items: start;
}

.settings-left,
.settings-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* CARD */

.card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 24px;
  box-shadow:
    0 4px 20px rgba(15, 23, 42, 0.04);
}

/* SECTION */

.section-header,
.section-header-simple {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.section-header h2,
.section-header-simple h2,
.save-content h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.section-header p,
.section-header-simple p,
.save-content p {
  margin-top: 5px;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.5;
}

/* PHOTO */

.photo-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-wrapper {
  position: relative;
}

.profile-avatar {
  width: 82px;
  height: 82px;
  border-radius: 24px;
  object-fit: cover;
  border: 3px solid #dbeafe;
}

.placeholder-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e40af);
  color: white;
  font-size: 1.4rem;
  font-weight: 700;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.upload-btn:hover {
  background: #dbeafe;
}

/* FORM */

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.single-grid {
  grid-template-columns: 1fr;
}

.full-width {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}

.input {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  border-radius: 16px;
  padding: 13px 14px;
  font-size: 0.92rem;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
  outline: none;
  transition: 0.2s ease;
}

.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
}

/* BUTTON */

.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 16px;
  padding: 13px 18px;
  background: linear-gradient(135deg, #0f172a, #2563eb);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

.secondary-btn {
  width: 100%;
  margin-top: 12px;
  background: linear-gradient(135deg, #334155, #0f172a);
}

/* SAVE */

.save-card {
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.95),
      rgba(239,246,255,0.95)
    );
}

.save-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

/* RESPONSIVE */

@media (max-width: 1100px) {

  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {

  .settings-page {
    padding: 14px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: span 1;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .save-content {
    flex-direction: column;
    align-items: stretch;
  }

  .save-btn {
    width: 100%;
  }

  .card {
    padding: 18px;
    border-radius: 20px;
  }
}

@media (max-width: 480px) {

  .settings-page {
    padding: 10px;
  }

  .card {
    padding: 16px;
    border-radius: 18px;
  }

  .profile-avatar {
    width: 72px;
    height: 72px;
  }

  .input {
    font-size: 0.88rem;
    padding: 12px;
  }

  .save-btn {
    font-size: 0.88rem;
  }
}
</style>