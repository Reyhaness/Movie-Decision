"use client";

import Image from "next/image";
import { useState } from "react";

export function MoviePoster({
  title,
  posterPath,
  className,
}: {
  title: string;
  posterPath?: string | null;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!posterPath || imageError) {
    return <PosterFallback title={title} className={className} />;
  }

  const imageUrl = `https://image.tmdb.org/t/p/w500${
    posterPath.startsWith("/") ? posterPath : `/${posterPath}`
  }`;

  return (
    <div
      className={`relative w-36 xs:w-40 sm:w-44 max-w-full aspect-[2/3] rounded-xl overflow-hidden border-3 border-line bg-surface-raised shadow-md shrink-0 ${
        className ?? ""
      }`}
    >
      {!imageLoaded && (
        <div className="absolute inset-0 bg-surface-raised animate-pulse flex items-center justify-center">
          <span className="text-xs text-muted">...</span>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={`Poster for ${title}`}
        fill
        priority
        sizes="(max-width: 640px) 160px, 176px"
        className={`object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  );
}

export function PosterFallback({ title, className }: { title: string; className?: string }) {
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden="true"
      className={`w-36 xs:w-40 sm:w-44 max-w-full aspect-[2/3] rounded-xl border-3 border-line bg-surface-raised flex items-center justify-center shrink-0 ${
        className ?? ""
      }`}
    >
      <span className="text-3xl sm:text-4xl font-extrabold text-muted">{initials}</span>
    </div>
  );
}
