/* Точка входа. */

import { wedding } from './config.js?v=14';
import { merge } from './modules/utils.js';
import {
  fillFields, renderPhotos, renderBands, renderNames, renderStory, renderGallery, renderFacts,
  renderSchedule, renderPlaces, renderDress, renderGifts, renderFinal,
  pruneSections, applyThemes
} from './modules/render.js?v=13';
import { initStage } from './modules/stage.js';
import { initReveal, initParallax } from './modules/motion.js';
import { initNav } from './modules/nav.js';
import { initRsvp } from './modules/rsvp.js';
import { initCountdown } from './modules/countdown.js';

async function boot() {
  let cfg = wedding;

  // ?preview — показать, как выглядят ещё не заполненные блоки
  if (/(^|[?&#])preview/.test(location.search + location.hash)) {
    try {
      const { preview } = await import('./preview.js');
      cfg = merge(wedding, preview);
      cfg.__preview = true;
      console.info('%cРежим предпросмотра: данные демонстрационные.', 'color:#9E1B2F');
    } catch (error) {
      console.warn('preview.js не загрузился', error);
    }
  }

  fillFields(cfg);
  renderPhotos(cfg);
  renderBands(cfg);
  renderNames(cfg);
  renderStory(cfg);
  renderGallery(cfg);
  renderFacts(cfg);
  renderSchedule(cfg);
  renderPlaces(cfg);
  renderDress(cfg);
  renderGifts(cfg);
  renderFinal(cfg);

  pruneSections(cfg);
  applyThemes();

  initStage(cfg);
  initReveal();
  initParallax();
  initNav(cfg);
  initRsvp(cfg);
  initCountdown(cfg);

  // Сцена стартует, когда шрифты готовы, но не позже 1.2 с
  const ready = () => document.body.classList.remove('is-loading');
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 1200))]).then(ready);
}

boot();
