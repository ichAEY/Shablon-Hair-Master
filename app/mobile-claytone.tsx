"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, TouchEvent as ReactTouchEvent } from "react";
import site from "../site-data.mjs";

type ServiceVariant = { label: string; price: string; time?: string };
type Service = {
  name: string;
  price: string;
  time: string;
  description: string;
  url: string;
  variants?: ServiceVariant[];
  detailClass?: string;
  displayName?: string;
};
type CategoryKey = "manicure" | "pedicure" | "podology" | "training";

const bookingUrl = site.links.bookingUrl;
const reviewsUrl = site.links.reviewsUrl;
const mapUrl = site.links.mapUrl;
const routeUrl = site.links.routeUrl;
const mobileMapEmbedUrl = site.links.mobileMapEmbedUrl;
const desktopMapEmbedUrl = site.links.desktopMapEmbedUrl;
const personalTelegramUrl = site.contacts.personalTelegramUrl;
const vkUrl = site.contacts.vkUrl;

const manicure = site.services.manicure as Service[];
const pedicure = site.services.pedicure as Service[];
const podology = site.services.podology as Service[];
const training = site.services.training as Service[];
const categoryKeys: CategoryKey[] = ["manicure", "pedicure", "podology", "training"];
const serviceGroups: Record<CategoryKey, { label: string; services: Service[] }> = {
  manicure: { label: site.template.categoryLabels.manicure, services: manicure },
  pedicure: { label: site.template.categoryLabels.pedicure, services: pedicure },
  podology: { label: site.template.categoryLabels.podology, services: podology },
  training: { label: site.template.categoryLabels.training, services: training },
};
const visibleCategoryKeys = categoryKeys.filter((key) => serviceGroups[key].services.length > 0);
const allServices: Array<Service & { sectionLabel?: string; sectionKey?: string }> = visibleCategoryKeys.flatMap((key) =>
  serviceGroups[key].services.map((service, index) => ({
    ...service,
    sectionLabel: index === 0 ? serviceGroups[key].label : undefined,
    sectionKey: key,
  })),
);

const beforeAfter = site.images.beforeAfter;
const galleryWorks = site.images.gallery;
const desktopGalleryModules = [galleryWorks.slice(0, 4), galleryWorks.slice(4, 8), galleryWorks.slice(8)];
const desktopGallerySetCount = 3;
const featuredWorks = galleryWorks.slice(0, 5);
const lightboxItems = [...galleryWorks];
const reviews = site.reviews;
const reviewSetCount = 5;
const promotions = site.promotions;

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};
const openMinutes = toMinutes(site.location.openTime);
const closeMinutes = toMinutes(site.location.closeTime);

const paletteSamples = [
  { base: "#625873", light: "#948aa3", dark: "#3d354a" },
  { base: "#7b6b94", light: "#aa9fbb", dark: "#514562" },
  { base: "#955d78", light: "#c28ba0", dark: "#653b50" },
  { base: "#aa6271", light: "#d294a0", dark: "#773f4d" },
  { base: "#bf7b81", light: "#e0aaa9", dark: "#8b5057" },
  { base: "#d1a38d", light: "#ecd0bf", dark: "#9d705d" },
  { base: "#c58a78", light: "#e4b5a1", dark: "#915c4c" },
  { base: "#d59e97", light: "#ecc3bc", dark: "#a36d67" },
  { base: "#e1b3ad", light: "#f2d4cf", dark: "#b7837e" },
  { base: "#ebcbc3", light: "#f8e3dc", dark: "#c49a91" },
  { base: "#f0e4d6", light: "#fff7ec", dark: "#c9b6a1" },
];

