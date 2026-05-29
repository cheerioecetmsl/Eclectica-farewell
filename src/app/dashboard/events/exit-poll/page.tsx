"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, setDoc, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, BarChart, Check, X, Award } from "lucide-react";
import Link from "next/link";

interface PollOption {
  id: string;
  text: string;
  mediaUrl: string;
  mediaType: "image" | "video" | null;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  type: "single" | "multiple";
  status: "open" | "closed" | "results_declared";
  options: PollOption[];
  mediaUrl?: string;
  mediaType?: "image" | "video" | null;
  createdAt: any;
}

interface PollResponse {
  pollId: string;
  userId: string;
  selectedOptionIds: string[];
}

export default function ExitPollsStorehouse() {
  const [user, setUser] = useState<any>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [myResponses, setMyResponses] = useState<Record<string, string[]>>({});
  const [allResponses, setAllResponses] = useState<PollResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await fetchData(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (uid: string) => {
    try {
      // 1. Fetch Polls
      const pollsSnap = await getDocs(query(collection(db, "polls"), orderBy("createdAt", "desc")));
      const pollsList = pollsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Poll));
      setPolls(pollsList);

      // 2. Fetch My Responses
      const myResSnap = await getDocs(query(collection(db, "poll_responses"), where("userId", "==", uid)));
      const myResMap: Record<string, string[]> = {};
      myResSnap.docs.forEach(d => {
        const data = d.data() as PollResponse;
        myResMap[data.pollId] = data.selectedOptionIds;
      });
      setMyResponses(myResMap);

      // 3. Fetch All Responses (for results)
      const allResSnap = await getDocs(collection(db, "poll_responses"));
      const allResList = allResSnap.docs.map(d => d.data() as PollResponse);
      setAllResponses(allResList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPoll = (poll: Poll) => {
    if (poll.status === "closed" || poll.status === "results_declared" || myResponses[poll.id]) return;
    setActivePoll(poll);
    setSelectedOptions([]);
  };

  const toggleOption = (optId: string) => {
    if (activePoll?.type === "single") {
      setSelectedOptions([optId]);
    } else {
      if (selectedOptions.includes(optId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optId));
      } else {
        setSelectedOptions([...selectedOptions, optId]);
      }
    }
  };

  const submitVote = async () => {
    if (!user || !activePoll || selectedOptions.length === 0) return;
    setIsSubmitting(true);
    try {
      const responseRef = doc(db, "poll_responses", `${activePoll.id}_${user.uid}`);
      const responseData: PollResponse = {
        pollId: activePoll.id,
        userId: user.uid,
        selectedOptionIds: selectedOptions
      };
      await setDoc(responseRef, responseData);
      
      // Update local state
      setMyResponses(prev => ({ ...prev, [activePoll.id]: selectedOptions }));
      setAllResponses(prev => [...prev, responseData]);
      setActivePoll(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit vote. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResultsForPoll = (pollId: string) => {
    const responses = allResponses.filter(r => r.pollId === pollId);
    const totalVotes = responses.length;
    const counts: Record<string, number> = {};
    responses.forEach(r => {
      r.selectedOptionIds.forEach(optId => {
        counts[optId] = (counts[optId] || 0) + 1;
      });
    });
    return { totalVotes, counts };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <Loader2 className="w-16 h-16 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-16 px-6 relative bg-[#fdfbf7]">
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Link href="/dashboard/events" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-full text-[#2d2d2d] text-sm font-bold font-patrick uppercase hover:-translate-y-1 transition-transform mb-6">
            <ArrowLeft size={16} strokeWidth={2.5} /> Back to Events
          </Link>
          <div className="hand-card bg-white p-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden inline-block w-full rotate-1">
            <div className="tack-decoration" />
            <h1 className="text-5xl md:text-6xl font-bold text-[#2d2d2d] font-kalam uppercase leading-tight -rotate-2">
              Eclectica Exit Polls
            </h1>
            <p className="text-[#2d2d2d]/80 font-patrick text-2xl mt-4 rotate-1">
              Why should Indian media have all the fun? Voice your opinions.
            </p>
          </div>
        </div>

        {/* Polls Storehouse */}
        <div className="space-y-8">
          {polls.map((poll, idx) => {
            const hasVoted = !!myResponses[poll.id];
            const isClosed = poll.status === "closed";
            const showResults = poll.status === "results_declared";
            const canVote = !hasVoted && poll.status === "open";
            
            const results = showResults ? getResultsForPoll(poll.id) : null;
            
            return (
              <div 
                key={poll.id}
                onClick={() => handleOpenPoll(poll)}
                className={`hand-card bg-white p-8 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative transition-transform duration-300 ${
                  canVote ? "cursor-pointer hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#ffca28]" : "opacity-90"
                } ${idx % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
              >
                {/* Status Badges */}
                <div className="absolute -top-4 -right-4 flex gap-2 z-10 rotate-3">
                  {hasVoted && (
                    <span className="bg-[#8de08a] px-4 py-1 rounded-full border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] text-sm font-bold font-patrick uppercase tracking-widest text-[#2d2d2d] flex items-center gap-1">
                      <CheckCircle2 size={14} /> Voted
                    </span>
                  )}
                  {showResults && (
                    <span className="bg-[#ff8c00] px-4 py-1 rounded-full border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] text-sm font-bold font-patrick uppercase tracking-widest text-white flex items-center gap-1">
                      <BarChart size={14} /> Results Out
                    </span>
                  )}
                  {isClosed && !showResults && (
                    <span className="bg-zinc-200 px-4 py-1 rounded-full border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] text-sm font-bold font-patrick uppercase tracking-widest text-[#2d2d2d] flex items-center gap-1">
                      <AlertCircle size={14} /> Polling Closed
                    </span>
                  )}
                  {canVote && (
                    <span className="bg-[#ffca28] px-4 py-1 rounded-full border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] text-sm font-bold font-patrick uppercase tracking-widest text-[#2d2d2d] animate-pulse">
                      Vote Now!
                    </span>
                  )}
                </div>

                <h3 className="text-3xl font-bold font-kalam text-[#2d2d2d] pr-20">{poll.title}</h3>
                {poll.description && (
                  <p className="font-patrick text-xl text-[#2d2d2d]/80 mt-2">{poll.description}</p>
                )}
                {poll.mediaUrl && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="w-full max-h-64 md:max-h-80 border-[2px] border-[#2d2d2d] rounded-xl overflow-hidden bg-black/5 mt-4 relative z-0"
                  >
                    {poll.mediaType === "image" ? (
                      <img src={poll.mediaUrl} alt={poll.title} className="w-full h-full object-contain max-h-64 md:max-h-80 bg-zinc-50 mx-auto" />
                    ) : (
                      <video src={poll.mediaUrl} controls className="w-full h-full object-contain max-h-64 md:max-h-80 bg-black mx-auto" />
                    )}
                  </div>
                )}

                {/* Show User's Choice if voted but results aren't out yet */}
                {hasVoted && !showResults && (
                  <div className="mt-6 p-4 bg-[#fdfbf7] border-[2px] border-dashed border-[#2d2d2d]/30 rounded-xl">
                    <p className="font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest text-sm mb-2">Your Selection:</p>
                    <ul className="space-y-1">
                      {poll.options.filter(o => myResponses[poll.id].includes(o.id)).map(opt => (
                        <li key={opt.id} className="font-kalam text-xl text-[#2d2d2d] flex items-center gap-2">
                          <Check size={18} className="text-[#8de08a]" /> {opt.text || "Media Option"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Show Results Breakdown */}
                {showResults && results && (
                  <div className="mt-8 space-y-4">
                    <p className="font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest text-sm text-right">
                      Total Votes: {results.totalVotes}
                    </p>
                    {poll.options.map(opt => {
                      const votes = results.counts[opt.id] || 0;
                      const percentage = results.totalVotes === 0 ? 0 : Math.round((votes / results.totalVotes) * 100);
                      const isMyChoice = myResponses[poll.id]?.includes(opt.id);
                      
                      return (
                        <div key={opt.id} className="relative">
                          <div className="flex justify-between items-end mb-1 px-1">
                            <span className="font-kalam text-xl text-[#2d2d2d] flex items-center gap-2">
                              {isMyChoice && <Check size={16} className="text-[#8de08a] stroke-[3px]" />}
                              {opt.text || "Media Option"}
                            </span>
                            <span className="font-bold font-patrick text-[#2d2d2d]">{percentage}% ({votes})</span>
                          </div>
                          <div className="w-full h-4 bg-zinc-100 border-[2px] border-[#2d2d2d] rounded-full overflow-hidden shadow-[inset_1px_1px_0_0_#2d2d2d]">
                            <div 
                              className={`h-full border-r-[2px] border-[#2d2d2d] transition-all duration-1000 ${isMyChoice ? 'bg-[#ffca28]' : 'bg-[#2d5da1]'}`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          
          {polls.length === 0 && (
             <div className="text-center py-12">
               <Award size={48} className="text-[#2d2d2d]/20 mx-auto mb-4" />
               <p className="font-kalam text-2xl text-[#2d2d2d]/50">No polls have been issued yet. Check back soon!</p>
             </div>
          )}
        </div>
      </div>

      {/* Voting Modal */}
      {activePoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d2d2d]/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto hand-card bg-[#fdfbf7] p-8 md:p-10 border-[4px] border-[#2d2d2d] shadow-[12px_12px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative rotate-1">
            <button 
              onClick={() => setActivePoll(null)}
              className="absolute top-4 right-4 p-2 bg-white border-[2px] border-[#2d2d2d] rounded-full hover:bg-red-100 transition-colors shadow-[2px_2px_0_0_#2d2d2d]"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-[#ffca28] border-[2px] border-[#2d2d2d] rounded-full text-xs font-bold font-patrick uppercase tracking-widest text-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] mb-4 -rotate-2">
                {activePoll.type === "single" ? "Single Choice" : "Multiple Choice"}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-kalam text-[#2d2d2d] leading-tight">
                {activePoll.title}
              </h2>
              {activePoll.mediaUrl && (
                <div className="w-full max-h-64 md:max-h-80 border-[2px] border-[#2d2d2d] rounded-xl overflow-hidden bg-black/5 mt-4 relative z-0">
                  {activePoll.mediaType === "image" ? (
                    <img src={activePoll.mediaUrl} alt={activePoll.title} className="w-full h-full object-contain max-h-64 md:max-h-80 bg-zinc-50 mx-auto" />
                  ) : (
                    <video src={activePoll.mediaUrl} controls className="w-full h-full object-contain max-h-64 md:max-h-80 bg-black mx-auto" />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {activePoll.options.map(opt => {
                const isSelected = selectedOptions.includes(opt.id);
                return (
                  <div 
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`p-4 border-[3px] border-[#2d2d2d] rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                      isSelected 
                        ? 'bg-[#e8f4f8] shadow-[4px_4px_0_0_#2d5da1] translate-x-1 -translate-y-1 border-[#2d5da1]' 
                        : 'bg-white shadow-[2px_2px_0_0_#2d2d2d] hover:bg-zinc-50'
                    }`}
                  >
                    <div className={`shrink-0 w-6 h-6 border-[2px] border-[#2d2d2d] flex items-center justify-center ${activePoll.type === 'single' ? 'rounded-full' : 'rounded-md'} ${isSelected ? 'bg-[#2d5da1]' : 'bg-white'}`}>
                      {isSelected && <Check size={14} strokeWidth={4} className="text-white" />}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      {opt.text && (
                        <span className="font-kalam text-2xl text-[#2d2d2d] block">{opt.text}</span>
                      )}
                      
                      {opt.mediaUrl && (
                        <div className="w-full h-48 border-[2px] border-[#2d2d2d] rounded-lg overflow-hidden bg-black/5">
                          {opt.mediaType === "image" ? (
                            <img src={opt.mediaUrl} alt={opt.text} className="w-full h-full object-cover" />
                          ) : (
                            <video 
                              src={opt.mediaUrl} 
                              controls 
                              className="w-full h-full object-contain bg-black" 
                              onClick={(e) => e.stopPropagation()} 
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={submitVote}
              disabled={isSubmitting || selectedOptions.length === 0}
              className="mt-8 w-full py-4 bg-[#8de08a] hover:bg-[#7ad577] disabled:opacity-50 disabled:hover:bg-[#8de08a] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] text-[#2d2d2d] font-bold font-kalam text-3xl uppercase tracking-wider rounded-[var(--radius-wobbly)] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Award size={28} />}
              {isSubmitting ? "Locking Vote..." : "Cast Vote"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
