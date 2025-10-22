"use client";

import { useState } from "react";

interface CalendarSlot {
  id: string;
  price: number;
  time: string;
  date: Date;
  type?: "standard" | "auction";
}

const HOUR_HEIGHT = 60; // pixels per hour
const TIME_COLUMN_WIDTH = 80; // pixels

export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Generate week days
  const getWeekDays = () => {
    const days: Date[] = [];
    const start = new Date(currentWeek);
    const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    start.setDate(start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust to start from Monday
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Generate time slots (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour.toString().padStart(2, "0")}:00 ${period}`;
  });

  // Mock data - replace with actual data from your program
  const slots: CalendarSlot[] = [
    { id: "1", price: 10, time: "09:00 AM", date: new Date(2024, 9, 20), type: "standard" },
    { id: "2", price: 10, time: "10:00 AM", date: new Date(2024, 9, 20), type: "standard" },
    { id: "3", price: 10, time: "11:00 AM", date: new Date(2024, 9, 21), type: "standard" },
    { id: "4", price: 20, time: "10:10 AM", date: new Date(2024, 9, 23), type: "standard" },
    { id: "5", price: 10, time: "02:00 PM", date: new Date(2024, 9, 23), type: "standard" },
    { id: "6", price: 10, time: "10:00 AM", date: new Date(2024, 9, 24), type: "standard" },
    { id: "7", price: 10, time: "04:00 PM", date: new Date(2024, 9, 24), type: "standard" },
    { id: "8", price: 10, time: "Auction", date: new Date(2024, 9, 23), type: "auction" },
  ];

  const weekDays = getWeekDays();

  const getSlotPosition = (time: string) => {
    const [hourMin, period] = time.split(" ");
    const [hour, min] = hourMin.split(":").map(Number);
    let totalHour = hour === 12 ? 0 : hour;
    if (period === "PM" && hour !== 12) totalHour += 12;
    // Return position in pixels: (hours * HOUR_HEIGHT + minutes ratio)
    return totalHour * HOUR_HEIGHT + (min / 60) * HOUR_HEIGHT;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return { day, month };
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 backdrop-blur flex flex-col">
      {/* Header */}
      <div className="flex border-b border-white/10">
        <div style={{ width: `${TIME_COLUMN_WIDTH}px` }} className="p-4" /> {/* Empty corner */}
        {weekDays.map((day, idx) => {
          const { day: d, month } = formatDate(day);
          const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={idx}
              className={`flex-1 flex flex-col items-center justify-center border-l border-white/10 p-4 ${
                isToday ? "bg-emerald-500/10" : ""
              }`}
            >
              <span className="text-xs text-white/60">{dayName}</span>
              <span className="text-lg font-semibold text-white">
                {month} {d}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden" style={{ direction: "ltr" }}>
        <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
          <div
            className="grid"
            style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(0, 1fr))` }}
          >
            {/* Time column - fixed width, first column */}
            <div className="border-r border-white/10 bg-slate-950/80">
              {timeSlots.map((time, idx) => (
                <div
                  key={idx}
                  className="border-b border-white/5 px-2 py-1 text-right text-xs text-white/40 flex items-start"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {time}
                </div>
              ))}
            </div>

            {/* 7 day columns */}
            {weekDays.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="relative border-l border-white/10"
                style={{ minHeight: `${timeSlots.length * HOUR_HEIGHT}px` }}
              >
                {/* Hour separators */}
                {timeSlots.map((_, timeIdx) => (
                  <div
                    key={timeIdx}
                    className="border-b border-white/5 absolute w-full"
                    style={{ top: `${timeIdx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px`, left: 0, right: 0 }}
                  />
                ))}

                {/* Render slots for this day */}
                {slots
                  .filter((slot) => slot.date.toDateString() === day.toDateString())
                  .map((slot) => {
                    if (slot.time === "Auction") {
                      return (
                        <div
                          key={slot.id}
                          className="absolute left-1 right-1 rounded-lg px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 overflow-hidden"
                          style={{ bottom: "4px", height: "40px" }}
                        >
                          <div className="truncate font-bold">Auction ${slot.price.toFixed(2)}</div>
                        </div>
                      );
                    }

                    const topPx = getSlotPosition(slot.time);
                    return (
                      <div
                        key={slot.id}
                        className="absolute left-1 right-1 rounded-lg px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 overflow-hidden"
                        style={{ top: `${topPx}px`, height: "40px" }}
                      >
                        <div className="truncate">${slot.price.toFixed(2)} • {slot.time}</div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
