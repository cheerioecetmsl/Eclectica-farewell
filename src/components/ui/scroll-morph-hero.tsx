"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useTransform, useSpring, useScroll } from "framer-motion";
import { CheerioImage } from "@/lib/imageVariants";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
    src: string;
    baseId?: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard Component ---
const IMG_WIDTH = 70;  
const IMG_HEIGHT = 100; 

function FlipCard({
    src,
    baseId,
    index,
    total,
    phase,
    target,
}: FlipCardProps) {
    return (
        <motion.div
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
            }}
            transition={{
                type: "spring",
                stiffness: 45,
                damping: 20,
            }}
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-lg shadow-lg bg-white border border-gold/10"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <CheerioImage
                        src={src || "/gallery/pic-1.jpeg"}
                        baseId={baseId}
                        variant="preview"
                        alt={`hero-${index}`}
                        className="w-full h-full object-cover md:grayscale brightness-90 group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-ink/10 transition-colors group-hover:bg-transparent" />
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-lg shadow-lg bg-ink flex flex-col items-center justify-center p-4 border border-gold/20"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="text-center">
                        <p className="text-[8px] font-bold text-gold-primary uppercase tracking-[0.3em] mb-1">Vault</p>
                        <p className="text-[9px] font-medium text-black serif">2026</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Main Hero Component ---
const TOTAL_IMAGES = 20;

// Stable scatter positions generated once outside the component
const STABLE_SCATTER = Array.from({ length: TOTAL_IMAGES }, (_, i) => {
    // Deterministic "randomness" based on index
    const seedX = Math.sin(i * 123.456);
    const seedY = Math.cos(i * 789.012);
    const seedRot = Math.sin(i * 345.678);
    
    return {
        x: seedX * 1000,
        y: seedY * 600,
        rotation: seedRot * 90,
        scale: 0.6,
        opacity: 0,
    };
});

