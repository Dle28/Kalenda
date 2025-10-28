"use client";
import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    nodes.forEach((el) => {
      el.classList.add('reveal');
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    nodes.forEach((el) => io.observe(el));

    let raf = 0;
    const onScroll = () => {
      if (raf) return; raf = requestAnimationFrame(() => {
        raf = 0;
        const floats = document.querySelectorAll<HTMLElement>('[data-float]');
        const y = window.scrollY || window.pageYOffset || 0;
        floats.forEach((el) => {
          const factor = Number(el.getAttribute('data-float') || '0.02');
          const offset = Math.sin((y + el.offsetTop) * 0.002) * (factor * 60);
          el.style.setProperty('--float-y', `${offset.toFixed(2)}px`);
        });
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, []);
  return null;
}
