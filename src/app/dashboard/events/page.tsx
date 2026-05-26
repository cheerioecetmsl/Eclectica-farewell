"use client";

import { Calendar, MapPin, Clock, ArrowLeft, Star, Music, Award } from "lucide-react";
import Link from "next/link";

const events = [
  {
    id: 1,
    title: "Eclectica Exit Poll",
    date: "TBA",
    time: "TBA",
    location: "Online",
    description: "why should indian media have all the fun?",
    icon: <Award className="text-[#ffca28]" size={32} strokeWidth={2.5} />,
    color: "bg-[#fff9c4]",
    borderColor: "border-[#ffca28]",
    slug: "exit-poll"
  },
  {
    id: 2,
    title: "Chase the Colours, not your Ex",
    date: "TBA",
    time: "TBA",
    location: "Media Wing",
    description: "gaming event by the media wing",
    icon: <Star className="text-[#ff8c00]" size={32} strokeWidth={2.5} />,
    color: "bg-[#ffe0b2]",
    borderColor: "border-[#ff8c00]",
    slug: "chase-colours"
  },
  {
    id: 3,
    title: "Yeh to Dhoti khol raha hai",
    date: "TBA",
    time: "TBA",
    location: "Online",
    description: "fun online confession event",
    icon: <Music className="text-[#2d5da1]" size={32} strokeWidth={2.5} />,
    color: "bg-[#e8f4f8]",
    borderColor: "border-[#2d5da1]",
    slug: "confessions"
  }
];

export default function EventsPage() {
  return (
    <main className="min-h-screen py-16 px-6 relative bg-[#fdfbf7]">
      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-full text-[#2d2d2d] text-sm font-bold font-patrick uppercase hover:-translate-y-1 transition-transform mb-6">
            <ArrowLeft size={16} strokeWidth={2.5} /> Return to Hub
          </Link>
          <div className="hand-card bg-white p-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden inline-block w-full rotate-1">
            <div className="tack-decoration" />
            <h1 className="text-5xl md:text-6xl font-bold text-[#2d2d2d] font-kalam uppercase leading-tight -rotate-2">
              Upcoming Events
            </h1>
            <p className="text-[#2d2d2d]/80 font-patrick text-2xl mt-4 rotate-1">
              Mark your calendars for the final celebrations.
            </p>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, idx) => (
            <Link 
              href={`/dashboard/events/${event.slug}`}
              key={event.id}
              className={`hand-card block ${event.color} p-8 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative group hover:-translate-y-2 transition-transform duration-300 ${idx % 2 === 0 ? '-rotate-2' : 'rotate-2'}`}
            >
              {/* Pin Decoration */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#ff4d4d] border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] z-10" />
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {event.icon}
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-white border-[2px] border-[#2d2d2d] rounded-full text-xs font-bold font-patrick uppercase tracking-widest text-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]">
                    {event.date}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-bold font-kalam text-[#2d2d2d] leading-tight">
                  {event.title}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[#2d2d2d]/80 font-patrick text-lg">
                    <Clock size={18} strokeWidth={2.5} className="shrink-0" />
                    <span className="font-bold">{event.time}</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#2d2d2d]/80 font-patrick text-lg">
                    <MapPin size={18} strokeWidth={2.5} className="shrink-0 mt-1" />
                    <span className="font-bold leading-tight">{event.location}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t-[2px] border-dashed border-[#2d2d2d]/20">
                  <p className="font-patrick text-xl text-[#2d2d2d] leading-relaxed">
                    "{event.description}"
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
