"use client";
import { useEffect, useState } from "react";
import styles from "@/app/home.module.css";

const DATA = [
  { q: "Thirty minutes of advice saved our team a week.", a: "Minh, Startup founder" },
  { q: "Fair pricing, flexible schedule, and clear follow-up materials.", a: "Lan, Product Manager" },
  { q: "Closed brand deals faster thanks to practical tips from creators.", a: "Huy, Marketing" },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % DATA.length), 6000);
    return () => clearInterval(t);
  }, []);
  const it = DATA[i];
  return (
    <section className={styles.testimonials}>
      <div className="container">
        <div className={styles.quote}>
          <p>{it.q}</p>
          <span className="muted">{it.a}</span>
        </div>
      </div>
    </section>
  );
}