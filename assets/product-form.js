if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.submitButton = this.querySelector('[type="submit"]');
      if (!this.form || !this.submitButton) return;
      const variantInput = this.form.querySelector('[name=id]');
      if (variantInput) variantInput.disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.hideErrors = this.dataset.hideErrors === 'true';
    }
    notify(name, data) {
      if (typeof window.publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined' && PUB_SUB_EVENTS[name]) {
        try { window.publish(PUB_SUB_EVENTS[name], data); } catch (error) { console.error(error); }
      }
    }
    async onSubmitHandler(event) {
      event.preventDefault();
      if (this.busy || this.submitButton.getAttribute('aria-disabled') === 'true') return;
      this.busy = true;
      this.error = false;
      this.handleErrorMessage();
      const previousStatus = this.querySelector('[data-cf-cart-status]');
      if (previousStatus) previousStatus.textContent = "";
      this.submitButton.setAttribute('aria-disabled', 'true');
      this.submitButton.classList.add('loading');
      this.form.setAttribute('aria-busy', 'true');
      const spinner = this.querySelector('.loading-overlay__spinner');
      if (spinner) spinner.classList.remove('hidden');
      let added = false;
      const cartUrl = window.routes?.cart_url || (window.Shopify?.routes?.root || '/') + 'cart';
      try {
        const formData = new FormData(this.form);
        const addUrl = window.routes?.cart_add_url || (window.Shopify?.routes?.root || '/') + 'cart/add.js';
        const response = await fetch(addUrl, {
          method: 'POST', credentials: 'same-origin',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: formData
        });
        const data = await response.json();
        if (!response.ok || data.status) {
          const message = typeof data.description === 'string' ? data.description : data.message || 'This item could not be added.';
          this.notify('cartError', { source: 'product-form', productVariantId: formData.get('id'), errors: data.errors || message, message: data.message });
          this.handleErrorMessage(message);
          return;
        }
        added = true;
        this.notify('cartUpdate', { source: 'product-form', productVariantId: formData.get('id'), cartData: data });
        this.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        let status = this.querySelector('[data-cf-cart-status]');
        if (!status) {
          status = document.createElement('p');
          status.setAttribute('data-cf-cart-status', '');
          status.setAttribute('role', 'status');
          status.setAttribute('aria-live', 'polite');
          this.form.append(status);
        }
        status.replaceChildren(document.createTextNode('Added to cart. '));
        const link = document.createElement('a');
        link.href = cartUrl;
        link.textContent = 'View cart';
        status.append(link);
      } catch (error) {
        console.error(error);
        if (added) window.location.assign(cartUrl);
        else this.handleErrorMessage('Could not confirm the addition. Check your cart before trying again.');
      } finally {
        this.busy = false;
        this.submitButton.classList.remove('loading');
        this.submitButton.removeAttribute('aria-disabled');
        this.form.removeAttribute('aria-busy');
        if (spinner) spinner.classList.add('hidden');
      }
    }
    handleErrorMessage(message = false) {
      if (this.hideErrors) return;
      let wrapper = this.querySelector('.product-form__error-message-wrapper');
      if (!wrapper && message) {
        wrapper = document.createElement('div');
        wrapper.className = 'product-form__error-message-wrapper';
        wrapper.setAttribute('role', 'alert');
        const text = document.createElement('span');
        text.className = 'product-form__error-message';
        wrapper.append(text); this.form.append(wrapper);
      }
      if (!wrapper) return;
      wrapper.toggleAttribute('hidden', !message);
      const text = wrapper.querySelector('.product-form__error-message');
      if (text && message) text.textContent = message;
    }
  });
}
