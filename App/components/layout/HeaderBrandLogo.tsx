"use client";

import Image from "next/image";

export function EcoviraHeaderLogo() {
  return (
    <a href="/" aria-label="Ecovira Air Home" className="ml-auto flex items-center pr-6">
      <Image
        src="/brand/ecovira-logo-transparent.png"
        alt="Ecovira"
        width={240}
        height={96}
        priority
        className="h-12 w-auto opacity-90 hover:opacity-100 transition-opacity"
      />
    </a>
  );
}
