const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const headerHeight = () =>
  document.querySelector(".site-header")?.getBoundingClientRect().height || 0;

let lenisScroller = null;
let closeMobileMenu = () => {};

const parseDatasetArray = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const splitIntoCharacters = (text) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }

  return Array.from(text);
};

const getStaggerDelay = (index, total, staggerFrom, staggerDuration) => {
  if (staggerFrom === "first") return index * staggerDuration;
  if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
  if (staggerFrom === "center") {
    const center = Math.floor(total / 2);
    return Math.abs(center - index) * staggerDuration;
  }
  if (staggerFrom === "random") {
    const randomIndex = Math.floor(Math.random() * total);
    return Math.abs(randomIndex - index) * staggerDuration;
  }

  const numeric = Number(staggerFrom);
  if (!Number.isNaN(numeric)) {
    return Math.abs(numeric - index) * staggerDuration;
  }

  return index * staggerDuration;
};

const scrollToTarget = (target) => {
  const offset = headerHeight() + 14;

  if (lenisScroller && typeof lenisScroller.scrollTo === "function") {
    lenisScroller.scrollTo(target, {
      offset: -offset,
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
};

const initMenuToggle = () => {
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileLinks = [...document.querySelectorAll(".mobile-menu a")];

  if (!menuButton || !mobileMenu) return;

  const setMenuState = (open) => {
    menuButton.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));

    if (open) {
      mobileMenu.hidden = false;
      requestAnimationFrame(() => mobileMenu.classList.add("is-open"));
    } else {
      mobileMenu.classList.remove("is-open");
      window.setTimeout(() => {
        if (!mobileMenu.classList.contains("is-open")) {
          mobileMenu.hidden = true;
        }
      }, 260);
    }
  };

  closeMobileMenu = () => setMenuState(false);

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMenu.classList.contains("is-open") &&
      !mobileMenu.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenuState(false);
    }
  });
};

const initDock = () => {
  const dock = document.querySelector("[data-dock]");

  if (!dock) return;

  const dockItems = [...dock.querySelectorAll(".dock-nav__item")].map((item) => ({
    element: item,
    current: 40,
    velocity: 0,
  }));

  let mouseX = Number.POSITIVE_INFINITY;
  let animationFrame = 0;

  const getTargetWidth = (distance) => {
    if (!Number.isFinite(mouseX)) return 40;
    const absDistance = Math.abs(distance);
    if (absDistance >= 150) return 40;
    return 80 - (absDistance / 150) * 40;
  };

  const animateDock = () => {
    let needsAnotherFrame = false;

    dockItems.forEach((item) => {
      const bounds = item.element.getBoundingClientRect();
      const center = bounds.left + bounds.width / 2;
      const target = getTargetWidth(mouseX - center);
      const force = (target - item.current) * 0.18;

      item.velocity = (item.velocity + force) * 0.72;
      item.current += item.velocity;

      if (Math.abs(target - item.current) < 0.02 && Math.abs(item.velocity) < 0.02) {
        item.current = target;
        item.velocity = 0;
      }

      const iconScale = 1 + ((item.current - 40) / 40) * 0.5;
      item.element.style.setProperty("--dock-size", `${item.current.toFixed(2)}px`);
      item.element.style.setProperty("--dock-icon-scale", iconScale.toFixed(3));

      if (Math.abs(target - item.current) >= 0.02 || Math.abs(item.velocity) >= 0.02) {
        needsAnotherFrame = true;
      }
    });

    if (needsAnotherFrame) {
      animationFrame = window.requestAnimationFrame(animateDock);
    } else {
      animationFrame = 0;
    }
  };

  const requestDockAnimation = () => {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(animateDock);
    }
  };

  dock.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    requestDockAnimation();
  });

  dock.addEventListener("pointerleave", () => {
    mouseX = Number.POSITIVE_INFINITY;
    requestDockAnimation();
  });

  requestDockAnimation();
};

