import Image from "next/image";

interface BrandLogoProps {
    className?: string;
    priority?: boolean;
}

export function BrandLogo({ className = "h-12 w-auto", priority = false }: BrandLogoProps) {
    return (
        <Image
            src="/brand/notemate-logo.png"
            alt="Notemate"
            width={1650}
            height={564}
            priority={priority}
            className={className}
        />
    );
}
