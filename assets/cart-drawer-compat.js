(() => {
  const methods = {
    getSectionsToRender() {
      return [{ id: 'cart-drawer', selector: 'cart-drawer' }];
    },
    setActiveElement(element) { this.activeElement = element; },
    open(element) {
      if (element) this.setActiveElement(element);
      this.classList.add('animate', 'active');
      document.body.classList.add('overflow-hidden');
      const panel = this.querySelector('.drawer__inner');
      if (panel && typeof window.trapFocus === 'function') window.trapFocus(this, panel);
      else if (panel) panel.focus();
    },
    close() {
      this.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
      if (typeof window.removeTrapFocus === 'function') window.removeTrapFocus(this.activeElement);
      else if (this.activeElement && this.activeElement.isConnected) this.activeElement.focus();
    },
    renderContents(cart) {
      const html = cart.sections && cart.sections['cart-drawer'];
      if (!html) throw new Error('Cart drawer section was not returned.');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const replacement = doc.querySelector('cart-drawer');
      if (!replacement) throw new Error('Cart drawer markup was not returned.');
      this.innerHTML = replacement.innerHTML;
      this.classList.toggle('is-empty', replacement.classList.contains('is-empty'));
      this.open();
    }
  };
  const Existing = customElements.get('cart-drawer');
  if (Existing) {
    for (const [name, fn] of Object.entries(methods)) {
      if (typeof Existing.prototype[name] !== 'function') Existing.prototype[name] = fn;
    }
  } else {
    class CompatibleCartDrawer extends HTMLElement {
      constructor() {
        super();
        this.addEventListener('click', event => {
          if (event.target.closest('#CartDrawer-Overlay')) this.close();
        });
        this.addEventListener('keydown', event => { if (event.key === 'Escape') this.close(); });
      }
    }
    Object.assign(CompatibleCartDrawer.prototype, methods);
    customElements.define('cart-drawer', CompatibleCartDrawer);
  }
})();
