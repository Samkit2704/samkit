(function () {
  "use strict";

  const data = window.NEXUS_DATA;
  let activeBilling = "monthly";
  let activeCurrency = "USD";
  let supabaseClient;
  let adminClient;
  let supabaseLoadPromise;
  let portalSession;
  let adminSession;
  let adminRecords = [];
  let adminDrafts = {};
  let activeAdminSection = "packages";
  let activeAdminRecord = 0;
  const adminSections = {
    packages: "Packages",
    services: "Services",
    reviews: "Reviews",
    cases: "Case studies",
    faqs: "FAQs",
    process: "Process",
    clients: "Client logos"
  };
  const iconSvg = (symbol) => `<span class="service-icon-glyph" aria-hidden="true">${symbol}</span>`;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function renderServices() {
    document.getElementById("services-grid").innerHTML = data.services.map((service) => `
      <article class="service-card glass-card">
        <div class="service-top"><span class="service-icon ${escapeHtml(service.color)}">${iconSvg(escapeHtml(service.icon))}</span><span class="category-tag">${escapeHtml(service.category)}</span></div>
        <h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p>
        <ul>${service.bullets.map((item) => `<li><span>✓</span>${escapeHtml(item)}</li>`).join("")}</ul>
        <div class="service-metric"><span class="metric-spark">↗</span>${escapeHtml(service.metric)}</div>
      </article>`).join("");
  }

  function renderClients() {
    const logos = [...data.clients, ...data.clients];
    document.querySelector(".marquee-track").innerHTML = logos.map((logo, index) => `<span class="client-logo logo-${index % data.clients.length}">${escapeHtml(logo)}</span>${index < logos.length - 1 ? '<i aria-hidden="true">✳</i>' : ""}`).join("");
  }

  function renderCases() {
    document.getElementById("case-grid").innerHTML = data.cases.map((item) => `
      <article class="case-card glass-card">
        <div class="case-visual ${escapeHtml(item.chart)}"><div class="case-visual-top"><span class="case-company-mark">${escapeHtml(item.initials)}</span><span class="case-result-pill"><i></i>${escapeHtml(item.metric)}</span></div><div class="case-chart" aria-hidden="true"><span style="height:25%"></span><span style="height:33%"></span><span style="height:31%"></span><span style="height:48%"></span><span style="height:42%"></span><span style="height:56%"></span><span style="height:53%"></span><span style="height:72%"></span><span style="height:68%"></span><span style="height:85%"></span><span style="height:79%"></span><span style="height:100%"></span></div><div class="case-chart-labels"><span>BEFORE</span><span>AFTER</span></div></div>
        <div class="case-content"><span class="case-industry">${escapeHtml(item.industry)}</span><h3>${escapeHtml(item.title)}</h3><div class="case-detail"><span>THE CHALLENGE</span><p>${escapeHtml(item.problem)}</p></div><div class="case-detail"><span>THE PLAYBOOK</span><p>${escapeHtml(item.strategy)}</p></div><table class="case-results" aria-label="${escapeHtml(item.company)} before and after results"><thead><tr><th scope="col">MEASURE</th><th scope="col">BEFORE</th><th scope="col">AFTER</th></tr></thead><tbody>${item.results.map((result) => `<tr><th scope="row">${escapeHtml(result.metric)}</th><td>${escapeHtml(result.before)}</td><td class="case-after">${escapeHtml(result.after)}</td></tr>`).join("")}</tbody></table><button type="button" class="case-link" data-open-modal data-plan="${escapeHtml(item.company)} growth plan">Explore similar growth <span>↗</span></button></div>
      </article>`).join("");
  }

  function renderPackages(billing, currency) {
    const formatPrice = (amount) => new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
    const formatFeature = (feature) => currency === "INR"
      ? feature.replace("$8k", "₹6.6 lakh").replace("$35k", "₹29 lakh")
      : feature;
    document.getElementById("pricing-grid").innerHTML = data.packages.map((plan) => `
      <article class="pricing-card glass-card ${plan.popular ? "popular" : ""}">
        ${plan.popular ? '<span class="popular-ribbon">MOST POPULAR</span>' : ""}
        <div class="plan-icon">${escapeHtml(plan.icon)}</div><h3>${escapeHtml(plan.name)}</h3><p class="plan-description">${escapeHtml(plan.descriptor)}</p>
        <div class="plan-price"><strong>${formatPrice(plan.prices[currency][billing])}</strong><span>/ month</span></div>
        <p class="plan-billing">${billing === "quarterly" ? `Billed quarterly · Save 15% · ${currency}` : `Billed monthly · Cancel anytime · ${currency}`}</p>
        <button class="button ${plan.popular ? "button-primary" : "button-outline"} button-full plan-button" type="button" data-open-modal data-plan="${escapeHtml(plan.name)}">${escapeHtml(plan.cta)} <span aria-hidden="true">↗</span></button>
        <div class="plan-divider"></div><span class="features-label">WHAT'S INCLUDED</span><ul class="plan-features">${plan.features.map((feature) => `<li><span>✓</span>${escapeHtml(formatFeature(feature))}</li>`).join("")}</ul>
      </article>`).join("");
  }

  function renderReviews(filter) {
    const reviews = filter === "all" ? data.reviews : data.reviews.filter((review) => review.category === filter);
    document.getElementById("reviews-grid").innerHTML = reviews.map((review) => `
      <article class="review-card glass-card"><div class="review-top"><span class="review-stars" aria-label="5 out of 5 stars">★★★★★</span><span class="verified-badge"><i>✓</i> VERIFIED GROWTH</span></div><blockquote>“${escapeHtml(review.quote)}”</blockquote><div class="review-result"><span>↗</span>${escapeHtml(review.result)}</div><div class="review-person"><span class="person-avatar">${escapeHtml(review.initials)}</span><span><strong>${escapeHtml(review.name)}</strong><small>${escapeHtml(review.title)}, ${escapeHtml(review.company)}</small></span><span class="review-check" aria-label="Verified customer">✓</span></div></article>`).join("");
  }

  function renderProcess() {
    document.getElementById("process-list").innerHTML = data.process.map((step) => `
      <article class="process-step"><div class="step-number">${escapeHtml(step.number)}</div><div class="step-copy"><span>${escapeHtml(step.tag)}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></div><div class="step-mark" aria-hidden="true">↗</div></article>`).join("");
  }

  function renderFaqs() {
    document.getElementById("faq-list").innerHTML = data.faqs.map((faq, index) => `
      <details class="faq-item" ${index === 0 ? "open" : ""}><summary>${escapeHtml(faq.question)}<span class="faq-toggle" aria-hidden="true"></span></summary><div class="faq-answer"><p>${escapeHtml(faq.answer)}</p></div></details>`).join("");
  }

  function updateCalculator() {
    const budget = Number(document.getElementById("budget").value);
    const conversion = Number(document.getElementById("conversion").value);
    const aov = Number(document.getElementById("aov").value);
    const roas = 3.2 + conversion * 0.36 + (aov / 600) * 0.8;
    const revenue = budget * roas;
    const orders = revenue / aov;
    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    document.getElementById("budget-value").textContent = currency.format(budget);
    document.getElementById("conversion-value").textContent = `${conversion.toFixed(1)}%`;
    document.getElementById("aov-value").textContent = currency.format(aov);
    document.getElementById("revenue-result").textContent = currency.format(revenue);
    document.getElementById("roas-result").textContent = `${roas.toFixed(1)}x`;
    document.getElementById("orders-result").textContent = Math.round(orders).toLocaleString("en-US");
    document.getElementById("net-result").textContent = currency.format(revenue - budget);
    document.querySelectorAll(".range-control input").forEach((input) => {
      const percent = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
      input.style.setProperty("--range-progress", `${percent}%`);
    });
  }

  const modal = document.querySelector(".booking-modal");
  function openModal(button) {
    const plan = button && button.dataset.plan ? button.dataset.plan : "";
    document.getElementById("selected-plan").value = plan || (button && button.dataset.modalSource === "calculator" ? "Custom growth model" : "");
    if (!modal.open) modal.showModal();
  }

  function showToast(message) {
    const toast = document.querySelector(".toast");
    document.getElementById("toast-message").textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 6000);
  }

  function initializeNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".nav-links");
    const backdrop = document.querySelector(".nav-backdrop");
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("open");
      backdrop.classList.remove("visible");
      document.body.classList.remove("menu-open");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      nav.classList.toggle("open", open);
      backdrop.classList.toggle("visible", open);
      document.body.classList.toggle("menu-open", open);
    });
    backdrop.addEventListener("click", closeMenu);
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    nav.querySelector("[data-open-portal]").addEventListener("click", closeMenu);
    nav.querySelector("[data-open-admin]").addEventListener("click", closeMenu);
  }

  function initializeModal() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-open-modal]");
      if (button) openModal(button);
    });
    document.querySelector(".modal-close").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    });
    document.getElementById("booking-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const button = form.querySelector(".submit-button");
      button.classList.add("is-loading");
      button.disabled = true;
      window.setTimeout(() => {
        const name = new FormData(form).get("name").toString().trim().split(/\s+/)[0];
        form.reset();
        button.classList.remove("is-loading");
        button.disabled = false;
        modal.close();
        showToast(`Thanks, ${name} — we'll be in touch within one business day.`);
      }, 1000);
    });
    document.querySelector(".toast button").addEventListener("click", () => document.querySelector(".toast").classList.remove("visible"));
  }

  const portalDialog = document.querySelector(".portal-modal");
  const portalContent = document.getElementById("portal-content");
  const portalMessage = document.querySelector(".portal-message");
  const adminDialog = document.querySelector(".admin-modal");
  const adminContent = document.getElementById("admin-content");
  const adminMessage = document.querySelector(".admin-message");

  function setPortalMessage(message, type) {
    portalMessage.textContent = message;
    portalMessage.className = `portal-message ${type || "info"}`;
    portalMessage.hidden = !message;
  }

  function getSupabaseClient() {
    if (supabaseClient) return Promise.resolve(supabaseClient);
    const config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey) {
      return Promise.reject(new Error("Client login is not configured yet. Add your Supabase project URL and anon public key to js/supabase-config.js."));
    }
    if (!supabaseLoadPromise) {
      supabaseLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.async = true;
        script.onload = () => {
          if (!window.supabase || typeof window.supabase.createClient !== "function") {
            reject(new Error("Supabase authentication could not be initialized. Please try again."));
            return;
          }
          try {
            supabaseClient = window.supabase.createClient(config.url, config.anonKey);
            supabaseClient.auth.onAuthStateChange((event) => {
              if (event === "PASSWORD_RECOVERY") {
                if (!portalDialog.open) portalDialog.showModal();
                showPortalForm("update");
              }
            });
            resolve(supabaseClient);
          } catch (error) {
            reject(new Error(`Could not initialize Supabase: ${error.message}`));
          }
        };
        script.onerror = () => reject(new Error("Could not load the authentication service. Check your connection and try again."));
        document.head.appendChild(script);
      });
      supabaseLoadPromise = supabaseLoadPromise.catch((error) => {
        supabaseLoadPromise = null;
        throw error;
      });
    }
    return supabaseLoadPromise;
  }

  function showPortalForm(view) {
    const viewCopy = {
      login: ["Sign in", "Use your client account email and password."],
      signup: ["Create your account", "Create an account to request a package and access your client portal."],
      reset: ["Reset your password", "We’ll email you a secure password reset link."],
      update: ["Choose a new password", "Set a new password for your client account."]
    }[view];
    setPortalMessage("", "");
    portalContent.innerHTML = `
      <form class="portal-form" data-portal-form="${view}">
        ${view === "update" ? "" : `<label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@company.com" required></label>`}
        ${view === "login" || view === "signup" ? `<label>Password<input name="password" type="password" autocomplete="${view === "login" ? "current-password" : "new-password"}" minlength="8" placeholder="At least 8 characters" required></label>` : ""}
        ${view === "update" ? `<label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required></label><label>Confirm new password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Enter it again" required></label>` : ""}
        <button class="button button-primary button-full" type="submit">${viewCopy[0]}</button>
      </form>
      <p class="portal-form-copy">${viewCopy[1]}</p>
      <div class="portal-form-links">${view === "login"
        ? '<button type="button" data-portal-view="reset">Forgot password?</button><span>New here? <button type="button" data-portal-view="signup">Create an account</button></span>'
        : view === "signup"
          ? '<span>Already have an account? <button type="button" data-portal-view="login">Sign in</button></span>'
          : view === "update"
            ? ""
            : '<button type="button" data-portal-view="login">Back to sign in</button>'}</div>`;
    portalContent.querySelector("[data-portal-form]").addEventListener("submit", (event) => handlePortalSubmit(event, view));
    portalContent.querySelectorAll("[data-portal-view]").forEach((button) => {
      button.addEventListener("click", () => showPortalForm(button.dataset.portalView));
    });
  }

  function showPackagePicker(session) {
    portalSession = session;
    portalContent.innerHTML = `
      <div class="portal-account"><span class="portal-avatar">${escapeHtml(session.user.email.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(session.user.email)}</strong><small>Signed in</small></span><button type="button" class="portal-logout">Log out</button></div>
      <div class="portal-package-intro"><h3>Choose your package</h3><p>Select a package to request. Our team will confirm the scope and start date with you.</p></div>
      <form class="portal-form" data-portal-form="package">
        <label>Growth package<select name="package" required><option value="" selected disabled>Choose a package</option>${data.packages.map((plan) => `<option value="${escapeHtml(plan.name)}">${escapeHtml(plan.name)} — $${plan.prices.USD.monthly.toLocaleString("en-US")} / ₹${plan.prices.INR.monthly.toLocaleString("en-IN")} per month</option>`).join("")}</select></label>
        <button class="button button-primary button-full" type="submit">Request selected package <span aria-hidden="true">↗</span></button>
      </form>`;
    portalContent.querySelector(".portal-logout").addEventListener("click", handlePortalLogout);
    portalContent.querySelector("[data-portal-form]").addEventListener("submit", handlePackageRequest);
  }

  function showClientDashboard(session, account) {
    portalSession = session;
    const packageName = document.createElement("strong");
    packageName.textContent = account.package_name;
    const status = document.createElement("span");
    status.className = `portal-plan-status ${account.status === "active" ? "is-active" : ""}`;
    status.textContent = account.status === "active" ? "Active" : account.status.replace(/_/g, " ");
    portalContent.innerHTML = `
      <div class="portal-account"><span class="portal-avatar">${escapeHtml(session.user.email.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(session.user.email)}</strong><small>Client account</small></span><button type="button" class="portal-logout">Log out</button></div>
      <section class="portal-plan-card"><span class="section-kicker"><i></i> YOUR PACKAGE</span><div class="portal-package-name"></div><div class="portal-status-row"></div><p>${account.status === "active" ? "Your growth partnership is active. Contact your account lead if you need help." : "Your request is received. Our team will confirm your package and start date shortly."}</p></section>`;
    portalContent.querySelector(".portal-package-name").appendChild(packageName);
    portalContent.querySelector(".portal-status-row").appendChild(status);
    portalContent.querySelector(".portal-logout").addEventListener("click", handlePortalLogout);
  }

  async function loadClientAccount(session) {
    try {
      setPortalMessage("Loading your client account…", "info");
      const client = await getSupabaseClient();
      const { data: account, error } = await client.from("client_accounts")
        .select("package_name, status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      if (account) {
        setPortalMessage("", "");
        showClientDashboard(session, account);
      } else {
        setPortalMessage("", "");
        showPackagePicker(session);
      }
    } catch (error) {
      console.error("Could not load the client account:", error);
      setPortalMessage(error.message || "Could not load your account. Please try again.", "error");
    }
  }

  async function handlePortalSubmit(event, view) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const email = values.get("email")?.toString().trim();
    const password = values.get("password")?.toString();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Please wait…";
    try {
      const client = await getSupabaseClient();
      if (view === "login") {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await loadClientAccount(data.session);
      } else if (view === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
        });
        if (error) throw error;
        if (data.session) {
          await loadClientAccount(data.session);
        } else {
          showPortalForm("login");
          setPortalMessage("Account created. Check your email to confirm your address, then sign in to choose a package.", "success");
        }
      } else if (view === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${window.location.pathname}`
        });
        if (error) throw error;
        showPortalForm("login");
        setPortalMessage("If an account exists for that email, a secure password reset link has been sent.", "success");
      } else if (view === "update") {
        if (password !== values.get("confirmPassword")?.toString()) {
          throw new Error("The new passwords do not match.");
        }
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        showPortalForm("login");
        setPortalMessage("Your password has been updated. Sign in with your new password.", "success");
      }
    } catch (error) {
      console.error(`Client portal ${view} failed:`, error);
      setPortalMessage(error.message || "We couldn't complete that request. Please try again.", "error");
    } finally {
      if (submit.isConnected) {
        submit.disabled = false;
        submit.textContent = view === "login" ? "Sign in" : view === "signup" ? "Create your account" : view === "reset" ? "Send reset link" : "Update password";
      }
    }
  }

  async function handlePackageRequest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const client = await getSupabaseClient();
      const { data, error } = await client.from("client_accounts").insert({
        user_id: portalSession.user.id,
        email: portalSession.user.email,
        package_name: new FormData(form).get("package").toString(),
        status: "pending"
      }).select("package_name, status").single();
      if (error) throw error;
      setPortalMessage("Package request submitted. Our team will confirm it with you shortly.", "success");
      showClientDashboard(portalSession, data);
    } catch (error) {
      console.error("Could not submit package request:", error);
      setPortalMessage(error.message || "We couldn't submit your package request. Please try again.", "error");
      submit.disabled = false;
    }
  }

  async function handlePortalLogout() {
    try {
      const client = await getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      portalSession = null;
      showPortalForm("login");
      setPortalMessage("You have been logged out.", "success");
    } catch (error) {
      console.error("Client logout failed:", error);
      setPortalMessage(error.message || "We couldn't log you out. Please try again.", "error");
    }
  }

  function initializePortal() {
    document.addEventListener("click", async (event) => {
      if (!event.target.closest("[data-open-portal]")) return;
      showPortalForm("login");
      setPortalMessage("", "");
      if (!portalDialog.open) portalDialog.showModal();
      try {
        const client = await getSupabaseClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (data.session) await loadClientAccount(data.session);
      } catch (error) {
        console.error("Client portal initialization failed:", error);
        setPortalMessage(error.message || "Client login could not be initialized.", "error");
      }
    });
    document.querySelector(".portal-close").addEventListener("click", () => portalDialog.close());
    portalDialog.addEventListener("click", (event) => {
      if (event.target === portalDialog) portalDialog.close();
    });
  }

  function setAdminMessage(message, type) {
    adminMessage.textContent = message;
    adminMessage.className = `admin-message ${type || "info"}`;
    adminMessage.hidden = !message;
  }

  async function getAdminClient() {
    await getSupabaseClient();
    if (!adminClient) {
      const config = window.SUPABASE_CONFIG;
      adminClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: { storageKey: "samkit-series-admin-auth" }
      });
    }
    return adminClient;
  }

  function isAdmin(session) {
    return session?.user?.app_metadata?.role === "admin";
  }

  function showAdminLogin() {
    adminContent.innerHTML = `
      <form class="admin-login-form">
        <label>Administrator email<input name="email" type="email" autocomplete="username" placeholder="admin@yourcompany.com" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="button button-primary button-full" type="submit">Sign in to admin</button>
      </form>
      <p class="admin-login-note">Admin accounts are created and assigned in Supabase. Public sign-up is disabled here.</p>`;
    adminContent.querySelector(".admin-login-form").addEventListener("submit", handleAdminLogin);
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const client = await getAdminClient();
      const values = new FormData(form);
      const { data, error } = await client.auth.signInWithPassword({
        email: values.get("email").toString().trim(),
        password: values.get("password").toString()
      });
      if (error) throw error;
      if (!isAdmin(data.session)) {
        await client.auth.signOut();
        throw new Error("This account does not have administrator access.");
      }
      adminSession = data.session;
      await loadAdminDashboard();
    } catch (error) {
      console.error("Admin login failed:", error);
      setAdminMessage(error.message || "Could not sign in to the admin panel.", "error");
    } finally {
      if (submit.isConnected) submit.disabled = false;
    }
  }

  async function loadAdminDashboard() {
    setAdminMessage("Loading admin data…", "info");
    try {
      const client = await getAdminClient();
      const [contentResult, accountResult] = await Promise.all([
        client.from("site_content").select("section, content, updated_at"),
        client.from("client_accounts").select("user_id, email, package_name, status, created_at").order("created_at", { ascending: false })
      ]);
      if (contentResult.error) throw contentResult.error;
      if (accountResult.error) throw accountResult.error;
      adminRecords = accountResult.data || [];
      adminWorking = structuredClone(data);
      (contentResult.data || []).forEach((row) => {
        if (Object.hasOwn(adminSections, row.section) && Array.isArray(row.content)) {
          adminWorking[row.section] = row.content;
        }
      });
      adminDrafts = {};
      renderAdminDashboard("content");
      setAdminMessage("", "");
    } catch (error) {
      console.error("Could not load admin data:", error);
      setAdminMessage(error.message || "Could not load admin data. Confirm the admin SQL setup has been run.", "error");
    }
  }

  let adminWorking = {};

  function renderAdminDashboard(tab) {
    const sections = Object.entries(adminSections).map(([key, label]) => `<option value="${key}" ${key === activeAdminSection ? "selected" : ""}>${label}</option>`).join("");
    adminContent.innerHTML = `
      <div class="admin-toolbar"><span class="admin-signed-in">Signed in as <strong>${escapeHtml(adminSession.user.email)}</strong></span><button type="button" class="admin-logout">Log out</button></div>
      <div class="admin-tabs" role="tablist" aria-label="Admin sections"><button type="button" data-admin-tab="content" class="${tab === "content" ? "active" : ""}" role="tab" aria-selected="${tab === "content"}">Site content</button><button type="button" data-admin-tab="accounts" class="${tab === "accounts" ? "active" : ""}" role="tab" aria-selected="${tab === "accounts"}">Client packages <span>${adminRecords.length}</span></button></div>
      <section class="admin-view ${tab === "content" ? "active" : ""}" data-admin-view="content">
        <label class="admin-section-select">Content area<select id="admin-section">${sections}</select></label>
        <div id="admin-editor"></div>
      </section>
      <section class="admin-view ${tab === "accounts" ? "active" : ""}" data-admin-view="accounts">
        <p class="admin-help">Review client package requests and update the assigned package or status.</p>
        <div id="admin-accounts"></div>
      </section>`;
    adminContent.querySelector(".admin-logout").addEventListener("click", handleAdminLogout);
    adminContent.querySelectorAll("[data-admin-tab]").forEach((button) => {
      button.addEventListener("click", () => renderAdminDashboard(button.dataset.adminTab));
    });
    adminContent.querySelector("#admin-section").addEventListener("change", (event) => {
      saveCurrentAdminDraft();
      activeAdminSection = event.target.value;
      activeAdminRecord = 0;
      renderAdminEditor();
    });
    renderAdminEditor();
    renderAdminAccounts();
  }

  function adminRecordLabel(item, index) {
    if (typeof item === "string") return item || `Item ${index + 1}`;
    return item.name || item.title || item.company || item.question || item.number || `Item ${index + 1}`;
  }

  function saveCurrentAdminDraft() {
    const editor = adminContent.querySelector("#admin-record-json");
    if (editor) adminDrafts[`${activeAdminSection}:${activeAdminRecord}`] = editor.value;
  }

  function renderAdminEditor() {
    const items = adminWorking[activeAdminSection] || [];
    if (activeAdminRecord >= items.length) activeAdminRecord = Math.max(0, items.length - 1);
    const selected = items.length ? items[activeAdminRecord] : null;
    const itemOptions = items.map((item, index) => `<option value="${index}" ${index === activeAdminRecord ? "selected" : ""}>${escapeHtml(adminRecordLabel(item, index))}</option>`).join("");
    const savedDraft = adminDrafts[`${activeAdminSection}:${activeAdminRecord}`];
    const initialValue = savedDraft !== undefined ? savedDraft : selected === null ? "" : JSON.stringify(selected, null, 2);
    const editor = adminContent.querySelector("#admin-editor");
    if (!editor) return;
    editor.innerHTML = `
      <div class="admin-record-toolbar"><label>Record<select id="admin-record">${itemOptions}</select></label><div><button type="button" class="admin-secondary" data-admin-add>Add record</button><button type="button" class="admin-danger" data-admin-delete ${selected === null ? "disabled" : ""}>Delete</button></div></div>
      <label class="admin-json-label" for="admin-record-json">Record data <span>JSON · edit the selected record, then save this section</span></label>
      <textarea id="admin-record-json" spellcheck="false" ${selected === null ? "disabled" : ""}>${escapeHtml(initialValue)}</textarea>
      <div class="admin-save-row"><span class="admin-save-hint">Changes appear on the public site after saving.</span><button type="button" class="button button-primary admin-save" data-admin-save>Save ${escapeHtml(adminSections[activeAdminSection])}</button></div>`;
    editor.querySelector("#admin-record").addEventListener("change", (event) => {
      saveCurrentAdminDraft();
      activeAdminRecord = Number(event.target.value);
      renderAdminEditor();
    });
    editor.querySelector("[data-admin-add]").addEventListener("click", () => {
      saveCurrentAdminDraft();
      const newRecord = {
        packages: { name: "New package", descriptor: "", prices: { USD: { monthly: 0, quarterly: 0 }, INR: { monthly: 0, quarterly: 0 } }, features: [], cta: "Choose package", icon: "↗" },
        services: { icon: "✦", category: "CATEGORY", title: "New service", description: "", bullets: [], metric: "", color: "violet" },
        reviews: { category: "ecommerce", quote: "", name: "", title: "", company: "", initials: "", result: "" },
        cases: { industry: "", metric: "", title: "", company: "", problem: "", strategy: "", results: [], chart: "case-violet", initials: "" },
        faqs: { question: "", answer: "" },
        process: { number: "05", title: "", description: "", tag: "" },
        clients: "NEW CLIENT"
      }[activeAdminSection];
      adminWorking[activeAdminSection].push(newRecord);
      activeAdminRecord = adminWorking[activeAdminSection].length - 1;
      delete adminDrafts[`${activeAdminSection}:${activeAdminRecord}`];
      renderAdminEditor();
    });
    editor.querySelector("[data-admin-delete]").addEventListener("click", () => {
      if (!window.confirm("Delete this record? Save the section to publish this change.")) return;
      adminWorking[activeAdminSection].splice(activeAdminRecord, 1);
      delete adminDrafts[`${activeAdminSection}:${activeAdminRecord}`];
      activeAdminRecord = Math.max(0, activeAdminRecord - 1);
      renderAdminEditor();
    });
    editor.querySelector("[data-admin-save]").addEventListener("click", saveAdminSection);
  }

  function validateAdminSection(section, records) {
    if (!Array.isArray(records) || records.length === 0) throw new Error("A section must contain at least one record.");
    const requiredFields = {
      packages: ["name", "descriptor", "prices", "features", "cta", "icon"],
      services: ["icon", "category", "title", "description", "bullets", "metric", "color"],
      reviews: ["category", "quote", "name", "title", "company", "initials", "result"],
      cases: ["industry", "metric", "title", "company", "problem", "strategy", "results", "chart", "initials"],
      faqs: ["question", "answer"],
      process: ["number", "title", "description", "tag"]
    };
    if (section === "clients" && records.some((item) => typeof item !== "string" || !item.trim())) {
      throw new Error("Client logo records must be non-empty text.");
    }
    records.forEach((record, index) => {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        if (section === "clients") return;
        throw new Error(`Record ${index + 1} must be a JSON object.`);
      }
      (requiredFields[section] || []).forEach((field) => {
        if (!(field in record)) throw new Error(`Record ${index + 1} is missing "${field}".`);
      });
      if (section === "packages") {
        ["USD", "INR"].forEach((currency) => {
          ["monthly", "quarterly"].forEach((term) => {
            const price = record.prices[currency]?.[term];
            if (!Number.isFinite(Number(price)) || Number(price) < 0) {
              throw new Error(`Record ${index + 1} needs a non-negative ${currency} ${term} price.`);
            }
          });
        });
        if (!Array.isArray(record.features) || record.features.some((feature) => typeof feature !== "string")) {
          throw new Error(`Record ${index + 1} features must be an array of text.`);
        }
      }
      if (section === "services" && (!Array.isArray(record.bullets) || record.bullets.some((bullet) => typeof bullet !== "string"))) {
        throw new Error(`Record ${index + 1} bullets must be an array of text.`);
      }
      if (section === "cases" && (!Array.isArray(record.results) || record.results.some((result) =>
        !result || typeof result.metric !== "string" || typeof result.before !== "string" || typeof result.after !== "string"
      ))) {
        throw new Error(`Record ${index + 1} results must contain metric, before, and after text.`);
      }
    });
  }

  async function saveAdminSection() {
    saveCurrentAdminDraft();
    const records = [];
    try {
      adminWorking[activeAdminSection].forEach((_, index) => {
        const draft = adminDrafts[`${activeAdminSection}:${index}`];
        records.push(draft === undefined ? adminWorking[activeAdminSection][index] : JSON.parse(draft));
      });
      validateAdminSection(activeAdminSection, records);
      const client = await getAdminClient();
      const { error } = await client.from("site_content").upsert({
        section: activeAdminSection,
        content: records,
        updated_by: adminSession.user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: "section" });
      if (error) throw error;
      adminWorking[activeAdminSection] = records;
      data[activeAdminSection] = structuredClone(records);
      adminDrafts = {};
      renderWebsiteContent();
      renderAdminEditor();
      setAdminMessage(`${adminSections[activeAdminSection]} saved and published.`, "success");
    } catch (error) {
      console.error("Could not save admin content:", error);
      setAdminMessage(error instanceof SyntaxError ? `Invalid JSON: ${error.message}` : error.message || "Could not save this section.", "error");
    }
  }

  function renderAdminAccounts() {
    const container = adminContent.querySelector("#admin-accounts");
    if (!container) return;
    if (!adminRecords.length) {
      container.innerHTML = '<p class="admin-empty">No client package requests yet.</p>';
      return;
    }
    container.innerHTML = adminRecords.map((record) => `
      <form class="admin-account-row" data-user-id="${escapeHtml(record.user_id)}">
        <div class="admin-client-id"><span>CLIENT</span><strong>${escapeHtml(record.email || "Email unavailable")}</strong><code>${escapeHtml(record.user_id)}</code><small>Requested ${new Date(record.created_at).toLocaleDateString()}</small></div>
        <label>Package<select name="package">${data.packages.map((plan) => `<option value="${escapeHtml(plan.name)}">${escapeHtml(plan.name)}</option>`).join("")}${data.packages.some((plan) => plan.name === record.package_name) ? "" : `<option value="${escapeHtml(record.package_name)}">${escapeHtml(record.package_name)} (legacy)</option>`}</select></label>
        <label>Status<select name="status"><option value="pending">Pending</option><option value="active">Active</option><option value="paused">Paused</option></select></label>
        <button type="submit" class="admin-secondary">Update</button>
      </form>`).join("");
    container.querySelectorAll(".admin-account-row").forEach((form, index) => {
      form.elements.package.value = adminRecords[index].package_name;
      form.elements.status.value = adminRecords[index].status;
      form.addEventListener("submit", (event) => updateAdminAccount(event, adminRecords[index]));
    });
  }

  async function updateAdminAccount(event, record) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const values = new FormData(form);
      const { error } = await (await getAdminClient()).from("client_accounts").update({
        package_name: values.get("package").toString(),
        status: values.get("status").toString(),
        updated_at: new Date().toISOString()
      }).eq("user_id", record.user_id);
      if (error) throw error;
      record.package_name = values.get("package").toString();
      record.status = values.get("status").toString();
      setAdminMessage("Client package updated.", "success");
    } catch (error) {
      console.error("Could not update client package:", error);
      setAdminMessage(error.message || "Could not update this client package.", "error");
    } finally {
      submit.disabled = false;
    }
  }

  async function handleAdminLogout() {
    try {
      if (adminClient) {
        const { error } = await adminClient.auth.signOut();
        if (error) throw error;
      }
      adminSession = null;
      showAdminLogin();
      setAdminMessage("You have been logged out of the admin panel.", "success");
    } catch (error) {
      console.error("Admin logout failed:", error);
      setAdminMessage(error.message || "Could not log out.", "error");
    }
  }

  function initializeAdminPanel() {
    document.addEventListener("click", async (event) => {
      if (!event.target.closest("[data-open-admin]")) return;
      if (!adminDialog.open) adminDialog.showModal();
      showAdminLogin();
      setAdminMessage("", "");
      try {
        const client = await getAdminClient();
        const { data: sessionData, error } = await client.auth.getSession();
        if (error) throw error;
        if (isAdmin(sessionData.session)) {
          adminSession = sessionData.session;
          await loadAdminDashboard();
        }
      } catch (error) {
        console.error("Admin panel initialization failed:", error);
        setAdminMessage(error.message || "Could not initialize the admin panel.", "error");
      }
    });
    document.querySelector(".admin-close").addEventListener("click", () => adminDialog.close());
    adminDialog.addEventListener("click", (event) => {
      if (event.target === adminDialog) adminDialog.close();
    });
  }

  async function loadPublicContent() {
    const config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey) return;
    try {
      const client = await getSupabaseClient();
      const { data: rows, error } = await client.from("site_content").select("section, content");
      if (error) throw error;
      let updated = false;
      rows.forEach((row) => {
        if (Object.hasOwn(adminSections, row.section) && Array.isArray(row.content)) {
          data[row.section] = row.content;
          updated = true;
        }
      });
      if (updated) renderWebsiteContent();
    } catch (error) {
      console.error("Could not load published admin content; built-in site data remains visible:", error);
    }
  }

  function renderWebsiteContent() {
    renderServices();
    renderClients();
    renderCases();
    renderPackages(activeBilling, activeCurrency);
    renderReviews(document.querySelector(".filter-button.active")?.dataset.filter || "all");
    renderProcess();
    renderFaqs();
  }

  function initializeInteractions() {
    document.querySelectorAll(".range-control input").forEach((input) => input.addEventListener("input", updateCalculator));
    document.querySelectorAll(".billing-option").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".billing-option").forEach((option) => {
          const active = option === button;
          option.classList.toggle("active", active);
          option.setAttribute("aria-pressed", String(active));
        });
        activeBilling = button.dataset.billing;
        renderPackages(activeBilling, activeCurrency);
      });
    });
    document.querySelectorAll(".currency-option").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".currency-option").forEach((option) => {
          const active = option === button;
          option.classList.toggle("active", active);
          option.setAttribute("aria-pressed", String(active));
        });
        activeCurrency = button.dataset.currency;
        renderPackages(activeBilling, activeCurrency);
      });
    });
    document.querySelectorAll(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".filter-button").forEach((option) => {
          const active = option === button;
          option.classList.toggle("active", active);
          option.setAttribute("aria-pressed", String(active));
        });
        renderReviews(button.dataset.filter);
      });
    });
    document.getElementById("newsletter-form").addEventListener("submit", (event) => {
      event.preventDefault();
      event.currentTarget.reset();
      showToast("You're subscribed — look out for our next growth note.");
    });
  }

  renderServices();
  renderClients();
  renderCases();
  renderPackages(activeBilling, activeCurrency);
  renderReviews("all");
  renderProcess();
  renderFaqs();
  updateCalculator();
  initializeNavigation();
  initializeModal();
  initializePortal();
  initializeAdminPanel();
  initializeInteractions();
  document.getElementById("current-year").textContent = new Date().getFullYear();
  loadPublicContent();
})();
