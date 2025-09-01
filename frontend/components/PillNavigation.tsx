'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

interface PillNavItem {
  label: string
  href: string
  ariaLabel?: string
}

interface PillNavigationProps {
  logo?: string
  logoAlt?: string
  items: PillNavItem[]
  activeHref?: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  onMobileMenuClick?: () => void
  initialLoadAnimation?: boolean
}

export default function PillNavigation({
  logo,
  logoAlt = "Logo",
  items,
  activeHref,
  className = "",
  ease = "power3.easeOut",
  baseColor = "#fff",
  pillColor = "#060010",
  hoveredPillTextColor = "#060010",
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
}: PillNavigationProps) {
  const resolvedPillTextColor = pillTextColor ?? baseColor
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const circleRefs = useRef<HTMLSpanElement[]>([])
  const tlRefs = useRef<gsap.core.Timeline[]>([])
  const activeTweenRefs = useRef<gsap.core.Tween[]>([])
  const logoImgRef = useRef<HTMLImageElement>(null)
  const logoTweenRef = useRef<gsap.core.Tween | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navItemsRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return

        const pill = circle.parentElement
        const rect = pill.getBoundingClientRect()
        const { width: w, height: h } = rect
        const R = ((w * w) / 4 + h * h) / (2 * h)
        const D = Math.ceil(2 * R) + 2
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1
        const originY = D - delta

        circle.style.width = `${D}px`
        circle.style.height = `${D}px`
        circle.style.bottom = `-${delta}px`

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        })

        const label = pill.querySelector(".pill-label")
        const white = pill.querySelector(".pill-label-hover")

        if (label) gsap.set(label, { y: 0 })
        if (white) gsap.set(white, { y: h + 12, opacity: 0 })

        const index = circleRefs.current.indexOf(circle)
        if (index === -1) return

        tlRefs.current[index]?.kill()
        const tl = gsap.timeline({ paused: true })

        tl.to(
          circle,
          { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" },
          0
        )

        if (label) {
          tl.to(
            label,
            { y: -(h + 8), duration: 2, ease, overwrite: "auto" },
            0
          )
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 })
          tl.to(
            white,
            { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" },
            0
          )
        }

        tlRefs.current[index] = tl
      })
    }

    layout()

    const onResize = () => layout()
    window.addEventListener("resize", onResize)

    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(layout).catch(() => { })
    }

    const menu = mobileMenuRef.current
    if (menu) {
      gsap.set(menu, { visibility: "hidden", opacity: 0, scaleY: 1, y: 0 })
    }

    if (initialLoadAnimation) {
      const logo = logoRef.current
      const navItems = navItemsRef.current

      if (logo) {
        gsap.set(logo, { scale: 0 })
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease,
        })
      }

      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: "hidden" })
        gsap.to(navItems, {
          width: "auto",
          duration: 0.6,
          ease,
        })
      }
    }

    return () => window.removeEventListener("resize", onResize)
  }, [items, ease, initialLoadAnimation])

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: "auto",
    })
  }

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i]
    if (!tl) return
    activeTweenRefs.current[i]?.kill()
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: "auto",
    })
  }

  const handleLogoEnter = () => {
    const img = logoImgRef.current
    if (!img) return
    logoTweenRef.current?.kill()
    gsap.set(img, { rotate: 0 })
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: "auto",
    })
  }

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)

    const hamburger = hamburgerRef.current
    const menu = mobileMenuRef.current

    if (hamburger) {
      const lines = hamburger.querySelectorAll(".hamburger-line")
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease })
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease })
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease })
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease })
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: "visible" })
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: "top center",
          }
        )
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: "top center",
          onComplete: () => {
            gsap.set(menu, { visibility: "hidden" })
          },
        })
      }
    }

    onMobileMenuClick?.()
  }

  const isExternalLink = (href: string) =>
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")

  const isRouterLink = (href: string) => href && !isExternalLink(href)

  const cssVars = {
    ["--base"]: baseColor,
    ["--pill-bg"]: pillColor,
    ["--hover-text"]: hoveredPillTextColor,
    ["--pill-text"]: resolvedPillTextColor,
    ["--nav-h"]: "42px",
    ["--logo"]: "36px",
    ["--pill-pad-x"]: "18px",
    ["--pill-gap"]: "3px",
  }

  return (
    <div className="flex justify-center w-full">
      <nav
        className={`w-max flex items-center justify-center box-border ${className}`}
        aria-label="Primary"
        style={cssVars as React.CSSProperties}
      >
        <div
          ref={navItemsRef}
          className="relative items-center rounded-full flex"
          style={{
            height: "var(--nav-h)",
            background: "var(--base, #000)",
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-[3px] h-full"
            style={{ gap: "var(--pill-gap)" }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href

              const pillStyle = {
                background: "var(--pill-bg, #fff)",
                color: "var(--pill-text, var(--base, #000))",
                paddingLeft: "var(--pill-pad-x)",
                paddingRight: "var(--pill-pad-x)",
              }

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: "var(--base, #000)",
                      willChange: "transform",
                    }}
                    aria-hidden="true"
                    ref={(el) => {
                      if (el) circleRefs.current[i] = el
                    }}
                  />
                  <span className="label-stack relative inline-block leading-[1] z-[2]">
                    <span
                      className="pill-label relative z-[2] inline-block leading-[1]"
                      style={{ willChange: "transform" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-0 z-[3] inline-block"
                      style={{
                        color: "var(--hover-text, #fff)",
                        willChange: "transform, opacity",
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 rounded-full z-[4]"
                      style={{ background: "var(--base, #000)" }}
                      aria-hidden="true"
                    />
                  )}
                </>
              )

              const basePillClasses =
                "relative overflow-hidden inline-flex items-center justify-center h-full no-underline rounded-full box-border font-semibold text-[16px] leading-[0] uppercase tracking-[0.2px] whitespace-nowrap cursor-pointer px-0"

              return (
                <li key={item.href} role="none" className="flex h-full">
                  <a
                    role="menuitem"
                    href={item.href}
                    className={basePillClasses}
                    style={pillStyle}
                    aria-label={item.ariaLabel || item.label}
                    onMouseEnter={() => handleEnter(i)}
                    onMouseLeave={() => handleLeave(i)}
                  >
                    {PillContent}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </div>
  )
}
