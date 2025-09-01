import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { gsap } from "gsap";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

interface TiltedCardProps {
  imageSrc?: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  children?: React.ReactNode;
}

export default function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  children,
}: TiltedCardProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  });

  const [lastY, setLastY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // GSAP animations for enhanced effects
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const image = element.querySelector('img') as HTMLImageElement;
    const overlay = element.querySelector('.overlay') as HTMLElement;

    if (isHovered) {
      // Enhanced hover animations
      if (image) {
        gsap.to(image, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      if (overlay) {
        gsap.to(overlay, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      // Add subtle glow effect
      gsap.to(element, {
        boxShadow: "0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)",
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      // Reset animations
      if (image) {
        gsap.to(image, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }

      gsap.to(element, {
        boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [isHovered]);

  function handleMouse(e: React.MouseEvent) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    setIsHovered(true);
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  // If children are provided, render them instead of the image
  if (children) {
    return (
      <figure
        ref={ref}
        className="relative w-full h-full [perspective:800px] flex flex-col items-center justify-center group"
        style={{
          height: containerHeight,
          width: containerWidth,
        }}
        onMouseMove={handleMouse}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showMobileWarning && (
          <div className="absolute top-4 text-center text-sm block sm:hidden z-20">
            <div className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">
              This effect is not optimized for mobile. Check on desktop.
            </div>
          </div>
        )}

        <motion.div
          className="relative [transform-style:preserve-3d] w-full h-full"
          style={{
            width: imageWidth,
            height: imageHeight,
            rotateX,
            rotateY,
            scale,
          }}
        >
          {children}
        </motion.div>

        {showTooltip && (
          <motion.figcaption
            className="pointer-events-none absolute left-0 top-0 rounded-[4px] bg-white/90 backdrop-blur-sm px-[10px] py-[4px] text-[10px] text-[#2d2d2d] opacity-0 z-[3] hidden sm:block shadow-lg"
            style={{
              x,
              y,
              opacity,
              rotate: rotateFigcaption,
            }}
          >
            {captionText}
          </motion.figcaption>
        )}

        {/* Enhanced hover indicator */}
        <div className="absolute inset-0 rounded-[15px] bg-gradient-to-t from-black/0 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </figure>
    );
  }

  // Original image-based rendering
  return (
    <figure
      ref={ref}
      className="relative w-full h-full [perspective:800px] flex flex-col items-center justify-center group"
      style={{
        height: containerHeight,
        width: containerWidth,
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="absolute top-4 text-center text-sm block sm:hidden z-20">
          <div className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs">
            This effect is not optimized for mobile. Check on desktop.
          </div>
        </div>
      )}

      <motion.div
        className="relative [transform-style:preserve-3d] w-full h-full"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
        }}
      >
        <motion.img
          src={imageSrc}
          alt={altText}
          className="absolute top-0 left-0 object-cover rounded-[15px] will-change-transform [transform:translateZ(0)] w-full h-full transition-all duration-300"
          style={{
            width: imageWidth,
            height: imageHeight,
          }}
        />

        {displayOverlayContent && overlayContent && (
          <motion.div
            className="overlay absolute top-0 left-0 z-[2] will-change-transform [transform:translateZ(30px)] w-full h-full opacity-0"
            style={{
              width: imageWidth,
              height: imageHeight,
            }}
          >
            {overlayContent}
          </motion.div>
        )}

        {/* Enhanced border glow effect */}
        <div className="absolute inset-0 rounded-[15px] border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none" />
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="pointer-events-none absolute left-0 top-0 rounded-[4px] bg-white/90 backdrop-blur-sm px-[10px] py-[4px] text-[10px] text-[#2d2d2d] opacity-0 z-[3] hidden sm:block shadow-lg"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}

      {/* Enhanced hover indicator */}
      <div className="absolute inset-0 rounded-[15px] bg-gradient-to-t from-black/0 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </figure>
  );
}
