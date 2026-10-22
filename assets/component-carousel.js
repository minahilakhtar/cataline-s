function initCarousels() {
  const carousels = document.querySelectorAll('[data-carousel]');

  carousels.forEach(function (section) {
    if (section.dataset.carouselInitialized === 'true') return;
    section.dataset.carouselInitialized = 'true';

    const track = section.querySelector('[data-slider-track]');
    const controls = section.querySelector('[data-slider-controls]');
    const prevButton = section.querySelector('[data-prev]');
    const nextButton = section.querySelector('[data-next]');
    const slider = section.querySelector('[data-products-slider], .collection-showcase__slider');

    if (!track) return;

    const enableMobile = section.dataset.enableMobile === 'true';
    const enableTablet = section.dataset.enableTablet === 'true';
    const enableDesktop = section.dataset.enableDesktop === 'true';

    const autoplayEnabled = slider && slider.dataset.autoplay === 'true';
    const autoplaySpeed = slider ? parseInt(slider.dataset.speed || '4', 10) * 1000 : 4000;
    const pauseOnHover = slider ? slider.dataset.pause === 'true' : true;

    let autoplayInterval = null;
    let isHovered = false;

    function getDevice() {
      const width = window.innerWidth;
      if (width >= 990) return 'desktop';
      if (width >= 750) return 'tablet';
      return 'mobile';
    }

    function isSliderEnabledForCurrentDevice() {
      const device = getDevice();

      if (device === 'desktop') return enableDesktop;
      if (device === 'tablet') return enableTablet;
      return enableMobile;
    }

    function getSlideWidth() {
      const firstSlide = track.querySelector('[data-slider-slide]');
      if (!firstSlide) return track.clientWidth;

      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || 24);
      return firstSlide.getBoundingClientRect().width + gap;
    }

    function updateButtons() {
      if (!prevButton || !nextButton) return;

      if (!isSliderEnabledForCurrentDevice()) {
        prevButton.disabled = true;
        nextButton.disabled = true;
        return;
      }

      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      prevButton.disabled = track.scrollLeft <= 2;
      nextButton.disabled = track.scrollLeft >= maxScroll;
    }

    function updateMode() {
      const device = getDevice();
      const enabled = isSliderEnabledForCurrentDevice();

      track.classList.remove(
        'is-grid-mode',
        'is-slider-mode',
        'is-mobile-slider',
        'is-tablet-slider',
        'is-desktop-slider'
      );

      if (enabled) {
        track.classList.add('is-slider-mode');

        if (device === 'mobile') {
          track.classList.add('is-mobile-slider');
        } else if (device === 'tablet') {
          track.classList.add('is-tablet-slider');
        } else {
          track.classList.add('is-desktop-slider');
        }

        if (controls) controls.classList.add('is-active');
      } else {
        track.classList.add('is-grid-mode');
        if (controls) controls.classList.remove('is-active');
        track.scrollLeft = 0;
      }

      updateButtons();
      restartAutoplay();
    }

    function goNext() {
      const slideWidth = getSlideWidth();
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      const nextPosition = track.scrollLeft + slideWidth;

      if (nextPosition >= maxScroll) {
        track.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        track.scrollBy({
          left: slideWidth,
          behavior: 'smooth'
        });
      }
    }

    function goPrev() {
      track.scrollBy({
        left: -getSlideWidth(),
        behavior: 'smooth'
      });
    }

    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (!autoplayEnabled) return;
      if (!isSliderEnabledForCurrentDevice()) return;

      autoplayInterval = setInterval(function () {
        if (pauseOnHover && isHovered) return;
        goNext();
      }, autoplaySpeed);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        if (!isSliderEnabledForCurrentDevice()) return;
        goPrev();
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        if (!isSliderEnabledForCurrentDevice()) return;
        goNext();
      });
    }

    if (pauseOnHover) {
      section.addEventListener('mouseenter', function () {
        isHovered = true;
      });

      section.addEventListener('mouseleave', function () {
        isHovered = false;
      });
    }

    track.addEventListener('scroll', updateButtons);
    window.addEventListener('resize', updateMode);

    updateMode();
    startAutoplay();
  });
}

document.addEventListener('DOMContentLoaded', initCarousels);
document.addEventListener('shopify:section:load', initCarousels);