const initHeroIntro = () => {
  const floatingItems = [...document.querySelectorAll(".hero-float__item")];
  const title = document.querySelector('[data-hero-intro="title"]');
  const copy = document.querySelector('[data-hero-intro="copy"]');
  const actions = document.querySelector('[data-hero-intro="actions"]');

  if (!window.gsap || prefersReducedMotion) {
    floatingItems.forEach((item) => {
      item.style.opacity = "1";
    });
    return;
  }

  const gsap = window.gsap;

  floatingItems.forEach((item) => {
    gsap.fromTo(
      item,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.2,
        ease: "power2.out",
        delay: Number(item.dataset.introDelay || "0"),
      }
    );
  });

  if (title) {
    gsap.fromTo(
      title,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out", delay: 0.3 }
    );
  }

  if (copy) {
    gsap.fromTo(
      copy,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out", delay: 0.5 }
    );
  }

  if (actions) {
    gsap.fromTo(
      actions,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out", delay: 0.7 }
    );
  }
};

const initFloatingHero = () => {
  const floatingRoot = document.querySelector("[data-floating-root]");

  if (!floatingRoot || prefersReducedMotion) return;

  const items = [...floatingRoot.querySelectorAll(".hero-float__item")].map((item) => ({
    element: item,
    depth: Number(item.dataset.depth || "1"),
    current: { x: 0, y: 0 },
  }));

  const mousePosition = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  const sensitivity = -0.5;
  const easingFactor = 0.05;
  let isActive = false;
  let frameId = 0;

  const updatePosition = (clientX, clientY) => {
    const rect = floatingRoot.getBoundingClientRect();
    mousePosition.x = clientX - rect.left;
    mousePosition.y = clientY - rect.top;
  };

  const tick = () => {
    if (!isActive) {
      frameId = 0;
      return;
    }

    let needsAnotherFrame = false;

    items.forEach((item) => {
      const strength = (item.depth * sensitivity) / 20;
      const targetX = mousePosition.x * strength;
      const targetY = mousePosition.y * strength;
      const dx = targetX - item.current.x;
      const dy = targetY - item.current.y;

      item.current.x += dx * easingFactor;
      item.current.y += dy * easingFactor;

      item.element.style.transform = `translate3d(${item.current.x.toFixed(2)}px, ${item.current.y.toFixed(2)}px, 0)`;

      if (Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08) {
        needsAnotherFrame = true;
      }
    });

    if (needsAnotherFrame) {
      frameId = window.requestAnimationFrame(tick);
    } else {
      frameId = 0;
    }
  };

  const requestTick = () => {
    if (isActive && !frameId) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  window.addEventListener(
    "mousemove",
    (event) => {
      updatePosition(event.clientX, event.clientY);
      requestTick();
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) {
        updatePosition(touch.clientX, touch.clientY);
        requestTick();
      }
    },
    { passive: true }
  );

  const observer = new IntersectionObserver(
    ([entry]) => {
      isActive = entry?.isIntersecting ?? false;
      if (isActive) {
        requestTick();
      }
    },
    { threshold: 0.05 }
  );

  observer.observe(floatingRoot);
};

const initTextRotate = () => {
  const target = document.querySelector("[data-text-rotate]");

  if (!target) return;

  const words = parseDatasetArray(target.dataset.words);
  const rotationInterval = Number(target.dataset.rotationInterval || "3000");
  const staggerDuration = Number(target.dataset.staggerDuration || "0");
  const staggerFrom = target.dataset.staggerFrom || "last";

  if (!words.length) return;

  let currentIndex = 0;
  let currentLayer = null;
  let intervalId = null;

  const buildLayer = (text) => {
    const layer = document.createElement("span");
    layer.className = "hero-rotate__layer";

    const parts = text.split(" ");
    const splitWords = parts.map((part) => splitIntoCharacters(part));
    const totalChars = splitWords.reduce((sum, part) => sum + part.length, 0);
    let charIndex = 0;

    splitWords.forEach((wordChars, wordPosition) => {
      const word = document.createElement("span");
      word.className = "hero-rotate__word";

      wordChars.forEach((character) => {
        const char = document.createElement("span");
        char.className = "hero-rotate__char";
        char.textContent = character;
        char.style.transitionDelay = `${getStaggerDelay(
          charIndex,
          totalChars,
          staggerFrom,
          staggerDuration
        )}s`;
        word.appendChild(char);
        charIndex += 1;
      });

      layer.appendChild(word);

      if (wordPosition !== splitWords.length - 1) {
        const space = document.createElement("span");
        space.className = "hero-rotate__space";
        space.textContent = " ";
        layer.appendChild(space);
      }
    });

    return layer;
  };

  const swapLayer = (nextIndex) => {
    const nextLayer = buildLayer(words[nextIndex]);
    nextLayer.style.position = "relative";
    nextLayer.style.visibility = "hidden";
    target.appendChild(nextLayer);

    const width = nextLayer.getBoundingClientRect().width;
    const height = nextLayer.getBoundingClientRect().height;

    target.style.width = `${Math.max(width, 1)}px`;
    target.style.height = `${Math.max(height, 1)}px`;

    nextLayer.style.position = "";
    nextLayer.style.visibility = "";

    requestAnimationFrame(() => {
      nextLayer.classList.add("is-active");
    });

    if (currentLayer) {
      currentLayer.classList.remove("is-active");
      currentLayer.classList.add("is-exit");
      const exitingLayer = currentLayer;
      window.setTimeout(() => exitingLayer.remove(), 900);
    }

    currentLayer = nextLayer;
    currentIndex = nextIndex;
  };

  swapLayer(0);

  if (!prefersReducedMotion) {
    intervalId = window.setInterval(() => {
      const nextIndex = currentIndex === words.length - 1 ? 0 : currentIndex + 1;
      swapLayer(nextIndex);
    }, rotationInterval);
  }

  window.addEventListener("beforeunload", () => {
    if (intervalId) {
      window.clearInterval(intervalId);
    }
  });
};

