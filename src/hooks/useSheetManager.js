import { useEffect } from 'react';

const BACKDROP = '.modal-backdrop';
const PANEL = '.modal, .modal-shell, section[role="dialog"], section[role="alertdialog"]';
const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * One place that owns the behaviour shared by every sheet / modal in Pocket.
 * Sheets are rendered by many components, so instead of repeating effects in each
 * one, this hook (mounted once in <App/>) watches the DOM for `.modal-backdrop`:
 *
 *  - locks page scroll while any sheet is open (html.pocket-sheet-open)
 *  - Escape closes only the top-most sheet, using the sheet's own backdrop-tap
 *    handler (so "busy" guards such as an in-flight save are respected)
 *  - tapping the dimmed backdrop does NOT close a sheet that has unsaved input
 *  - moves focus into a newly opened sheet and restores it to the opener on close
 *  - gives every sheet panel dialog semantics (role/aria-modal) if it has none
 */
export function useSheetManager() {
  useEffect(() => {
    const root = document.documentElement;
    let previousFocus = null;
    let hadSheets = false;
    const seen = new WeakSet();

    const backdrops = () => [...document.querySelectorAll(BACKDROP)];

    const sync = () => {
      const list = backdrops();
      root.classList.toggle('pocket-sheet-open', list.length > 0);
      for (const bd of list) {
        if (seen.has(bd)) continue;
        seen.add(bd);
        const panel = bd.querySelector(':scope > ' + PANEL.split(', ').join(', :scope > '));
        if (panel) {
          if (!panel.getAttribute('role')) panel.setAttribute('role', 'dialog');
          if (!panel.getAttribute('aria-modal')) panel.setAttribute('aria-modal', 'true');
          if (!panel.hasAttribute('aria-labelledby') && !panel.hasAttribute('aria-label')) {
            const heading = panel.querySelector('h1, h2, h3');
            if (heading) {
              if (!heading.id) heading.id = 'sheet-title-' + Math.random().toString(36).slice(2, 8);
              panel.setAttribute('aria-labelledby', heading.id);
            }
          }
          for (const btn of panel.querySelectorAll('.modal-head .icon-btn, .modal-header .icon-btn')) {
            if (!btn.getAttribute('aria-label') && !btn.textContent.trim()) btn.setAttribute('aria-label', 'Close');
          }
        }
        if (!hadSheets && !previousFocus) previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        // Focus the panel (not a field) so the on-screen keyboard does not pop up by itself.
        if (panel) { if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1'); panel.focus({ preventScroll: true }); }
      }
      if (list.length === 0 && hadSheets && previousFocus && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
        previousFocus = null;
      }
      if (list.length === 0) previousFocus = null;
      hadSheets = list.length > 0;
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    // Mark a sheet as "dirty" once the user typed/changed something in it.
    const markDirty = e => {
      const bd = e.target instanceof Element ? e.target.closest(BACKDROP) : null;
      if (bd) bd.dataset.dirty = '1';
    };
    document.addEventListener('input', markDirty, true);
    document.addEventListener('change', markDirty, true);

    // Backdrop tap: ignore it when there is unsaved input (prevents accidental data loss).
    const guardBackdropTap = e => {
      if (e.__pocketForceClose) return;
      if (e.target instanceof Element && e.target.matches(BACKDROP) && e.target.dataset.dirty === '1') {
        e.stopPropagation();
      }
    };
    document.addEventListener('mousedown', guardBackdropTap, true);

    // Escape closes the top-most sheet through its own backdrop handler.
    const onKeyDown = e => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const list = backdrops();
      const top = list[list.length - 1];
      if (!top) return;
      const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      ev.__pocketForceClose = true;
      top.dispatchEvent(ev);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      observer.disconnect();
      document.removeEventListener('input', markDirty, true);
      document.removeEventListener('change', markDirty, true);
      document.removeEventListener('mousedown', guardBackdropTap, true);
      document.removeEventListener('keydown', onKeyDown);
      root.classList.remove('pocket-sheet-open');
    };
  }, []);
}
