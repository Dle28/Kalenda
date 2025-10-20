"use client";
import { useEffect, useState } from "react";
import styles from '@/app/home.module.css';

const DATA = [
  { q: '“Tư vấn 30 phút nhưng tiết kiệm cho team cả tuần.”', a: 'Minh, Startup VN' },
  { q: '“Giá hợp lý, lịch linh hoạt, tài liệu sau buổi rất rõ ràng.”', a: 'Lan, PM' },
  { q: '“Chốt deal brand nhanh hơn nhờ gợi ý thực tế từ creator.”', a: 'Huy, Marketing' },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(()=> setI((x)=> (x+1)%DATA.length), 6000); return ()=>clearInterval(t) }, []);
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