const initParallaxFallback = () => {
  const triggerElement = document.querySelector("[data-parallax-layers]");

  if (!triggerElement || prefersReducedMotion) return;

  const layers = [
    { selector: '[data-parallax-layer="1"]', amount: 70 },
    { selector: '[data-parallax-layer="2"]', amount: 55 },
    { selector: '[data-parallax-layer="3"]', amount: 40 },
    { selector: '[data-parallax-layer="4"]', amount: 10 },
  ];

  let frame = 0;

  const update = () => {
    const rect = triggerElement.getBoundingClientRect();
    const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);

    layers.forEach((layer) => {
      const element = triggerElement.querySelector(layer.selector);
      if (!element) return;
      const yPercent = layer.amount * progress;
      element.style.transform = `translate(-50%, calc(-50% + ${yPercent}%))`;
    });

    frame = 0;
  };

  const requestUpdate = () => {
    if (!frame) {
      frame = window.requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  requestUpdate();
};

const initParallax = () => {
  const triggerElement = document.querySelector("[data-parallax-layers]");

  if (!triggerElement) return;

  if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    gsap.registerPlugin(ScrollTrigger);

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    [
      { layer: "1", yPercent: 70 },
      { layer: "2", yPercent: 55 },
      { layer: "3", yPercent: 40 },
      { layer: "4", yPercent: 10 },
    ].forEach((layerObj, index) => {
      timeline.to(
        triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
        {
          yPercent: layerObj.yPercent,
          ease: "none",
        },
        index === 0 ? 0 : "<"
      );
    });

    if (window.Lenis) {
      lenisScroller = new window.Lenis({
        lerp: 0.09,
        smoothWheel: true,
      });

      lenisScroller.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenisScroller.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    return;
  }

  initParallaxFallback();
};

const initCarousel = () => {
  const carousel = document.querySelector("[data-carousel]");

  if (!carousel) return;

  const cards = [...carousel.querySelectorAll(".feature-carousel__card")];
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  let currentIndex = Math.floor(cards.length / 2);
  let timer = null;

  const getPosition = (index) => {
    const total = cards.length;
    let pos = (index - currentIndex + total) % total;
    if (pos > Math.floor(total / 2)) {
      pos -= total;
    }
    return pos;
  };

  const render = () => {
    cards.forEach((card, index) => {
      const pos = getPosition(index);
      const isCenter = pos === 0;
      const isAdjacent = Math.abs(pos) === 1;

      card.style.transform = `translate(-50%, -50%) translateX(${pos * 45}%) scale(${
        isCenter ? 1 : isAdjacent ? 0.85 : 0.7
      }) rotateY(${pos * -10}deg)`;
      card.style.zIndex = String(isCenter ? 10 : isAdjacent ? 5 : 1);
      card.style.opacity = isCenter ? "1" : isAdjacent ? "0.4" : "0";
      card.style.filter = isCenter ? "blur(0px)" : "blur(4px)";
      card.style.visibility = Math.abs(pos) > 1 ? "hidden" : "visible";
    });
  };

  const next = () => {
    currentIndex = (currentIndex + 1) % cards.length;
    render();
  };

  const previous = () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    render();
  };

  const start = () => {
    if (prefersReducedMotion || cards.length < 2) return;
    stop();
    timer = window.setInterval(next, 4000);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  prevButton?.addEventListener("click", () => {
    previous();
    start();
  });

  nextButton?.addEventListener("click", () => {
    next();
    start();
  });

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);

  render();
  start();
};

