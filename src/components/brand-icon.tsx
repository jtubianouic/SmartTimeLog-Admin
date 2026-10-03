import Image from "next/image";

type BrandIconProps = {
  className?: string;
  priority?: boolean;
};

export function BrandIcon({ className, priority = false }: BrandIconProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={40}
      priority={priority}
      src="/smarttimelog.png"
      width={40}
    />
  );
}
