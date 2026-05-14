<template>
  <div class="login-page">

    <!-- LEFT PANEL — artwork -->
    <div class="art-panel">
      <div class="art-overlay" />
      <v-img
        class="art-image"
        src="/images/logo.png"
        alt="Saint John Bosco"
      />
      <div class="art-caption">
        <div class="art-caption-title">Saint John Bosco</div>
        <div class="art-caption-sub">Patron of the Ministry</div>
      </div>
    </div>

    <!-- RIGHT PANEL — login form -->
    <div class="form-panel">
      <div class="form-inner">

        <!-- Logo + Heading -->
        <div class="form-heading">

              <div class="logo-img-wrap">
            <img
              src=""
              alt="Lectors & Commentators Ministry Logo"
              class="logo-img"
            />
          </div>
          <!-- Ministry logo -->
          <div class="logo-block">
            <div class="logo-icon">
              <span class="logo-cross">✝</span>
            </div>
            <div class="logo-text">
              <div class="logo-name">Lectors &amp; Commentators Ministry</div>
              <div class="logo-sub">Saint John Bosco Parish · Tondo, Manila</div>
            </div>
          </div>

          <!-- <h1 class="form-title">Welcome back</h1> -->
          <!-- <p class="form-subtitle">Sign in to your ministry portal account</p> -->
        </div>

        <!-- Form -->
        <form class="form" @submit.prevent="handleLogin">

          <div class="field">
            <label class="label">Email address</label>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input
                v-model="form.email"
                type="email"
                class="input"
                placeholder="you@sjbparish.org"
                autocomplete="email"
              />
            </div>
          </div>

          <div class="field">
            <div class="label-row">
              <label class="label">Password</label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>
            <div class="input-wrap">
              <span class="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <div class="remember-row">
            <label class="remember">
              <input type="checkbox" v-model="form.remember" class="checkbox" />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button type="submit" class="submit-btn" :class="{ loading: isLoading }">
            <span v-if="!isLoading">Sign in</span>
            <span v-else class="spinner" />
          </button>

        </form>

        <!-- Footer -->
        <p class="form-footer">
          Having trouble? Contact your
          <a href="#" class="footer-link">parish administrator</a>
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from "vue";

const form = ref({ email: "", password: "", remember: false });
const showPassword = ref(false);
const isLoading = ref(false);

async function handleLogin() {
  isLoading.value = true;
  await new Promise(r => setTimeout(r, 1500));
  isLoading.value = false;
  // router.push("/") — add your redirect here
}
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600;700&display=swap");
</style>

<style scoped>
/* ── Reset / Base ─────────────────────────────── */
* { box-sizing: border-box; margin: 0; padding: 0; }


.logo-img-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-img {
  width: 110px;
  height: 110px;
  object-fit: contain;
  border-radius: 50%;
  border: 3px solid #e0f2fe;
  box-shadow: 0 4px 20px rgba(3, 105, 161, 0.15);
  background: #f0f9ff;
  padding: 8px;
}

.login-page {
  display: flex;
  min-height: 100vh;
  font-family: "DM Sans", sans-serif;
  background: #f1f5f9;
}

/* ── LEFT: Art Panel ──────────────────────────── */
.art-panel {
  position: relative;
  flex: 0 0 42%;
  overflow: hidden;
  display: none;
}
@media (min-width: 900px) { .art-panel { display: block; } }

.art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.art-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(12, 74, 110, 0.18) 0%,
    rgba(12, 74, 110, 0.0) 40%,
    rgba(12, 74, 110, 0.55) 100%
  );
  z-index: 1;
}

.art-caption {
  position: absolute;
  bottom: 32px;
  left: 32px;
  right: 32px;
  z-index: 2;
}
.art-caption-title {
  font-family: "Playfair Display", serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 12px rgba(0,0,0,0.4);
  line-height: 1.2;
}
.art-caption-sub {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.75);
  margin-top: 4px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ── RIGHT: Form Panel ────────────────────────── */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: white;
  min-height: 100vh;
}

.form-inner {
  width: 100%;
  max-width: 400px;
}

/* ── Logo Block ───────────────────────────────── */
.form-heading {
  margin-bottom: 32px;
}

.logo-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.logo-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(3, 105, 161, 0.35);
}

.logo-cross {
  color: white;
  font-size: 1.35rem;
  line-height: 1;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-name {
  font-family: "Playfair Display", serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.25;
}

.logo-sub {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 3px;
  letter-spacing: 0.02em;
}

/* ── Heading ──────────────────────────────────── */
.form-title {
  font-family: "Playfair Display", serif;
  font-size: 2rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.form-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 8px;
  line-height: 1.5;
}

/* ── Fields ───────────────────────────────────── */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.01em;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
}

.input {
  width: 100%;
  padding: 11px 42px 11px 42px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: "DM Sans", sans-serif;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.input::placeholder { color: #cbd5e1; }
.input:focus {
  border-color: #0369a1;
  background: white;
  box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.1);
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color 0.15s;
}
.eye-btn:hover { color: #0369a1; }

.forgot-link {
  font-size: 0.78rem;
  color: #0369a1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}
.forgot-link:hover { color: #0c4a6e; }

/* ── Remember ─────────────────────────────────── */
.remember-row { margin-top: -4px; }
.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: #475569;
  cursor: pointer;
  user-select: none;
}
.checkbox {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  accent-color: #0369a1;
  cursor: pointer;
}

/* ── Submit ───────────────────────────────────── */
.submit-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%);
  color: white;
  font-family: "DM Sans", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 14px rgba(3, 105, 161, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 4px;
}
.submit-btn:hover:not(.loading) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(3, 105, 161, 0.4);
}
.submit-btn:active:not(.loading) { transform: translateY(0); }
.submit-btn.loading { opacity: 0.75; cursor: not-allowed; }

/* ── Spinner ──────────────────────────────────── */
.spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Footer ───────────────────────────────────── */
.form-footer {
  text-align: center;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 28px;
}
.footer-link {
  color: #0369a1;
  text-decoration: none;
  font-weight: 500;
}
.footer-link:hover { text-decoration: underline; }

/* ── Mobile ───────────────────────────────────── */
@media (max-width: 899px) {
  .form-panel {
    background: white;
    padding: 48px 24px;
  }
  .login-page::before {
    content: "";
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(to right, #0c4a6e, #38bdf8);
    z-index: 10;
  }
}
</style>