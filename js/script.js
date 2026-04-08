const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const mobileLinks = document.querySelectorAll(".mobile-menu a");

if (menuButton && mobileMenu) {
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
      }, 220);
    }
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });
}

const dock = document.querySelector(".dock-nav");

if (dock) {
  const dockItems = [...dock.querySelectorAll(".dock-nav__item")];

  const resetDock = () => {
    dockItems.forEach((item) => {
      item.style.setProperty("--dock-scale", "1");
      item.style.setProperty("--dock-lift", "0px");
    });
  };

  dock.addEventListener("pointermove", (event) => {
    dockItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(event.clientX - center);
      const falloff = clamp(1 - distance / 180, 0, 1);
      const scale = 1 + falloff * 0.42;
      const lift = `${Math.round(falloff * -10)}px`;

      item.style.setProperty("--dock-scale", scale.toFixed(3));
      item.style.setProperty("--dock-lift", lift);
    });
  });

  dock.addEventListener("pointerleave", resetDock);
  resetDock();
}

const rotateTarget = document.querySelector("[data-rotate]");

if (rotateTarget) {
  const words = (rotateTarget.dataset.words || "")
    .split("|")
    .map((word) => word.trim())
    .filter(Boolean);

  let rotateIndex = 0;

  const renderWord = (word) => {
    rotateTarget.innerHTML = "";
    [...word].forEach((character, index) => {
      const span = document.createElement("span");
      span.className = "hero-rotate__char";
      span.style.setProperty("--char-index", index);
      span.textContent = character === " " ? "\u00A0" : character;
      rotateTarget.appendChild(span);
    });
  };

  if (words.length) {
    renderWord(words[0]);

    if (!prefersReducedMotion) {
      window.setInterval(() => {
        rotateIndex = (rotateIndex + 1) % words.length;
        renderWord(words[rotateIndex]);
      }, 2600);
    }
  }
}

const floatingRoot = document.querySelector("[data-floating-root]");

if (floatingRoot && !prefersReducedMotion) {
  const floatingCards = [...floatingRoot.querySelectorAll(".hero-card")];
  let pointerX = 0;
  let pointerY = 0;
  let rafId = 0;

  const updateFloatingCards = () => {
    floatingCards.forEach((card) => {
      const depth = Number(card.dataset.depth || "1");
      const x = pointerX * depth * 20;
      const y = pointerY * depth * 16;
      card.style.setProperty("--tx", `${x.toFixed(2)}px`);
      card.style.setProperty("--ty", `${y.toFixed(2)}px`);
    });

    rafId = 0;
  };

  const queueFloatingUpdate = () => {
    if (!rafId) {
      rafId = window.requestAnimationFrame(updateFloatingCards);
    }
  };

  const handlePointer = (event) => {
    const rect = floatingRoot.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    queueFloatingUpdate();
  };

  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener(
    "pointerleave",
    () => {
      pointerX = 0;
      pointerY = 0;
      queueFloatingUpdate();
    },
    { passive: true }
  );
}

const parallaxSection = document.querySelector(".parallax");

if (parallaxSection && !prefersReducedMotion) {
  const parallaxLayers = [...parallaxSection.querySelectorAll("[data-parallax-speed]")];
  let parallaxFrame = 0;

  const updateParallax = () => {
    const rect = parallaxSection.getBoundingClientRect();
    const progress = clamp(
      (window.innerHeight - rect.top) / (window.innerHeight + rect.height),
      0,
      1
    );

    parallaxLayers.forEach((layer) => {
      const speed = Number(layer.dataset.parallaxSpeed || "0");
      const travel = (progress - 0.5) * speed * 260;
      const scale = 1 + speed * 0.08;
      layer.style.transform = `translate3d(0, ${travel.toFixed(2)}px, 0) scale(${scale.toFixed(
        3
      )})`;
    });

    parallaxFrame = 0;
  };

  const queueParallax = () => {
    if (!parallaxFrame) {
      parallaxFrame = window.requestAnimationFrame(updateParallax);
    }
  };

  window.addEventListener("scroll", queueParallax, { passive: true });
  window.addEventListener("resize", queueParallax);
  queueParallax();
}