export default function MobileClayTone() {
  const [category, setCategory] = useState<"all" | "manicure" | "pedicure" | "podology" | "training">("all");
  const [expanded, setExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeBeforeAfter, setActiveBeforeAfter] = useState(0);
  const [activePromotion, setActivePromotion] = useState(0);
  const [promotionHinting, setPromotionHinting] = useState(false);
  const [promotionInView, setPromotionInView] = useState(false);
  const [promotionActivity, setPromotionActivity] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxTransform, setLightboxTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [reviewsPaused, setReviewsPaused] = useState(false);
  const [desktopGalleryPaused, setDesktopGalleryPaused] = useState(false);
  const [openStatus, setOpenStatus] = useState<{ isOpen: boolean | null; label: string }>({
    isOpen: null,
    label: site.location.scheduleCapitalized,
  });
  const heroRef = useRef<HTMLElement>(null);
  const finalBookRef = useRef<HTMLElement>(null);
  const beforeAfterRef = useRef<HTMLDivElement>(null);
  const promotionSectionRef = useRef<HTMLElement>(null);
  const promotionRef = useRef<HTMLDivElement>(null);
  const reviewViewportRef = useRef<HTMLDivElement>(null);
  const reviewTrackRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reviewsPausedRef = useRef(false);
  const reviewPointerStartRef = useRef<number | null>(null);
  const reviewScrollStartRef = useRef(0);
  const reviewOffsetRef = useRef(0);
  const reviewSetWidthRef = useRef(0);
  const reviewWasDraggedRef = useRef(false);
  const reviewResumeTimerRef = useRef<number | null>(null);
  const desktopGalleryViewportRef = useRef<HTMLDivElement>(null);
  const desktopGalleryTrackRef = useRef<HTMLDivElement>(null);
  const desktopGalleryPausedRef = useRef(false);
  const desktopGalleryPointerStartRef = useRef<number | null>(null);
  const desktopGalleryStartOffsetRef = useRef(0);
  const desktopGalleryOffsetRef = useRef(0);
  const desktopGallerySetWidthRef = useRef(0);
  const desktopGalleryWasDraggedRef = useRef(false);
  const lightboxGestureRef = useRef({
    mode: "idle" as "idle" | "swipe" | "pan" | "pinch",
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    startScale: 1,
    startDistance: 0,
  });

  const services: Array<Service & { sectionLabel?: string; sectionKey?: string }> =
    category === "all" ? allServices
      : category === "manicure" ? manicure
        : category === "pedicure" ? pedicure
          : category === "podology" ? podology
            : training;
  const isCollapsibleCategory = category === "all";
  const visibleServices = useMemo(() => services, [services]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousOverflow = document.body.style.overflow;
    let restored = false;

    document.body.style.overflow = "hidden";
    const restoreScroll = () => {
      if (restored) return;
      restored = true;
      document.body.style.overflow = previousOverflow;
    };
    const timer = window.setTimeout(() => {
      restoreScroll();
      setIntroVisible(false);
    }, reduceMotion ? 180 : 2300);

    return () => {
      window.clearTimeout(timer);
      restoreScroll();
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const viewport = desktopGalleryViewportRef.current;
    const track = desktopGalleryTrackRef.current;
    const firstSet = track?.querySelector<HTMLElement>(".dct-gallery-set");
    if (!viewport || !track || !firstSet) return;

    let frame = 0;
    let lastFrame = 0;
    const renderPosition = (nextOffset: number) => {
      const setWidth = desktopGallerySetWidthRef.current;
      if (setWidth) {
        while (nextOffset <= -setWidth * 2) nextOffset += setWidth;
        while (nextOffset > 0) nextOffset -= setWidth;
      }
      desktopGalleryOffsetRef.current = nextOffset;
      track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    };

    const measure = () => {
      const nextWidth = firstSet.getBoundingClientRect().width;
      if (!nextWidth) return;
      const previousWidth = desktopGallerySetWidthRef.current;
      desktopGallerySetWidthRef.current = nextWidth;
      renderPosition(previousWidth ? (desktopGalleryOffsetRef.current / previousWidth) * nextWidth : -nextWidth);
    };

    const move = (time: number) => {
      if (!lastFrame) lastFrame = time;
      const elapsed = Math.min(time - lastFrame, 34);
      lastFrame = time;
      if (!desktopGalleryPausedRef.current && document.visibilityState === "visible") {
        renderPosition(desktopGalleryOffsetRef.current - elapsed * .038);
      }
      frame = window.requestAnimationFrame(move);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    measure();
    frame = window.requestAnimationFrame(move);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const finalBook = finalBookRef.current;
    if (!hero || !finalBook) return;

    let frame = 0;
    const updateSticky = () => {
      frame = 0;
      const heroPassed = hero.getBoundingClientRect().bottom <= 0;
      const bookingTop = finalBook.getBoundingClientRect().top;
      const bookingIsApproaching = bookingTop <= window.innerHeight + 96;
      setStickyVisible(heroPassed && !bookingIsApproaching);
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateSticky);
    };

    updateSticky();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    const updateStatus = () => {
      const parts = new Intl.DateTimeFormat("ru-RU", {
        timeZone: site.location.timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date());
      const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
      const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
      const minuteOfDay = hours * 60 + minutes;
      const isOpen = minuteOfDay >= openMinutes && minuteOfDay < closeMinutes;

      setOpenStatus({
        isOpen,
        label: isOpen ? `Открыто до ${site.location.closeTime}` : `Закрыто до ${site.location.openTime}`,
      });
    };

    updateStatus();
    const timer = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!galleryOpen && lightboxIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous };
  }, [galleryOpen, lightboxIndex]);

  useEffect(() => {
    const section = promotionSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = Boolean(entry?.isIntersecting);
        setPromotionInView(isVisible);
        if (!isVisible) setPromotionHinting(false);
      },
      { threshold: 0.24 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!promotionInView || activePromotion !== 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let settleTimer = 0;
    const showHint = () => {
      setPromotionHinting(true);
      settleTimer = window.setTimeout(() => {
        setPromotionHinting(false);
      }, 1150);
    };
    const hintTimer = window.setInterval(showHint, 4_000);

    return () => {
      window.clearInterval(hintTimer);
      window.clearTimeout(settleTimer);
    };
  }, [activePromotion, promotionActivity, promotionInView]);

  useEffect(() => {
    const viewport = reviewViewportRef.current;
    const track = reviewTrackRef.current;
    const firstSet = track?.querySelector<HTMLElement>(".mct-review-set");
    if (!viewport || !track || !firstSet) return;

    let frame = 0;
    let lastFrame = 0;
    const renderPosition = (nextOffset: number) => {
      const setWidth = reviewSetWidthRef.current;
      if (setWidth) {
        while (nextOffset <= -setWidth * 3) nextOffset += setWidth * 2;
        while (nextOffset > -setWidth) nextOffset -= setWidth * 2;
      }
      reviewOffsetRef.current = nextOffset;
      track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    };

    const measure = () => {
      const nextWidth = firstSet.getBoundingClientRect().width;
      if (!nextWidth) return;
      const previousWidth = reviewSetWidthRef.current;
      reviewSetWidthRef.current = nextWidth;
      renderPosition(previousWidth ? (reviewOffsetRef.current / previousWidth) * nextWidth : -nextWidth * 2);
    };

    const move = (time: number) => {
      if (!lastFrame) lastFrame = time;
      const elapsed = Math.min(time - lastFrame, 34);
      lastFrame = time;

      if (!reviewsPausedRef.current && document.visibilityState === "visible") {
        renderPosition(reviewOffsetRef.current - elapsed * 0.032);
      }
      frame = window.requestAnimationFrame(move);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    measure();
    frame = window.requestAnimationFrame(move);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      if (reviewResumeTimerRef.current !== null) window.clearTimeout(reviewResumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".mct-reveal"));
    if (!elements.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!galleryOpen && lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else setGalleryOpen(false);
      }
      if (lightboxIndex !== null && event.key === "ArrowLeft") {
        setLightboxTransform({ scale: 1, x: 0, y: 0 });
        lightboxGestureRef.current.mode = "idle";
        setLightboxIndex((current) => current === null ? null : (current - 1 + lightboxItems.length) % lightboxItems.length);
      }
      if (lightboxIndex !== null && event.key === "ArrowRight") {
        setLightboxTransform({ scale: 1, x: 0, y: 0 });
        lightboxGestureRef.current.mode = "idle";
        setLightboxIndex((current) => current === null ? null : (current + 1) % lightboxItems.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [galleryOpen, lightboxIndex]);

  const switchCategory = (next: "all" | "manicure" | "pedicure" | "podology" | "training") => {
    setCategory(next);
    setExpanded(false);
  };

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches || !("IntersectionObserver" in window)) return;
    const tabs = document.querySelector<HTMLElement>(".mct-tabs-scroll");
    if (!tabs) return;

    let nudgeTimer = 0;
    let returnTimer = 0;
    let cancelled = false;

    const cancelHint = () => {
      cancelled = true;
      window.clearTimeout(nudgeTimer);
      window.clearTimeout(returnTimer);
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (tabs.scrollWidth <= tabs.clientWidth + 8) return;

      nudgeTimer = window.setTimeout(() => {
        if (cancelled) return;
        tabs.scrollTo({ left: Math.min(54, tabs.scrollWidth - tabs.clientWidth), behavior: "smooth" });
        returnTimer = window.setTimeout(() => {
          if (!cancelled) tabs.scrollTo({ left: 0, behavior: "smooth" });
        }, 620);
      }, 280);
    }, { threshold: 0.6 });

    observer.observe(tabs);
    tabs.addEventListener("pointerdown", cancelHint, { once: true });

    return () => {
      observer.disconnect();
      cancelHint();
      tabs.removeEventListener("pointerdown", cancelHint);
    };
  }, []);

  const updateBeforeAfterIndex = () => {
    const swiper = beforeAfterRef.current;
    if (!swiper) return;

    const swiperRect = swiper.getBoundingClientRect();
    const swiperCenter = swiperRect.left + swiperRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(swiper.children).forEach((child, index) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - swiperCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveBeforeAfter((current) => current === nearestIndex ? current : nearestIndex);
  };

  const goToBeforeAfter = (index: number) => {
    const swiper = beforeAfterRef.current;
    const card = swiper?.children[index] as HTMLElement | undefined;
    if (!swiper || !card) return;

    const swiperRect = swiper.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = swiper.scrollLeft + (cardRect.left - swiperRect.left) - (swiper.clientWidth - card.clientWidth) / 2;
    swiper.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  };

  const updatePromotionIndex = () => {
    const swiper = promotionRef.current;
    if (!swiper) return;

    const swiperRect = swiper.getBoundingClientRect();
    const swiperCenter = swiperRect.left + swiperRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(swiper.children).forEach((child, index) => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - swiperCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (activePromotion !== nearestIndex) {
      setActivePromotion(nearestIndex);
      if (nearestIndex !== 0) setPromotionHinting(false);
      setPromotionActivity((value) => value + 1);
    }
  };

  const goToPromotion = (index: number) => {
    const swiper = promotionRef.current;
    const card = swiper?.children[index] as HTMLElement | undefined;
    if (!swiper || !card) return;

    const swiperRect = swiper.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = swiper.scrollLeft + (cardRect.left - swiperRect.left) - (swiper.clientWidth - card.clientWidth) / 2;
    setPromotionActivity((value) => value + 1);
    swiper.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  };

  const registerPromotionInteraction = () => {
    setPromotionHinting(false);
    setPromotionActivity((value) => value + 1);
  };

  const openLightbox = (src: string) => {
    const index = lightboxItems.findIndex((item) => item.src === src);
    if (index >= 0) {
      setLightboxTransform({ scale: 1, x: 0, y: 0 });
      lightboxGestureRef.current.mode = "idle";
      setLightboxIndex(index);
    }
  };

  const stepLightbox = (direction: -1 | 1) => {
    if (lightboxTransform.scale > 1.01) return;
    setLightboxTransform({ scale: 1, x: 0, y: 0 });
    lightboxGestureRef.current.mode = "idle";
    setLightboxIndex((current) => current === null ? null : (current + direction + lightboxItems.length) % lightboxItems.length);
  };

  const pauseReviews = (clientX?: number) => {
    if (reviewResumeTimerRef.current !== null) {
      window.clearTimeout(reviewResumeTimerRef.current);
      reviewResumeTimerRef.current = null;
    }
    if (reviewTrackRef.current) reviewTrackRef.current.style.transition = "";
    reviewsPausedRef.current = true;
    setReviewsPaused(true);
    reviewPointerStartRef.current = clientX ?? null;
    reviewScrollStartRef.current = reviewOffsetRef.current;
    reviewWasDraggedRef.current = false;
  };

  const moveReviews = (clientX: number) => {
    const pointerStart = reviewPointerStartRef.current;
    const track = reviewTrackRef.current;
    if (pointerStart === null || !track) return;

    const distance = clientX - pointerStart;
    if (Math.abs(distance) > 7) reviewWasDraggedRef.current = true;

    let nextOffset = reviewScrollStartRef.current + distance;
    const setWidth = reviewSetWidthRef.current;
    if (setWidth) {
      while (nextOffset <= -setWidth * 3) nextOffset += setWidth * 2;
      while (nextOffset > -setWidth) nextOffset -= setWidth * 2;
    }
    reviewOffsetRef.current = nextOffset;
    track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
  };

  const resumeReviews = () => {
    reviewPointerStartRef.current = null;
    reviewsPausedRef.current = false;
    setReviewsPaused(false);
  };

  const normalizeReviewOffset = (nextOffset: number) => {
    const setWidth = reviewSetWidthRef.current;
    if (setWidth) {
      while (nextOffset <= -setWidth * 3) nextOffset += setWidth * 2;
      while (nextOffset > -setWidth) nextOffset -= setWidth * 2;
    }
    return nextOffset;
  };

  const setReviewOffset = (nextOffset: number) => {
    const track = reviewTrackRef.current;
    if (!track) return;
    const normalized = normalizeReviewOffset(nextOffset);
    reviewOffsetRef.current = normalized;
    track.style.transform = `translate3d(${normalized}px, 0, 0)`;
  };

  const scheduleReviewsResume = (delay = 520) => {
    if (reviewResumeTimerRef.current !== null) window.clearTimeout(reviewResumeTimerRef.current);
    reviewResumeTimerRef.current = window.setTimeout(() => {
      if (reviewTrackRef.current) reviewTrackRef.current.style.transition = "";
      reviewResumeTimerRef.current = null;
      resumeReviews();
    }, delay);
  };

  const setDesktopGalleryOffset = (nextOffset: number) => {
    const track = desktopGalleryTrackRef.current;
    if (!track) return;
    const setWidth = desktopGallerySetWidthRef.current;
    if (setWidth) {
      while (nextOffset <= -setWidth * 2) nextOffset += setWidth;
      while (nextOffset > 0) nextOffset -= setWidth;
    }
    desktopGalleryOffsetRef.current = nextOffset;
    track.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
  };

  const pauseDesktopGallery = (clientX?: number) => {
    desktopGalleryPausedRef.current = true;
    setDesktopGalleryPaused(true);
    desktopGalleryPointerStartRef.current = clientX ?? null;
    desktopGalleryStartOffsetRef.current = desktopGalleryOffsetRef.current;
    desktopGalleryWasDraggedRef.current = false;
  };

  const moveDesktopGallery = (clientX: number) => {
    const start = desktopGalleryPointerStartRef.current;
    if (start === null) return;
    const distance = clientX - start;
    if (Math.abs(distance) > 7) desktopGalleryWasDraggedRef.current = true;
    setDesktopGalleryOffset(desktopGalleryStartOffsetRef.current + distance);
  };

  const resumeDesktopGallery = () => {
    desktopGalleryPointerStartRef.current = null;
    desktopGalleryPausedRef.current = false;
    setDesktopGalleryPaused(false);
  };

  const stepReviews = (direction: -1 | 1) => {
    const track = reviewTrackRef.current;
    if (!track) return;
    const card = reviewViewportRef.current?.querySelector<HTMLElement>(".mct-review-card");
    const step = (card?.getBoundingClientRect().width ?? 440) + 16;
    pauseReviews();
    track.style.transition = "transform 420ms cubic-bezier(.22, .78, .25, 1)";
    setReviewOffset(reviewOffsetRef.current - direction * step);
    scheduleReviewsResume(460);
  };

  const getTouchDistance = (event: ReactTouchEvent<HTMLElement>) => {
    const first = event.touches[0];
    const second = event.touches[1];
    if (!first || !second) return 0;
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  };

  const clampLightboxOffset = (x: number, y: number, scale: number) => {
    const maxX = Math.max(0, (window.innerWidth * (scale - 1)) / 2);
    const maxY = Math.max(0, (window.innerHeight * 0.68 * (scale - 1)) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const startLightboxGesture = (event: ReactTouchEvent<HTMLElement>) => {
    if (event.touches.length >= 2) {
      lightboxGestureRef.current = {
        mode: "pinch",
        startX: 0,
        startY: 0,
        originX: lightboxTransform.x,
        originY: lightboxTransform.y,
        startScale: lightboxTransform.scale,
        startDistance: getTouchDistance(event),
      };
      return;
    }

    const touch = event.touches[0];
    if (!touch) return;
    lightboxGestureRef.current = {
      mode: lightboxTransform.scale > 1.01 ? "pan" : "swipe",
      startX: touch.clientX,
      startY: touch.clientY,
      originX: lightboxTransform.x,
      originY: lightboxTransform.y,
      startScale: lightboxTransform.scale,
      startDistance: 0,
    };
  };

  const moveLightboxGesture = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = lightboxGestureRef.current;

    if (event.touches.length >= 2) {
      event.preventDefault();
      const distance = getTouchDistance(event);
      if (gesture.mode !== "pinch" || !gesture.startDistance) {
        lightboxGestureRef.current = {
          ...gesture,
          mode: "pinch",
          startScale: lightboxTransform.scale,
          startDistance: distance,
          originX: lightboxTransform.x,
          originY: lightboxTransform.y,
        };
        return;
      }

      const scale = Math.max(1, Math.min(4, gesture.startScale * (distance / gesture.startDistance)));
      const offset = scale <= 1.01 ? { x: 0, y: 0 } : clampLightboxOffset(gesture.originX, gesture.originY, scale);
      setLightboxTransform({ scale, ...offset });
      return;
    }

    const touch = event.touches[0];
    if (!touch || gesture.mode !== "pan") return;
    event.preventDefault();
    const offset = clampLightboxOffset(
      gesture.originX + touch.clientX - gesture.startX,
      gesture.originY + touch.clientY - gesture.startY,
      lightboxTransform.scale,
    );
    setLightboxTransform((current) => ({ ...current, ...offset }));
  };

  const finishLightboxGesture = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = lightboxGestureRef.current;

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      lightboxGestureRef.current = {
        ...gesture,
        mode: lightboxTransform.scale > 1.01 ? "pan" : "idle",
        startX: touch.clientX,
        startY: touch.clientY,
        originX: lightboxTransform.x,
        originY: lightboxTransform.y,
      };
      return;
    }

    if (gesture.mode === "swipe" && lightboxTransform.scale <= 1.01) {
      const touch = event.changedTouches[0];
      const distanceX = (touch?.clientX ?? gesture.startX) - gesture.startX;
      const distanceY = (touch?.clientY ?? gesture.startY) - gesture.startY;
      if (Math.abs(distanceX) > 42 && Math.abs(distanceX) > Math.abs(distanceY)) {
        stepLightbox(distanceX > 0 ? -1 : 1);
      }
    }

    if (lightboxTransform.scale <= 1.01) setLightboxTransform({ scale: 1, x: 0, y: 0 });
    lightboxGestureRef.current.mode = "idle";
  };

  return (
    <div className="mct-mobile">
      {introVisible && (
        <div className="mct-intro" aria-hidden="true">
          <div className="mct-intro-mark mct-intro-mark-yulia"><img className="mct-intro-logo-yulia" src={site.images.introLogo} alt="" /></div>
        </div>
      )}

      <header className="mct-hero" id="mobile-top" ref={heroRef}>
        <div className="mct-shell">
          <div className="mct-topbar">
            <a className="mct-brand mct-brand-yulia-image" href="#mobile-top" aria-label={`${site.master.name}, наверх`}><img src={site.images.headerLogo} alt="" /></a>
            <nav className="dct-navigation" aria-label="Основные разделы сайта">
              <a href="#mobile-prices">Услуги и цены</a>
              <a href="#mobile-about">О мастере</a>
              <a href="#mobile-reviews">Отзывы</a>
              <a href="#mobile-location">Визит и запись</a>
            </nav>
            <div className="dct-top-actions" aria-label={`Быстрые способы связи с ${site.master.name}`}>
              <a className="dct-top-phone" href={site.contacts.phoneHref} aria-label={`Позвонить ${site.master.dative} по номеру ${site.contacts.phoneDisplay}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 3.5 9.3 8c.2.5.1 1-.3 1.4l-1.4 1.2c1 2.1 2.7 3.8 4.8 4.8l1.2-1.4c.4-.4.9-.5 1.4-.3l4.5 2.2c.5.2.8.8.6 1.4l-.6 2.3c-.2.7-.8 1.1-1.5 1.1C10 20.7 3.3 14 3.3 6c0-.7.4-1.3 1.1-1.5l2.3-.6c.6-.2 1.2.1 1.4.6Z" /></svg>
                <span><small>Позвонить</small><strong>{site.contacts.phoneDisplay}</strong></span>
              </a>
              <a className="dct-top-icon" href={personalTelegramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Написать ${site.master.dative} в Telegram`} title="Telegram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </a>
              <a className="dct-top-icon" href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Открыть адрес ${site.master.genitive} в Яндекс Картах`} title="Яндекс Карты">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              </a>
            </div>
            <div className="mct-menu-wrap" ref={menuRef}>
              <button
                className={`mct-menu-button${menuOpen ? " is-open" : ""}`}
                type="button"
                aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <span /><span /><span />
              </button>
              {menuOpen && (
                <nav className="mct-menu-panel" id="mobile-navigation" aria-label="Разделы сайта">
                  <a href="#mobile-portfolio" onClick={() => setMenuOpen(false)}><span>•</span>Портфолио</a>
                  <a href="#mobile-prices" onClick={() => setMenuOpen(false)}><span>•</span>Услуги и цены</a>
                  <a href="#mobile-about" onClick={() => setMenuOpen(false)}><span>•</span>О мастере</a>
                  <a href="#mobile-reviews" onClick={() => setMenuOpen(false)}><span>•</span>Отзывы</a>
                  <a href="#mobile-location" onClick={() => setMenuOpen(false)}><span>•</span>Визит и запись</a>
                </nav>
              )}
            </div>
          </div>
          <div className="mct-hero-content">
            <div className="mct-hero-meta">
              <span>{site.location.city}</span>
              <a className="mct-hero-phone" href={site.contacts.phoneHref} aria-label={`Позвонить ${site.master.dative} по номеру ${site.contacts.phoneDisplay}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M7.1 3.5 9.3 8c.2.5.1 1-.3 1.4l-1.4 1.2c1 2.1 2.7 3.8 4.8 4.8l1.2-1.4c.4-.4.9-.5 1.4-.3l4.5 2.2c.5.2.8.8.6 1.4l-.6 2.3c-.2.7-.8 1.1-1.5 1.1C10 20.7 3.3 14 3.3 6c0-.7.4-1.3 1.1-1.5l2.3-.6c.6-.2 1.2.1 1.4.6Z" />
                </svg>
                <span>{site.contacts.phoneDisplay}</span>
              </a>
            </div>
            <h1>{site.master.name} — ваш <em>{site.master.heroEmphasis}</em></h1>
            <p className="mct-hero-copy">{site.master.heroCopy}</p>
          </div>
          <div
            className="mct-hero-visual"
          >
            <div className="mct-yulia-tools" aria-hidden="true"><img className="mct-yulia-hero-image" src={site.images.heroDecoration} alt="" /></div>
            <figure className="dct-hero-portrait">
              <img src={site.images.portrait} alt={`${site.master.name} — ${site.master.imageAlt}`} />
              <figcaption><span>{site.master.name}</span><small>{site.master.heroCaption}</small></figcaption>
            </figure>
            <div className="mct-palette-stage" aria-hidden="true">
              <div className="mct-palette-set">
                {paletteSamples.map((shade, index) => {
                  const leftAngle = -47 + (94 / (paletteSamples.length - 1)) * index;
                  const rightAngle = -leftAngle;
                  const armGradientId = `mct-palette-arm-${index}`;
                  const tipGradientId = `mct-palette-tip-${index}`;
                  const tipGlossId = `mct-palette-gloss-${index}`;
                  const armGlowId = `mct-palette-arm-glow-${index}`;
                  const tipBloomId = `mct-palette-bloom-${index}`;

                  return (
                    <span
                      className="mct-palette-stick"
                      key={`${shade.base}-${index}`}
                      style={{
                        "--left-angle": `${leftAngle}deg`,
                        "--right-angle": `${rightAngle}deg`,
                        "--stack": index + 1,
                      } as CSSProperties}
                    >
                      <svg viewBox="0 0 54 320" aria-hidden="true" focusable="false">
                        <defs>
                          <linearGradient id={armGradientId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#a7a39d" stopOpacity=".42" />
                            <stop offset="0.13" stopColor="#e8e6e1" stopOpacity=".66" />
                            <stop offset="0.38" stopColor="#fffefb" stopOpacity=".84" />
                            <stop offset="0.62" stopColor="#f4f2ed" stopOpacity=".68" />
                            <stop offset="0.87" stopColor="#d2cec7" stopOpacity=".5" />
                            <stop offset="1" stopColor="#96918a" stopOpacity=".48" />
                          </linearGradient>
                          <linearGradient id={armGlowId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#fff" stopOpacity=".82" />
                            <stop offset=".45" stopColor="#fff" stopOpacity=".2" />
                            <stop offset="1" stopColor="#fff" stopOpacity=".55" />
                          </linearGradient>
                          <linearGradient id={tipGradientId} x1="0" y1="0" x2="1" y2="0.12">
                            <stop offset="0" stopColor={shade.light} />
                            <stop offset="0.22" stopColor={shade.base} />
                            <stop offset="0.7" stopColor={shade.base} />
                            <stop offset="1" stopColor={shade.dark} />
                          </linearGradient>
                          <linearGradient id={tipGlossId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#fff" stopOpacity="0" />
                            <stop offset="0.31" stopColor="#fff" stopOpacity=".76" />
                            <stop offset="0.5" stopColor="#fff" stopOpacity=".17" />
                            <stop offset="1" stopColor="#fff" stopOpacity="0" />
                          </linearGradient>
                          <radialGradient id={tipBloomId} cx="38%" cy="22%" r="74%">
                            <stop offset="0" stopColor="#fff" stopOpacity=".34" />
                            <stop offset=".5" stopColor={shade.base} stopOpacity=".05" />
                            <stop offset="1" stopColor={shade.dark} stopOpacity=".2" />
                          </radialGradient>
                        </defs>
                        <path
                          className="mct-palette-arm"
                          d="M17 75 Q17 68 22 64 H32 Q37 68 37 75 V87 Q37 92 41 98 L43 307 Q43 316 35 318 H19 Q11 316 11 307 L13 98 Q17 92 17 87 Z"
                          fill={`url(#${armGradientId})`}
                        />
                        <path className="mct-palette-arm-glow" d="M20 76 Q20 70 24 68 H28 L29 309 Q29 314 25 315 H21 Q16 313 16 306 L18 99 Q20 92 20 86 Z" fill={`url(#${armGlowId})`} />
                        <path className="mct-palette-arm-light" d="M18 78 Q18 91 15 99 L15 305 Q15 312 21 314" />
                        <path className="mct-palette-arm-edge" d="M36 76 Q36 91 39 99 L42 305 Q42 312 36 315" />
                        <path className="mct-palette-tip-cast" d="M10 56 Q10 49 16 47 H38 Q44 49 44 56 V70 Q44 81 36 88 H18 Q10 81 10 70 Z" />
                        <path
                          className="mct-palette-tip"
                          d="M12 22 C12 9 18 3 27 3 C36 3 42 9 42 22 V57 C42 74 36 86 27 92 C18 86 12 74 12 57 Z"
                          fill={`url(#${tipGradientId})`}
                        />
                        <path className="mct-palette-tip-bloom" d="M13 22 C13 10 19 4 27 4 C35 4 41 10 41 22 V56 C41 72 35 83 27 89 C19 83 13 72 13 56 Z" fill={`url(#${tipBloomId})`} />
                        <path className="mct-palette-tip-shade" d="M35 6 Q41 12 41 23 V56 Q41 72 34 82 Q37 62 36 39 Q36 17 35 6 Z" />
                        <path
                          className="mct-palette-tip-gloss"
                          d="M19 8 Q14 19 15 43 Q15 67 20 79 Q23 84 25 75 Q21 55 22 34 Q22 16 24 7 Q21 6 19 8 Z"
                          fill={`url(#${tipGlossId})`}
                        />
                        <path className="mct-palette-tip-highlight" d="M19 8 Q27 2 35 8" />
                        <path className="mct-palette-tip-rim" d="M13 23 Q13 10 22 5 M41 23 Q41 10 32 5" />
                      </svg>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mct-hero-bottom">
            <div className="mct-hero-actions">
              <a className="mct-main-cta" href={bookingUrl} target="_blank" rel="noopener noreferrer">Записаться онлайн&nbsp; →</a>
              <a className="mct-quiet-link" href="#mobile-portfolio">Смотреть работы ↓</a>
            </div>
            <div className="mct-stats" aria-label="Опыт и рейтинг мастера">
              <div className="mct-stat"><strong>{site.master.experienceYears}</strong><span>лет опыта</span></div>
              <div className="mct-stat"><strong>{site.reputation.rating} <i className="mct-stat-star">★</i></strong><span>рейтинг</span></div>
              <div className="mct-stat"><strong>{allServices.length}</strong><span>услуги</span></div>
            </div>
          </div>
        </div>
      </header>

      <section className="mct-section" id="mobile-portfolio">
        <div className="mct-shell mct-reveal">
          <div className="mct-section-head">
            <div><p className="mct-section-kicker">Портфолио</p><h2>Работы</h2></div>
            
          </div>
        </div>
        <div className="mct-shell mct-reveal">
          <div className="mct-work-grid" aria-label="Подборка работ">
            {featuredWorks.map((item) => (
              <button className="mct-work-tile" type="button" key={item.src} onClick={() => openLightbox(item.src)} aria-label={`Открыть фотографию: ${item.alt}`}>
                <img src={item.src} alt={item.alt} loading="lazy" />
              </button>
            ))}
          </div>
          <div className="dct-film-strip" aria-label={`Бесконечная галерея работ ${site.master.genitive}`}>
            <div
              className={`dct-gallery-viewport${desktopGalleryPaused ? " is-paused" : ""}`}
              ref={desktopGalleryViewportRef}
              onMouseEnter={() => pauseDesktopGallery()}
              onMouseLeave={() => { if (desktopGalleryPointerStartRef.current === null) resumeDesktopGallery(); }}
              onPointerDown={(event) => {
                if (!event.isPrimary) return;
                if (event.pointerType === "mouse") event.preventDefault();
                pauseDesktopGallery(event.clientX);
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.isPrimary || desktopGalleryPointerStartRef.current === null) return;
                if (event.pointerType === "mouse") event.preventDefault();
                moveDesktopGallery(event.clientX);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                resumeDesktopGallery();
              }}
              onPointerCancel={resumeDesktopGallery}
              onLostPointerCapture={resumeDesktopGallery}
              onDragStart={(event) => event.preventDefault()}
            >
              <div className="dct-gallery-track" ref={desktopGalleryTrackRef}>
                {Array.from({ length: desktopGallerySetCount }, (_, setIndex) => (
                  <div className="dct-gallery-set" key={`gallery-set-${setIndex}`} aria-hidden={setIndex !== 1}>
                    {desktopGalleryModules.map((module, moduleIndex) => (
                      <div className={`dct-gallery-module dct-gallery-module-${moduleIndex + 1}`} key={`gallery-module-${setIndex}-${moduleIndex}`}>
                        {module.map((item, itemIndex) => (
                          <button
                            className={`dct-film-frame dct-film-frame-${itemIndex + 1}`}
                            type="button"
                            key={`${setIndex}-${item.src}`}
                            onClick={(event) => {
                              if (desktopGalleryWasDraggedRef.current) {
                                event.preventDefault();
                                desktopGalleryWasDraggedRef.current = false;
                                return;
                              }
                              openLightbox(item.src);
                            }}
                            aria-label={`Открыть фотографию: ${item.alt}`}
                            tabIndex={setIndex === 1 ? 0 : -1}
                          >
                            <img src={item.src} alt={item.alt} loading="lazy" draggable="false" />
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className="mct-gallery-button" type="button" onClick={() => setGalleryOpen(true)}><span>Открыть галерею</span><span aria-hidden="true">→</span></button>
        </div>
      </section>

      <section className="mct-prices mct-reveal" id="mobile-prices">
        <div className="mct-shell">
          <div className="mct-price-head">
            <p className="mct-section-kicker">Услуги и цены</p>
            <h2>Выберите<br />услугу</h2>
            <span>Актуальная стоимость и продолжительность указаны для каждой процедуры. Онлайн-запись откроется в новой вкладке.</span>
          </div>
          <div className="mct-tabs-ribbon-wrap">
            <span className="mct-tabs-swipe-cue" aria-hidden="true">
              <svg viewBox="0 0 18 10" fill="none"><path d="M1 5h14M11 1.5 15 5l-4 3.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <div className="mct-tabs mct-tabs-scroll" role="tablist" aria-label="Категории услуг">
              <div className="mct-tabs-track" role="presentation">
                <button className={`mct-tab mct-tab-all${category === "all" ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === "all"} onClick={() => switchCategory("all")}>Все</button>
                
                {serviceGroups.manicure.services.length > 0 && <button className={`mct-tab${category === "manicure" ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === "manicure"} onClick={() => switchCategory("manicure")}>{serviceGroups.manicure.label}</button>}
                {serviceGroups.pedicure.services.length > 0 && <button className={`mct-tab${category === "pedicure" ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === "pedicure"} onClick={() => switchCategory("pedicure")}>{serviceGroups.pedicure.label}</button>}
                {serviceGroups.podology.services.length > 0 && <button className={`mct-tab${category === "podology" ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === "podology"} onClick={() => switchCategory("podology")}>{serviceGroups.podology.label}</button>}
                {serviceGroups.training.services.length > 0 && <button className={`mct-tab${category === "training" ? " is-active" : ""}`} type="button" role="tab" aria-selected={category === "training"} onClick={() => switchCategory("training")}>{serviceGroups.training.label}</button>}
              </div>
            </div>
          </div>
          <div className={`mct-service-list${isCollapsibleCategory && !expanded ? " is-collapsed" : " is-expanded"}`}>
            {visibleServices.map((service) => {
              const hasVariants = Boolean(service.variants?.length);
              return (
                <a className={`mct-service-row yulia-price-row yulia-service-link${service.sectionLabel ? " has-group-label" : ""}${hasVariants ? " has-variants" : ""}`} href={service.url} target="_blank" rel="noopener noreferrer" aria-label={`${service.name} — открыть запись в ${site.template.bookingProvider}`} key={`${service.sectionKey ?? category}-${service.name}`}>
                  {service.sectionLabel && <div className="mct-service-group-label">{service.sectionLabel}</div>}
                  <div className="yulia-service-body">
                    <div className="yulia-service-head">
                      <strong className="yulia-service-title">{service.displayName || service.name}</strong>
                      {!hasVariants && <b className="yulia-service-price">{service.price}</b>}
                    </div>
                    {service.description && <p className={`dct-service-description yulia-service-description${service.detailClass === "contouring" ? " yulia-contouring-detail" : ""}`}>{service.description}</p>}
                    {!hasVariants && service.time && <small className="yulia-service-time">{service.time}</small>}
                    {hasVariants && (
                      <div className="yulia-service-variants">
                        {service.variants!.map((item) => (
                          <div className="yulia-service-variant" key={item.label}>
                            <span>{item.label}{item.time ? <small>{item.time}</small> : null}</span>
                            <b>{item.price}</b>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
          {isCollapsibleCategory && services.length > 6 && (
            <button className={`mct-more-services${expanded ? " is-open" : ""}`} type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Свернуть услуги" : "Открыть все услуги"}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
      </section>

      <section className="mct-about mct-reveal" id="mobile-about">
        <div className="mct-shell">
          <div className="mct-about-head">
            <div><p className="mct-section-kicker">О мастере</p><h2>{site.master.aboutTitle}</h2></div>
            <span className="mct-about-monogram" aria-hidden="true">{site.master.monogram}</span>
          </div>
          <div className="mct-about-card">
            <div className="mct-about-portrait-wrap">
              <figure className="mct-about-portrait">
                <img src={site.images.about} alt={`${site.master.name} — ${site.master.imageAlt}`} loading="lazy" />
              </figure>
              <div className="mct-about-experience" aria-label={site.master.experienceAria}>
                <strong>{site.master.experienceYears}</strong>
                <span>лет<br />опыта</span>
              </div>
            </div>
            <div className="mct-about-copy">
              <p className="mct-about-lead">{site.master.aboutLead}</p>
              <p>{site.master.aboutParagraphs[0]}</p>
              <p>{site.master.aboutParagraphs[1]}</p>
              <ul className="mct-about-list">{site.master.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
            </div>
          </div>

          <div className="mct-amenities" aria-label={`О визите к ${site.master.dative}`}>
            <div className="mct-amenities-head"><p className="mct-section-kicker">Дополнительно</p><span>Полезно перед записью</span></div>
            <div className="mct-amenities-grid">
              {site.amenities.map((item) => <article key={item.title}><strong>{item.title}</strong><span>{item.text}</span></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mct-reviews mct-reveal" id="mobile-reviews">
        <div className="mct-shell">
          <p className="mct-section-kicker">Отзывы</p><h2>Что говорят<br />клиенты</h2>
          <a className="mct-review-summary" href={reviewsUrl} target="_blank" rel="noopener noreferrer"><span>Все отзывы в {site.template.bookingProvider} →</span></a>
          <p className="dct-review-drag-hint">Зажмите ленту мышью и двигайте в любую сторону</p>
          <div className="dct-review-controls" aria-label="Управление лентой отзывов">
            <button type="button" onClick={() => stepReviews(-1)} aria-label="Показать предыдущие отзывы">←</button>
            <button type="button" onClick={() => stepReviews(1)} aria-label="Показать следующие отзывы">→</button>
          </div>
        </div>
        <div
          className={`mct-review-viewport${reviewsPaused ? " is-paused" : ""}`}
          ref={reviewViewportRef}
          aria-label={`Настоящие отзывы клиентов ${site.master.genitive}. Лента движется автоматически, при касании останавливается.`}
          onPointerDown={(event) => {
            if (!event.isPrimary) return;
            pauseReviews(event.clientX);
            if (event.pointerType === "mouse" && window.matchMedia("(min-width: 768px)").matches && !event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerMove={(event) => {
            if (!event.isPrimary || !reviewsPausedRef.current) return;
            if (reviewPointerStartRef.current !== null && Math.abs(event.clientX - reviewPointerStartRef.current) > 7 && !event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.setPointerCapture(event.pointerId);
            }
            moveReviews(event.clientX);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            resumeReviews();
          }}
          onPointerCancel={resumeReviews}
          onWheel={(event) => {
            const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
            if (Math.abs(horizontalDelta) < 1 || Math.abs(horizontalDelta) < Math.abs(event.deltaY) * .55) return;
            event.preventDefault();
            pauseReviews();
            setReviewOffset(reviewOffsetRef.current - horizontalDelta * 1.12);
            scheduleReviewsResume();
          }}
        >
          <div className="mct-review-track" ref={reviewTrackRef}>
            {Array.from({ length: reviewSetCount }, (_, setIndex) => (
              <div className="mct-review-set" key={setIndex} aria-hidden={setIndex !== 2}>
                {reviews.map((review) => (
                  <a
                    className={`mct-review-card${review.text.length > 240 ? " is-long" : ""}`}
                    href={reviewsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={`${setIndex}-${review.author}`}
                    tabIndex={setIndex === 2 ? 0 : -1}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    onClick={(event) => {
                      if (!reviewWasDraggedRef.current) return;
                      event.preventDefault();
                      reviewWasDraggedRef.current = false;
                    }}
                  >
                    <span>★★★★★</span>
                    <blockquote>«{review.text}»</blockquote>
                    <small>{review.author} · {site.template.reviewSource}</small>
                    <i>Подробнее →</i>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mct-visit mct-reveal" id="mobile-location" ref={finalBookRef}>
        <div className="mct-shell">
          <div className="mct-visit-booking" id="mobile-booking">
            <div className="mct-visit-booking-top">
              <p className="mct-section-kicker">Запись и связь</p>
              <span className={`mct-open-status${openStatus.isOpen === true ? " is-open" : openStatus.isOpen === false ? " is-closed" : ""}`}>
                <i aria-hidden="true" />{openStatus.label}
              </span>
            </div>
            <h3>Запишитесь онлайн<br /><em>или свяжитесь любым удобным способом</em></h3>
            <p>Выберите свободное время в {site.template.bookingProvider}. Если нужно уточнить услугу или подобрать процедуру, напишите {site.master.dative} напрямую.</p>
            <div className="mct-visit-actions">
              <a className="mct-final-cta" href={bookingUrl} target="_blank" rel="noopener noreferrer"><span>Выбрать время онлайн</span><i className="mct-link-arrow" aria-hidden="true" /></a>
              <div className="mct-final-contact-grid" aria-label={`Способы связи с ${site.master.instrumental}`}>
                <a className="mct-final-secondary" href={site.contacts.phoneHref}>
                  <span className="mct-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg></span>
                  <span className="mct-contact-copy"><strong>Позвонить</strong><small>{site.master.dative} · {site.contacts.phoneDisplay}</small></span><i className="mct-link-arrow" aria-hidden="true" />
                </a>
                <a className="mct-final-secondary" href={personalTelegramUrl} target="_blank" rel="noopener noreferrer">
                  <span className="mct-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg></span>
                  <span className="mct-contact-copy"><strong>Telegram</strong><small>Написать {site.master.dative}</small></span><i className="mct-link-arrow" aria-hidden="true" />
                </a>
                <a className="mct-final-secondary is-vk" href={vkUrl} target="_blank" rel="noopener noreferrer"><span className="mct-contact-icon" aria-hidden="true"><span className="mct-vk-letters">VK</span></span><span className="mct-contact-copy"><strong>ВКонтакте</strong><small>Написать {site.master.dative}</small></span><i className="mct-link-arrow" aria-hidden="true" /></a>
                <a className="mct-final-secondary" href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <span className="mct-contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
                  <span className="mct-contact-copy"><strong>Яндекс Карты</strong><small>Адрес и маршрут</small></span><i className="mct-link-arrow" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
          <div className="mct-visit-details">
            <p className="mct-visit-address">{site.location.address}<span>{site.location.metro} · {site.location.schedule}</span></p>
            <div className="mct-map-wrap">
              <iframe
                className="mct-map-mobile"
                src={mobileMapEmbedUrl}
                title={`${site.master.name} на Яндекс Картах`}
                loading="lazy"
                allowFullScreen
              />
              <iframe
                className="dct-map-desktop"
                src={desktopMapEmbedUrl}
                title={`Точка ${site.master.name} на Яндекс Картах`}
                loading="lazy"
                allowFullScreen
              />
              <a href={routeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Построить маршрут к ${site.master.dative} в Яндекс Картах`}>Построить маршрут →</a>
            </div>
          </div>
        </div>
      </section>
      <a className="mct-stluxe-footer" href="https://tanem.ru/" target="_blank" rel="noopener noreferrer"><span className="stl-tanem-mark">T</span><span className="stl-tanem-credit">Создано в <strong>TANEM.ru</strong></span></a>

      <div className={`mct-sticky-wrap${stickyVisible && !galleryOpen ? " is-visible" : ""}`} aria-hidden={!stickyVisible || galleryOpen}>
        <a className="mct-sticky" href={bookingUrl} target="_blank" rel="noopener noreferrer" tabIndex={stickyVisible && !galleryOpen ? 0 : -1}>
          <span className="mct-sticky-icon dct-sticky-mobile-mark">{site.brand.monogram}</span><span className="dct-sticky-live" aria-hidden="true"><i /></span><span className="mct-sticky-copy"><strong>Записаться онлайн</strong><small>Открыть свободное время</small></span><span className="mct-sticky-arrow" aria-hidden="true">→</span>
        </a>
      </div>

      {galleryOpen && (
        <div className="mct-gallery-overlay" role="dialog" aria-modal="true" aria-label={`Галерея ${site.master.genitive}`}>
          <div className="mct-gallery-top"><strong>Галерея</strong><button className="mct-gallery-close" type="button" onClick={() => setGalleryOpen(false)} aria-label="Закрыть галерею">×</button></div>
          <div className="mct-gallery-content">
            <h3>Работы</h3>
            <div className="mct-gallery-works">
              {galleryWorks.map((item) => (
                <button className="mct-gallery-image" type="button" key={item.src} onClick={() => openLightbox(item.src)} aria-label={`Открыть фотографию: ${item.alt}`}>
                  <img src={item.src} alt={item.alt} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <div className={`mct-lightbox${lightboxTransform.scale > 1.01 ? " is-zoomed" : ""}`} role="dialog" aria-modal="true" aria-label="Полноэкранный просмотр фотографии" onClick={() => setLightboxIndex(null)}>
          <button className="mct-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Закрыть фотографию">×</button>
          <span className="mct-lightbox-hint">Разведите двумя пальцами, чтобы увеличить</span>
          <button className="mct-lightbox-nav mct-lightbox-prev" type="button" onClick={(event) => { event.stopPropagation(); stepLightbox(-1); }} aria-label="Предыдущая фотография" tabIndex={lightboxTransform.scale > 1.01 ? -1 : 0}>‹</button>
          <figure
            className="mct-lightbox-figure"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={startLightboxGesture}
            onTouchMove={moveLightboxGesture}
            onTouchEnd={finishLightboxGesture}
            onTouchCancel={finishLightboxGesture}
          >
            <div className="mct-lightbox-image-stage">
              <img
                src={lightboxItems[lightboxIndex].src}
                alt={lightboxItems[lightboxIndex].alt}
                draggable="false"
                style={{ transform: `translate3d(${lightboxTransform.x}px, ${lightboxTransform.y}px, 0) scale(${lightboxTransform.scale})` }}
              />
            </div>
            <figcaption><span>{lightboxItems[lightboxIndex].alt}</span><small>{String(lightboxIndex + 1).padStart(2, "0")} / {String(lightboxItems.length).padStart(2, "0")}</small></figcaption>
          </figure>
          {!galleryOpen && (
            <button
              className="mct-lightbox-gallery-cta"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxIndex(null);
                setGalleryOpen(true);
              }}
            >Открыть галерею</button>
          )}
          <button className="mct-lightbox-nav mct-lightbox-next" type="button" onClick={(event) => { event.stopPropagation(); stepLightbox(1); }} aria-label="Следующая фотография" tabIndex={lightboxTransform.scale > 1.01 ? -1 : 0}>›</button>
        </div>
      )}
    </div>
  );
}
