/* VYRA - Core Application & Tabbed SPA Navigation JavaScript */
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  setupTabNavigation();
  setupModals();
  setupMetricsCounter();
});

// Glassmorphism Navbar Scroll Effect
function setupNavbar() {
  const navbar = document.getElementById('mainNav');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('py-3', 'shadow-2xl', 'shadow-emerald-950/20');
      navbar.classList.remove('py-5');
    } else {
      navbar.classList.add('py-5');
      navbar.classList.remove('py-3', 'shadow-2xl', 'shadow-emerald-950/20');
    }
  });

  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

// Tabbed SPA Navigation
function setupTabNavigation() {
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabViews = document.querySelectorAll('.tab-view');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = btn.dataset.tab;

      // Update button styling
      tabBtns.forEach(b => {
        b.classList.remove('text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/30', 'font-bold');
        b.classList.add('text-slate-300', 'hover:text-white', 'border-transparent');
      });

      btn.classList.add('text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/30', 'font-bold');
      btn.classList.remove('text-slate-300', 'hover:text-white', 'border-transparent');

      // Switch tab views
      tabViews.forEach(view => {
        if (view.id === targetTabId) {
          view.classList.remove('hidden');
          view.classList.add('block');
        } else {
          view.classList.add('hidden');
          view.classList.remove('block');
        }
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Close mobile drawer if open
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
      }

      // Re-trigger Chart.js resize if command center tab is opened
      if (targetTabId === 'tab-command' && window.vyraDashboard) {
        setTimeout(() => {
          if (typeof window.vyraDashboard.resizeAllCharts === 'function') {
            window.vyraDashboard.resizeAllCharts();
          } else if (window.vyraDashboard.chart) {
            window.vyraDashboard.chart.resize();
          }
        }, 150);
      }
    });
  });

  // Support CTA buttons linking to tabs
  document.querySelectorAll('.link-to-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTabId = btn.dataset.tab;
      const targetNavBtn = document.querySelector(`.nav-tab-btn[data-tab="${targetTabId}"]`);
      if (targetNavBtn) targetNavBtn.click();
    });
  });
}

// Modal Dialogs Handling
function setupModals() {
  const demoModal = document.getElementById('requestDemoModal');
  const emergencyModal = document.getElementById('emergencyModal');
  
  // Triggers
  document.querySelectorAll('.trigger-request-demo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (demoModal) demoModal.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.trigger-emergency').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (emergencyModal) emergencyModal.classList.remove('hidden');
    });
  });

  // Close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      if (demoModal) demoModal.classList.add('hidden');
      if (emergencyModal) emergencyModal.classList.add('hidden');
    });
  });

  // Close on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === demoModal) demoModal.classList.add('hidden');
    if (e.target === emergencyModal) emergencyModal.classList.add('hidden');
  });

  // Demo Form Submission
  const demoForm = document.getElementById('demoForm');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('demoName').value;
      const org = document.getElementById('demoOrg').value;
      
      const submitBtn = demoForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Request...`;

      setTimeout(() => {
        demoForm.innerHTML = `
          <div class="text-center py-8 space-y-4">
            <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl animate-bounce">
              <i class="fa-solid fa-check"></i>
            </div>
            <h3 class="text-2xl font-bold font-syne text-white">Demo Request Received!</h3>
            <p class="text-sm text-slate-300">Thank you, <span class="text-emerald-400 font-semibold">${name}</span> (${org}). Our DISCOM smart grid deployment team will contact you within 24 hours.</p>
            <button class="btn-primary mt-4 close-modal" onclick="document.getElementById('requestDemoModal').classList.add('hidden')">Close Window</button>
          </div>
        `;
      }, 1500);
    });
  }

  // Emergency Dispatch Action
  const dispatchBtn = document.getElementById('btnDispatchEmergency');
  if (dispatchBtn) {
    dispatchBtn.addEventListener('click', () => {
      dispatchBtn.disabled = true;
      dispatchBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Dispatching Automated Alert to DISCOM...`;
      setTimeout(() => {
        dispatchBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> DISCOM Field Units & SMS Alerts Dispatched!`;
        dispatchBtn.className = 'w-full py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm transition-all';
      }, 1800);
    });
  }
}

// Counter Animation for Metrics
function setupMetricsCounter() {
  const metricElements = document.querySelectorAll('.counter-val');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        metricElements.forEach(el => {
          const target = parseFloat(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          let current = 0;
          const step = target / 40;

          const isIntegerTarget = Number.isInteger(target);
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            const displayVal = isIntegerTarget ? Math.round(current) : current.toFixed(1);
            el.textContent = `${prefix}${displayVal}${suffix}`;
          }, 30);
        });
      }
    });
  }, { threshold: 0.3 });

  const metricsSection = document.getElementById('tab-impact');
  if (metricsSection) observer.observe(metricsSection);
}
