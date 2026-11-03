import Image from "next/image";
import Link from "next/link";
import "./Logo.css";

type LogoProps = {
  href?: string | null;
  size?: "small" | "medium" | "large";
  showTagline?: boolean;
  light?: boolean;
  className?: string;
};

export default function Logo({
  href = "/",
  size = "medium",
  showTagline = false,
  light = false,
  className = "",
}: LogoProps) {
  const content = (
    <div
      className={[
        "abi-logo",
        `abi-logo--${size}`,
        light ? "abi-logo--light" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src={
          light
            ? "/images/abijob-logo-white.png"
            : "/images/abijob-logo-green.png"
        }
        alt="Abi Job — Opportunity Starts Here"
        width={180}
        height={65}
        priority
        className="abi-logo__image"
      />

      {showTagline && (
        <span className="abi-logo__tagline">
          OPPORTUNITY STARTS HERE
        </span>
      )}
    </div>
  );

  if (href === null) {
    return content;
  }

  return (
    <Link href={href} aria-label="Abi Job homepage">
      {content}
    </Link>
  );
}