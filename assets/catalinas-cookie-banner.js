(() => {
  'use strict';
  const root = document.getElementById('cf-cookie-consent');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const bar = root.querySelector('.cf-cookie-bar');
  const reopen = root.querySelector('.cf-cookie-reopen');
  const dialog = root.querySelector('dialog');
  const form = root.querySelector('form');
  const categories = ['preferences', 'analytics', 'marketing'];
  let api, busy = false, previousFocus, attempt = 0;
  const consent = () => api.currentVisitorConsent();
  const hasDecision = value => categories.every(key => value[key] === 'yes' || value[key] === 'no');
  function visibility() {
    const value = consent();
    bar.hidden = hasDecision(value) || !api.shouldShowBanner();
    reopen.hidden = !bar.hidden;
  }
  function status(message) {
    root.querySelectorAll('.cf-cookie-status').forEach(node => { node.textContent = message; });
  }
  function setBusy(value) {
    busy = value;
    root.querySelectorAll('button').forEach(button => { button.disabled = value; });
    form.setAttribute('aria-busy', String(value));
  }
  function closePreferences() {
    if (dialog.open) dialog.close();
  }
  function openPreferences() {
    if (busy || !api) return;
    status('');
    const value = consent();
    categories.forEach(key => { form.elements[key].checked = value[key] === 'yes'; });
    const optOut = root.querySelector('[data-cf-sale-option]');
    optOut.hidden = !(typeof api.saleOfDataRegion === 'function' && api.saleOfDataRegion());
    form.elements.sale_opt_out.checked = value.sale_of_data === 'no';
    form.elements.sale_opt_out.disabled = value.sale_of_data === 'no';
    previousFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
  }
  function save(values) {
    if (busy || !api) return;
    status('');
    setBusy(true);
    // No consent is inferred or stored locally. Shopify remains the source of truth.
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error('timeout')), 10000);
    function finish(error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      setBusy(false);
      if (error) {
        status('Your choice could not be saved. Please try again.');
        return;
      }
      const current = consent();
      if (categories.some(key => current[key] !== (values[key] ? 'yes' : 'no'))) {
        status('Your choice could not be confirmed. Please try again.');
        return;
      }
      closePreferences();
      visibility();
      if (bar.hidden) reopen.focus({ preventScroll: true });
    }
    try {
      api.setTrackingConsent(values, result => finish(result && result.error));
    } catch (error) { finish(error); }
  }
  function ready() {
    api = window.Shopify && window.Shopify.customerPrivacy;
    if (!api || typeof api.setTrackingConsent !== 'function' || typeof api.currentVisitorConsent !== 'function' || typeof api.shouldShowBanner !== 'function' || typeof dialog.showModal !== 'function') return;
    try {
      visibility();
      root.hidden = false;
      // Suppress only the standard banner after the replacement is functional.
      document.documentElement.classList.add('cf-cookie-ready');
    } catch (error) { root.hidden = true; return; }
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-cf-cookie-action]');
      if (!button || busy) return;
      const action = button.dataset.cfCookieAction;
      if (action === 'preferences') { openPreferences(); return; }
      const allow = action === 'accept';
      save({ preferences: allow, analytics: allow, marketing: allow });
    });
    root.querySelector('[data-cf-cookie-close]').addEventListener('click', closePreferences);
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => {
      if (previousFocus && previousFocus.isConnected && !previousFocus.closest('[hidden]')) previousFocus.focus({ preventScroll: true });
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(categories.map(key => [key, form.elements[key].checked]));
      // Data sale/sharing is a separate opt-out. Never enable it through Accept All.
      if (!root.querySelector('[data-cf-sale-option]').hidden && form.elements.sale_opt_out.checked) values.sale_of_data = false;
      save(values);
    });
    document.addEventListener('visitorConsentCollected', () => { if (!busy) visibility(); });
    window.addEventListener('pageshow', () => { if (!busy) visibility(); });
  }
  function load() {
    if (window.Shopify && window.Shopify.customerPrivacy) { ready(); return; }
    if (window.Shopify && typeof window.Shopify.loadFeatures === 'function') {
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.2' }], error => { if (!error) ready(); });
      return;
    }
    if (++attempt < 40) window.setTimeout(load, 250);
    // On load failure the original Shopify banner remains available.
  }
  load();
})();
