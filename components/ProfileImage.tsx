"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileImageProps = {
  name: string;
  path?: string | null;
  className?: string;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "A";
}

export default function ProfileImage({
  name,
  path,
  className = "",
}: ProfileImageProps) {
  const supabase = useMemo(() => createClient(), []);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let active = true;

    async function loadImage() {
      setImageUrl("");
      if (!path) return;

      try {
        if (path.startsWith("http://") || path.startsWith("https://")) {
          if (active) setImageUrl(path);
          return;
        }

        if (path.startsWith("avatars/") || path.startsWith("employer-logos/")) {
          const url = supabase.storage
            .from("abi-job-public-images")
            .getPublicUrl(path).data.publicUrl;
          if (active) setImageUrl(url);
          return;
        }

        const { data, error } = await supabase.storage
          .from("abi-job-profile-files")
          .createSignedUrl(path, 60 * 60);

        if (error) throw error;
        if (active) setImageUrl(data.signedUrl);
      } catch (error) {
        console.error("Profile image could not be loaded:", error);
        if (active) setImageUrl("");
      }
    }

    void loadImage();
    return () => {
      active = false;
    };
  }, [path, supabase]);

  if (imageUrl) {
    return <img className={className} src={imageUrl} alt="" />;
  }

  return <span className={className} aria-hidden="true">{initials(name)}</span>;
}
