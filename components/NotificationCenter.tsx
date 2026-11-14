"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Volume2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./NotificationCenter.css";

type IncomingNotification = {
  id: string;
  title: string;
  description: string;
  href: string | null;
  category: string;
};

const STORAGE_PREFIX = "abijob:notification-sound:";
const supabase = createClient();

export default function NotificationCenter() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [incoming, setIncoming] = useState<IncomingNotification | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playChime = useCallback(async () => {
    if (!soundEnabled) return;

    try {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextConstructor) return;

      const context =
        audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;
      if (context.state === "suspended") await context.resume();

      const now = context.currentTime;
      [659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
        gain.gain.setValueAtTime(0.0001, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(
          0.12,
          now + index * 0.12 + 0.025
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + index * 0.12 + 0.28
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + index * 0.12);
        oscillator.stop(now + index * 0.12 + 0.3);
      });
    } catch (error) {
      console.info("Notification sound could not play:", error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
    };

    void loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setUserId(session?.user?.id ?? null);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) {
      setSoundEnabled(false);
      setIncoming(null);
      return;
    }

    try {
      setSoundEnabled(
        window.localStorage.getItem(STORAGE_PREFIX + userId) === "on"
      );
    } catch {
      setSoundEnabled(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`global-notification-center-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Partial<IncomingNotification>;
          if (!row.id || !row.title) return;

          const notification: IncomingNotification = {
            id: row.id,
            title: row.title,
            description: row.description ?? "You have a new update.",
            href:
              typeof row.href === "string" &&
              row.href.startsWith("/") &&
              !row.href.startsWith("//")
                ? row.href
                : null,
            category: row.category ?? "system",
          };

          setIncoming(notification);
          void playChime();

          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => {
            setIncoming((current) =>
              current?.id === notification.id ? null : current
            );
          }, 7000);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Abi Job notification stream is temporarily unavailable.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [playChime, supabase, userId]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (audioContextRef.current) void audioContextRef.current.close();
    },
    []
  );

  const toggleSound = async () => {
    if (!userId) return;
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_PREFIX + userId, next ? "on" : "off");
    } catch {
      // The control remains usable for this session if storage is unavailable.
    }

    if (next) {
      try {
        const AudioContextConstructor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextConstructor) return;
        const context =
          audioContextRef.current ?? new AudioContextConstructor();
        audioContextRef.current = context;
        if (context.state === "suspended") await context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 783.99;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.1, context.currentTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.25);
      } catch (error) {
        console.info("Could not enable notification sound:", error);
      }
    }
  };

  if (!userId) return null;

  return (
    <div className="abi-notification-center" aria-live="polite">
      <button
        type="button"
        className={`abi-sound-toggle ${soundEnabled ? "is-enabled" : ""}`}
        onClick={() => void toggleSound()}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "Turn notification sounds off" : "Turn notification sounds on"}
        title={soundEnabled ? "Notification sound is on" : "Notification sound is off"}
      >
        {soundEnabled ? <Volume2 size={17} /> : <BellOff size={17} />}
        <span>{soundEnabled ? "Sound on" : "Sound off"}</span>
      </button>

      {incoming && (
        <div className="abi-notification-toast" role="status">
          <div className="abi-notification-toast-icon"><Bell size={19} /></div>
          <button
            type="button"
            className="abi-notification-toast-content"
            onClick={() => {
              const href = incoming.href;
              setIncoming(null);
              if (href) router.push(href);
              else router.push("/notifications");
            }}
          >
            <strong>{incoming.title}</strong>
            <span>{incoming.description}</span>
            <small>New notification · View update</small>
          </button>
          <button
            type="button"
            className="abi-notification-toast-close"
            aria-label="Dismiss notification"
            onClick={() => setIncoming(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