const DEFAULT_IMAGES = Array.from({ length: TOTAL_IMAGES }, (_, i) => `/gallery/pic-${((i % 12) + 1)}.jpeg`);

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export default function IntroAnimation() {
    const [images, setImages] = useState<{url: string; baseId?: string}[]>(
        DEFAULT_IMAGES.map(url => ({ url }))
    );
    const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHeroImages = async () => {
            try {
                const docRef = doc(db, "hero_images", "featured");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const fetchedUrls = data.urls || [];
                    const fetchedBaseIds = data.baseIds || [];
                    
                    const mergedImages: {url: string; baseId?: string}[] = DEFAULT_IMAGES.map(url => ({ url }));
                    fetchedUrls.forEach((url: string, i: number) => {
                        if (url && i < TOTAL_IMAGES) {
                            mergedImages[i] = { 
                                url, 
                                baseId: fetchedBaseIds[i] 
                            };
                        }
                    });
                    setImages(mergedImages);
                }
            } catch (err) {
                console.error("Failed to sync hero ledger:", err);
            }
        };
        fetchHeroImages();
    }, []);

    // Use Natural Scroll
    const { scrollYProgress } = useScroll();

    useEffect(() => {
        if (!containerRef.current) return;
        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
            }
        };
        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);
        setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
        return () => observer.disconnect();
    }, []);

    // Phase Transitions based on scroll progress (0 to 1)
    const morphProgress = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 50, damping: 25 });
    
    const scrollRotate = useTransform(scrollYProgress, [0.3, 1], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 50, damping: 25 });

    const isMobile = containerSize.width < 768;

    // Logo Morph Transitions
    // It starts in center and moves to top-left navbar position
    const logoScale = useTransform(scrollYProgress, [0, 0.2], [1.2, 0.18]);
    const logoY = useTransform(scrollYProgress, [0, 0.2], [0, -containerSize.height / 2 + 40]);
    const logoX = useTransform(scrollYProgress, [0, 0.2], [0, -containerSize.width / 2 + (isMobile ? 40 : 65)]);
    const logoOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 1]); // Always visible once it starts gliding
    
    // Center Writing Reveal (fills the void as cards move)
    const centerWritingOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);
    const centerWritingScale = useTransform(scrollYProgress, [0.2, 0.4], [0.8, 1]);

    // Support text opacity
    const supportTextOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

    const [morphValue, setMorphValue] = useState(0);
    const [rotateValue, setRotateValue] = useState(0);

    useEffect(() => {
        const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
        const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
        return () => { unsubscribeMorph(); unsubscribeRotate(); };
    }, [smoothMorph, smoothScrollRotate]);

    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase("line"), 500);
        const timer2 = setTimeout(() => setIntroPhase("circle"), 1500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    const scatterPositions = useMemo(() => {
        return STABLE_SCATTER;
    }, []);

    const contentOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-transparent overflow-hidden">
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000">

                {/* Cinematic Logo Transition */}
                <div className="absolute z-[100] flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2">
                    <motion.div
                        style={{ 
                            scale: logoScale,
                            x: logoX,
                            y: logoY,
                            opacity: logoOpacity
                        }}
                        className="flex flex-col items-center transition-all duration-300"
                    >
                        <span className="font-kalam font-bold text-3xl md:text-7xl tracking-widest text-[#2d2d2d] uppercase">
                            ECLECTICA
                        </span>
                        <motion.p 
                            style={{ opacity: supportTextOpacity }}
                            className="text-[10px] md:text-sm font-bold tracking-[1em] text-brown-secondary/40 uppercase mt-2"
                        >
                          The Final Archive
                        </motion.p>
                    </motion.div>
                </div>

                {/* Center Writing Reveal (Fills the void) */}
                <motion.div
                    style={{ 
                        opacity: centerWritingOpacity,
                        scale: centerWritingScale
                    }}
                    className="absolute z-10 flex flex-col items-center justify-center pointer-events-none"
                >
                    <h2 className="font-kalam font-bold text-4xl md:text-8xl text-brown-primary tracking-wide text-center uppercase">
                        FAREWELL 2026
                    </h2>
                </motion.div>

                {/* Bottom Active Content (Appears as you scroll down) */}
                <motion.div
                    style={{ opacity: contentOpacity }}
                    className="absolute bottom-[15%] z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4"
                >
                    <h1 className="text-3xl md:text-7xl font-bold serif text-brown-primary tracking-tighter mb-4">
                        The Vault is Open
                    </h1>
                    <p className="text-xs md:text-lg text-brown-secondary max-w-lg serif italic leading-relaxed">
                        Scroll deeper to shuffle the memories of the Batch of 2026.
                    </p>
                </motion.div>

                {/* Main 3D Container */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {images.map((imgData, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

                        if (introPhase === "scatter") {
                            target = scatterPositions[i];
                        } else if (introPhase === "line") {
                            const lineSpacing = isMobile ? 60 : 90;
                            const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
                            const lineX = i * lineSpacing - lineTotalWidth / 2;
                            target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
                        } else {
                            // CIRCLE & MORPH LOGIC
                            const minDimension = Math.min(containerSize.width, containerSize.height);
                            const circleRadius = isMobile 
                                ? Math.min(minDimension * 0.38, 140) 
                                : Math.min(minDimension * 0.35, 350);
                            
                            const circleAngle = (i / TOTAL_IMAGES) * 360;
                            const circleRad = (circleAngle * Math.PI) / 180;
                            const circlePos = {
                                x: Math.cos(circleRad) * circleRadius,
                                y: Math.sin(circleRad) * circleRadius,
                                rotation: circleAngle + 90,
                            };

                            const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
                            const arcRadius = baseRadius * (isMobile ? 1.6 : 1.1);
                            const arcApexY = containerSize.height * (isMobile ? 0.45 : 0.25);
                            const arcCenterY = arcApexY + arcRadius;
                            const spreadAngle = isMobile ? 80 : 130;
                            const startAngle = -90 - (spreadAngle / 2);
                            const step = spreadAngle / (TOTAL_IMAGES - 1);
                            const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
                            const maxRotation = spreadAngle * 1.2;
                            const boundedRotation = -scrollProgress * maxRotation;
                            const currentArcAngle = startAngle + (i * step) + boundedRotation;
                            const arcRad = (currentArcAngle * Math.PI) / 180;

                            const arcPos = {
                                x: Math.cos(arcRad) * arcRadius,
                                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                                rotation: currentArcAngle + 90,
                                scale: isMobile ? 1.1 : 1.8,
                            };

                            target = {
                                x: lerp(circlePos.x, arcPos.x, morphValue),
                                y: lerp(circlePos.y, arcPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                                scale: lerp(isMobile ? 0.8 : 1, arcPos.scale, morphValue),
                                opacity: 1,
                            };
                        }

                        return (
                            <FlipCard
                                key={i}
                                src={imgData.url}
                                baseId={imgData.baseId}
                                index={i}
                                total={TOTAL_IMAGES}
                                phase={introPhase}
                                target={target}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