const initGooeyText = () => {
  const gooeyRoot = document.querySelector("[data-gooey]");

  if (!gooeyRoot) return;

  const texts = parseDatasetArray(gooeyRoot.dataset.texts);
  const morphTime = Number(gooeyRoot.dataset.morphTime || "1");
  const cooldownTime = Number(gooeyRoot.dataset.cooldownTime || "0.25");
  const textOne = gooeyRoot.querySelector("[data-gooey-primary]");
  const textTwo = gooeyRoot.querySelector("[data-gooey-secondary]");

  if (!texts.length || !textOne || !textTwo) return;

  let textIndex = texts.length - 1;
  let time = new Date();
  let morph = 0;
  let cooldown = cooldownTime;
  let frameId = 0;
  let isActive = false;

  const setMorph = (fraction) => {
    const safeFraction = clamp(fraction, 0.0001, 1);
    textTwo.style.filter = `blur(${Math.min(8 / safeFraction - 8, 100)}px)`;
    textTwo.style.opacity = `${Math.pow(safeFraction, 0.4) * 100}%`;

    const inverse = clamp(1 - fraction, 0.0001, 1);
    textOne.style.filter = `blur(${Math.min(8 / inverse - 8, 100)}px)`;
    textOne.style.opacity = `${Math.pow(inverse, 0.4) * 100}%`;
  };

  const doCooldown = () => {
    morph = 0;
    textTwo.style.filter = "";
    textTwo.style.opacity = "100%";
    textOne.style.filter = "";
    textOne.style.opacity = "0%";
  };

  const doMorph = () => {
    morph -= cooldown;
    cooldown = 0;

    let fraction = morph / morphTime;

    if (fraction > 1) {
      cooldown = cooldownTime;
      fraction = 1;
    }

    setMorph(fraction);
  };

  const animate = () => {
    if (!isActive) {
      frameId = 0;
      return;
    }

    frameId = window.requestAnimationFrame(animate);
    const newTime = new Date();
    const shouldIncrementIndex = cooldown > 0;
    const dt = (newTime.getTime() - time.getTime()) / 1000;
    time = newTime;

    cooldown -= dt;

    if (cooldown <= 0) {
      if (shouldIncrementIndex) {
        textIndex = (textIndex + 1) % texts.length;
        textOne.textContent = texts[textIndex % texts.length];
        textTwo.textContent = texts[(textIndex + 1) % texts.length];
      }
      doMorph();
    } else {
      doCooldown();
    }
  };

  textOne.textContent = texts[textIndex];
  textTwo.textContent = texts[(textIndex + 1) % texts.length];

  if (prefersReducedMotion) {
    textOne.style.opacity = "1";
    textTwo.style.opacity = "0";
    return;
  }

  const startAnimation = () => {
    if (!frameId) {
      time = new Date();
      frameId = window.requestAnimationFrame(animate);
    }
  };

  const stopAnimation = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      isActive = entry?.isIntersecting ?? false;

      if (isActive) {
        startAnimation();
      } else {
        stopAnimation();
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(gooeyRoot);

  window.addEventListener("beforeunload", () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }
  });
};

const initRevealObserver = () => {
  const items = document.querySelectorAll(".reveal");

  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  items.forEach((item) => observer.observe(item));
};

const initAnchorLinks = () => {
  [...document.querySelectorAll('a[href^="#"]')].forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      closeMobileMenu();
      scrollToTarget(target);
    });
  });
};

const initFooterPlaceholderLinks = () => {
  [...document.querySelectorAll('.site-footer a[href="#"]')].forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
};

const initFooterYear = () => {
  const yearNode = document.querySelector("#year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
};

const init = () => {
  initMenuToggle();
  initDock();
  initHeroIntro();
  initFloatingHero();
  initTextRotate();
  initParallax();
  initCarousel();
  initGooeyText();
  initRevealObserver();
  initAnchorLinks();
  initFooterPlaceholderLinks();
  initFooterYear();
};

init();
