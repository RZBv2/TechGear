/**
 * Framework-agnostic motion + interaction layer. Plain DOM APIs only.
 * `bootTechGear()` wires everything and returns a teardown function.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Swiper from "swiper";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initSmoothScroll(cleanups: Array<() => void>): Lenis | null {
  if (reduced()) return null;
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
  let raf = 0;
  const tick = (time: number) => {
    lenis.raf(time);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  lenis.on("scroll", ScrollTrigger.update);
  cleanups.push(() => {
    cancelAnimationFrame(raf);
    lenis.destroy();
  });
  return lenis;
}

/** Scrolls to the element matching the current URL hash (if any), accounting
 * for the fixed header and for content (product grids, reveal animations)
 * that hasn't finished laying out yet on first paint. Works with or without
 * Lenis (smooth scroll is skipped under prefers-reduced-motion). */
function scrollToHash(lenis: Lenis | null) {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;

  const attempt = (tries: number) => {
    const target = document.querySelector<HTMLElement>(hash);
    if (!target) {
      if (tries > 0) window.setTimeout(() => attempt(tries - 1), 120);
      return;
    }
    const header = document.querySelector<HTMLElement>(".site-header");
    const offset = (header?.offsetHeight ?? 0) + 16;
    if (lenis) {
      lenis.scrollTo(target, { offset: -offset, duration: 1 });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduced() ? "auto" : "smooth" });
    }
  };
  // A couple of retries: on first navigation the grid below the target
  // (products, reveal-animated sections) may still be laying out.
  window.setTimeout(() => attempt(6), 80);
}

function initReveals(ctx: gsap.Context) {
  if (reduced()) {
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.classList.add("is-visible"));
    return;
  }
  ctx.add(() => {
    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
      const delay = Number(el.dataset["revealDelay"] ?? 0);
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
      gsap.to(el, {
        yPercent: Number(el.dataset["parallax"] ?? -8),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    });
  });
}

function initHeroIntro(ctx: gsap.Context) {
  if (reduced()) return;
  ctx.add(() => {
    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .from(".nav", { y: -18, opacity: 0, duration: 0.7 })
      .from(
        ".hero__copy > *",
        { y: 26, opacity: 0, duration: 0.8, stagger: 0.09 },
        "-=0.35",
      )
      .from(
        ".hero__visual",
        { scale: 0.94, opacity: 0, duration: 1.1 },
        "-=0.9",
      )
      .from(
        ".hero__chip",
        { y: 14, opacity: 0, duration: 0.6, stagger: 0.12 },
        "-=0.55",
      );
  });
}

function initHeader(cleanups: Array<() => void>) {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header) return;
  const onScroll = () =>
    header.classList.toggle("is-stuck", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener("scroll", onScroll));
}

function initDrawer(cleanups: Array<() => void>) {
  const drawer = document.querySelector<HTMLElement>("[data-drawer]");
  if (!drawer) return;
  const open = () => {
    drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
  };
  const onClick = (event: Event) => {
    const target = (event.target as HTMLElement).closest(
      "[data-drawer-open],[data-drawer-close]",
    );
    if (!target) return;
    if (target.hasAttribute("data-drawer-open")) open();
    else close();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
  };
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  cleanups.push(() => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
  });
}

function initCounters(ctx: gsap.Context) {
  ctx.add(() => {
    gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
      const end = Number(el.dataset["count"] ?? 0);
      const suffix = el.dataset["suffix"] ?? "";
      if (reduced()) {
        el.textContent = `${end}${suffix}`;
        return;
      }
      const state = { v: 0 };
      gsap.to(state, {
        v: end,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${Math.round(state.v)}${suffix}`;
        },
      });
    });
  });
}

export function toast(message: string) {
  const stack = document.querySelector<HTMLElement>("[data-toast-stack]");
  if (!stack) return;
  const node = document.createElement("div");
  node.className = "toast";
  node.setAttribute("role", "status");
  node.innerHTML = `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>`;
  node.querySelector("span")!.textContent = message;
  stack.appendChild(node);
  window.setTimeout(() => {
    node.classList.add("toast--out");
    window.setTimeout(() => node.remove(), 300);
  }, 2800);
}

function initShopActions(cleanups: Array<() => void>) {
  // Cart/wishlist state, counts, and toasts are owned by React (StoreProvider)
  // now — this only adds the little "pulse" delight animation on click so
  // the interaction still feels tactile, without fighting React's state.
  const onClick = (event: Event) => {
    if (reduced()) return;
    const el = event.target as HTMLElement;

    const wish = el.closest<HTMLElement>("[data-wishlist]");
    if (wish) {
      wish.classList.add("is-pulsing");
      window.setTimeout(() => wish.classList.remove("is-pulsing"), 400);
      return;
    }

    const cartBtn = el.closest<HTMLElement>("[data-add-to-cart]");
    if (cartBtn) {
      const badge = document.querySelector<HTMLElement>("[data-cart-count]");
      if (badge) {
        gsap.fromTo(
          badge,
          { scale: 0.6 },
          { scale: 1, duration: 0.5, ease: "back.out(3)" },
        );
      }
      const media = cartBtn
        .closest(".product-card, .product-detail__media")
        ?.querySelector("img");
      if (media)
        gsap.fromTo(
          media,
          { scale: 1.12 },
          { scale: 1, duration: 0.6, ease: "power2.out" },
        );
    }
  };
  document.addEventListener("click", onClick);
  cleanups.push(() => document.removeEventListener("click", onClick));
}

function initNewsletter(cleanups: Array<() => void>) {
  const form = document.querySelector<HTMLFormElement>("[data-newsletter]");
  if (!form) return;
  const onSubmit = (event: Event) => {
    event.preventDefault();
    form.reset();
    toast("You're on the list. Welcome to TechGear.");
  };
  form.addEventListener("submit", onSubmit);
  cleanups.push(() => form.removeEventListener("submit", onSubmit));
}

function initReviewsCarousel(cleanups: Array<() => void>) {
  const el = document.querySelector<HTMLElement>("[data-reviews-swiper]");
  if (!el) return;
  const swiper = new Swiper(el, {
    modules: [Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 24,
    pagination: { el: "[data-reviews-pagination]", clickable: true },
    autoplay: reduced() ? false : { delay: 5200, disableOnInteraction: true },
    breakpoints: {
      720: { slidesPerView: 2 },
      1100: { slidesPerView: 3 },
    },
  });
  cleanups.push(() => swiper.destroy(true, true));
}

function initLoader(cleanups: Array<() => void>) {
  const loader = document.querySelector<HTMLElement>("[data-loader]");
  if (!loader) return;
  const id = window.setTimeout(() => loader.classList.add("is-done"), 620);
  cleanups.push(() => window.clearTimeout(id));
}

export function bootTechGear(): () => void {
  if (typeof window === "undefined") return () => {};
  gsap.registerPlugin(ScrollTrigger);

  const cleanups: Array<() => void> = [];
  const ctx = gsap.context(() => {});

  initLoader(cleanups);
  initHeader(cleanups);
  initDrawer(cleanups);
  const lenis = initSmoothScroll(cleanups);
  initHeroIntro(ctx);
  initReveals(ctx);
  initCounters(ctx);
  initShopActions(cleanups);
  initNewsletter(cleanups);
  initReviewsCarousel(cleanups);
  ScrollTrigger.refresh();
  scrollToHash(lenis);

  const onHashChange = () => scrollToHash(lenis);
  window.addEventListener("hashchange", onHashChange);
  cleanups.push(() => window.removeEventListener("hashchange", onHashChange));

  return () => {
    cleanups.forEach((fn) => fn());
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}