const carousel = document.querySelector("[data-carousel]");

if (carousel) {
  const cards = [...carousel.querySelectorAll(".carousel__card")];
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = document.querySelector("[data-carousel-dots]");
  let activeIndex = Math.floor(cards.length / 2);
  let autoplayId = 0;

  const wrappedOffset = (index) => {
    let offset = index - activeIndex;
    const total = cards.length;

    if (offset > total / 2) {
      offset -= total;
    }

    if (offset < -total / 2) {
      offset += total;
    }

    return offset;
  };

  const updateCards = () => {
    cards.forEach((card, index) => {
      const offset = wrappedOffset(index);
      const distance = Math.abs(offset);
      const isCenter = offset === 0;
      const isAdjacent = distance === 1;
      const translateX = offset * 62;
      const scale = isCenter ? 1 : isAdjacent ? 0.86 : 0.68;
      const rotateY = offset * -16;
      const opacity = isCenter ? 1 : isAdjacent ? 0.46 : 0;
      const blur = isCenter ? 0 : isAdjacent ? 3 : 10;
      const visibility = distance > 1 ? "hidden" : "visible";

      card.style.transform = `translate(-50%, -50%) translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`;
      card.style.opacity = opacity;
      card.style.filter = `blur(${blur}px)`;
      card.style.zIndex = String(isCenter ? 10 : isAdjacent ? 5 : 1);
      card.style.visibility = visibility;
      card.setAttribute("aria-hidden", String(!isCenter));
    });

    if (dotsContainer) {
      [...dotsContainer.querySelectorAll(".carousel__dot")].forEach((dot, index) => {
        dot.classList.toggle("is-active", index === activeIndex);
      });
    }
  };

  const goTo = (index) => {
    activeIndex = (index + cards.length) % cards.length;
    updateCards();
  };

  const startAutoplay = () => {
    if (prefersReducedMotion || cards.length < 2) {
      return;
    }

    stopAutoplay();
    autoplayId = window.setInterval(() => goTo(activeIndex + 1), 4200);
  };

  const stopAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = 0;
    }
  };

  if (dotsContainer) {
    cards.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot";
      dot.setAttribute("aria-label", `Go to card ${index + 1}`);
      dot.addEventListener("click", () => {
        goTo(index);
        startAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  prevButton?.addEventListener("click", () => {
    goTo(activeIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    goTo(activeIndex + 1);
    startAutoplay();
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);

  updateCards();
  startAutoplay();
}

const gooeyRoot = document.querySelector("[data-gooey]");

if (gooeyRoot) {
  const texts = (gooeyRoot.dataset.texts || "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const textOne = gooeyRoot.querySelector("[data-gooey-primary]");
  const textTwo = gooeyRoot.querySelector("[data-gooey-secondary]");

  if (textOne && textTwo && texts.length) {
    let textIndex = texts.length - 1;
    let lastTime = new Date();
    let morph = 0;
    let cooldown = 0.4;
    const morphTime = 1;
    const cooldownTime = 0.4;

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
      const now = new Date();
      const shouldAdvance = cooldown > 0;
      const delta = (now.getTime() - lastTime.getTime()) / 1000;
      lastTime = now;
      cooldown -= delta;

      if (cooldown <= 0) {
        if (shouldAdvance) {
          textIndex = (textIndex + 1) % texts.length;
          textOne.textContent = texts[textIndex % texts.length];
          textTwo.textContent = texts[(textIndex + 1) % texts.length];
        }
        doMorph();
      } else {
        doCooldown();
      }

      window.requestAnimationFrame(animate);
    };

    textOne.textContent = texts[textIndex];
    textTwo.textContent = texts[(textIndex + 1) % texts.length];

    if (prefersReducedMotion) {
      textOne.style.opacity = "1";
      textTwo.style.opacity = "0";
    } else {
      animate();
    }
  }
}

const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const yearNode = document.querySelector("#year");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}
