// Année courante dans le footer
document.getElementById('year').textContent = new Date().getFullYear();

// En-tête : fond opaque après un petit défilement, et masquée (glissée vers
// le haut) dès qu'on défile vers le bas — elle ne réapparaît qu'en
// remontant, pour rester disponible sans encombrer l'écran en lecture.
const header = document.getElementById('site-header');
const HEADER_SHOW_THRESHOLD = 40; // toujours visible tant qu'on n'a pas dépassé ce point
const HEADER_SCROLL_DELTA = 4; // ignore les petits à-coups (rebond iOS, etc.)

let lastScrollY = window.scrollY;
let headerTicking = false;

const updateHeader = () => {
  const y = window.scrollY;

  header.classList.toggle('is-scrolled', y > 40);

  if (header.classList.contains('nav-open')) {
    // Le menu mobile ouvert doit toujours rester accessible.
    header.classList.remove('is-hidden');
  } else if (y <= HEADER_SHOW_THRESHOLD) {
    header.classList.remove('is-hidden');
  } else if (y > lastScrollY + HEADER_SCROLL_DELTA) {
    header.classList.add('is-hidden');
  } else if (y < lastScrollY - HEADER_SCROLL_DELTA) {
    header.classList.remove('is-hidden');
  }

  lastScrollY = y;
  headerTicking = false;
};

updateHeader();
window.addEventListener('scroll', () => {
  if (!headerTicking) {
    window.requestAnimationFrame(updateHeader);
    headerTicking = true;
  }
}, { passive: true });

// Menu mobile
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = header.classList.toggle('nav-open');
  if (isOpen) header.classList.remove('is-hidden');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Apparition du nom (h1) au chargement de la page, lettre par lettre et
// horizontalement (voir les classes .name-word / .name-char-mask /
// .name-char dans le CSS). IMPORTANT : ce découpage doit se faire AVANT
// la mise en place du halo de survol un peu plus bas, puisque celui-ci
// clone le innerHTML du nom — s'il clonait le texte brut, le calque du
// halo n'aurait pas exactement la même structure (mêmes espacements
// inter-lettres) que le nom réel, et les deux pourraient très légèrement
// se désaligner. Sous mouvement réduit, on ne découpe pas du tout : le
// nom reste un texte normal, sans effet.
const heroNameEl = document.querySelector('.hero h1');

if (heroNameEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Texte de secours pour les lecteurs d'écran : capturé avant le
  // découpage, qui multiplie les nœuds (un par lettre) et rendrait la
  // lecture au lecteur d'écran pénible lettre par lettre.
  const accessibleClone = document.createElement('span');
  accessibleClone.className = 'sr-only';
  // heroNameEl.textContent collerait les deux lignes ("Mary-ÉlizabethLagacé")
  // puisque le <br> entre elles n'est pas un nœud texte : on le remplace
  // explicitement par une espace pour une lecture correcte.
  accessibleClone.textContent = Array.from(heroNameEl.childNodes)
    .map((node) => (node.nodeName === 'BR' ? ' ' : node.textContent))
    .join('');

  // Découpe un nœud de texte en mots (conservés d'un seul bloc, pour ne
  // jamais couper un mot en fin de ligne) puis en lettres, chacune dans
  // son propre masque.
  const buildWords = (text) => {
    const fragment = document.createDocumentFragment();
    const pieces = text.split(/(\s+)/);
    pieces.forEach((piece) => {
      if (piece === '') return;
      if (/^\s+$/.test(piece)) {
        fragment.appendChild(document.createTextNode(piece));
        return;
      }
      // Un « mot » composé (ex. « Mary-Élizabeth ») doit pouvoir se couper
      // après le trait d'union sur petit écran, comme le ferait du texte
      // normal — on le subdivise donc en segments coupés juste après
      // chaque « - », reliés par une espace de largeur nulle qui sert de
      // seul point de coupure valide entre eux (chaque segment reste lui-
      // même insécable).
      const segments = piece.split(/(?<=-)/);
      segments.forEach((segment, i) => {
        if (segment === '') return;
        if (i > 0) fragment.appendChild(document.createTextNode('​'));
        const word = document.createElement('span');
        word.className = 'name-word';
        Array.from(segment).forEach((letter) => {
          const mask = document.createElement('span');
          mask.className = 'name-char-mask';
          const char = document.createElement('span');
          char.className = 'name-char';
          char.textContent = letter;
          mask.appendChild(char);
          word.appendChild(mask);
        });
        fragment.appendChild(word);
      });
    });
    return fragment;
  };

  // Reconstruit chaque nœud enfant en préservant les éléments existants
  // (le <br> entre les deux lignes du nom doit rester tel quel) et en
  // découpant leur contenu textuel.
  const rebuildWithLetters = (root) => {
    Array.from(root.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        root.replaceChild(buildWords(node.textContent), node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        rebuildWithLetters(node);
      }
    });
  };

  rebuildWithLetters(heroNameEl);
  heroNameEl.setAttribute('aria-hidden', 'true');
  heroNameEl.insertAdjacentElement('afterend', accessibleClone);

  // Index séquentiel (ordre de lecture) pour l'échelonnement de la
  // cascade lettre par lettre.
  heroNameEl.querySelectorAll('.name-char').forEach((char, i) => {
    char.style.setProperty('--char-i', i);
  });

  // Le nom est toujours visible dès l'arrivée sur la page (en haut du
  // hero) : on déclenche donc l'apparition directement, pas au
  // défilement. Double rAF : force le navigateur à peindre l'état
  // initial (masqué) avant d'ajouter la classe qui déclenche la
  // transition, pour ne jamais risquer de fusionner les deux états en
  // une seule peinture.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroNameEl.classList.add('is-revealed');
    });
  });
}

// Petites animations d'apparition au défilement (légères)
// Deux variantes : « reveal » (fondu + léger glissement) pour les blocs
// classiques, « reveal-fade » (fondu seul) pour les éléments qui portent
// déjà une parallaxe, afin de ne pas faire concurrence à leur transform.
const revealTargets = document.querySelectorAll(
  '.about-grid, .slider, .timeline-item, .two-col > div, .eyebrow'
);
revealTargets.forEach((el) => el.classList.add('reveal'));

const revealFadeTargets = document.querySelectorAll('h2[data-parallax], #approche-ia .section-intro');
revealFadeTargets.forEach((el) => el.classList.add('reveal-fade'));

const allRevealEls = [...revealTargets, ...revealFadeTargets];

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  allRevealEls.forEach((el) => observer.observe(el));
} else {
  allRevealEls.forEach((el) => el.classList.add('is-visible'));
}

// Slider photo « Au quotidien »
// Navigation manuelle uniquement (pas de défilement automatique), et on ne
// touche qu'au défilement horizontal interne du carrousel (scrollLeft) —
// jamais à scrollIntoView, qui pouvait faire « remonter » toute la page.
const sliderTrack = document.getElementById('slider-track');

if (sliderTrack) {
  const slides = Array.from(sliderTrack.children);
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');

  let current = 0;
  let programmaticScroll = false;
  let programmaticTimeout;
  // Vrai uniquement quand la personne a elle-même initié le mouvement
  // (glissement tactile/souris ou molette) — jamais après un simple clic
  // sur les flèches. Sur les grands écrans, la dernière photo ne peut pas
  // toujours être ramenée parfaitement à gauche (le carrousel est déjà à
  // sa limite de défilement), donc une détection « photo la plus proche »
  // basée sur la position ferait revenir l'index en arrière juste après
  // un clic — d'où la nécessité de ne resynchroniser que sur un geste réel.
  let manualInteraction = false;

  const updateControls = () => {
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
  };

  // Carrousel borné : on s'arrête à la première et à la dernière photo, et
  // les flèches se désactivent en conséquence plutôt que de boucler.
  const goTo = (index) => {
    manualInteraction = false;
    current = Math.max(0, Math.min(slides.length - 1, index));
    const slide = slides[current];
    const targetLeft = slide.getBoundingClientRect().left
      - sliderTrack.getBoundingClientRect().left
      + sliderTrack.scrollLeft;
    // Le suivi du glissement manuel (plus bas) est mis en pause pendant
    // qu'on anime nous-mêmes vers une cible, sinon les deux se disputent
    // l'index courant et un clic peut sembler « sauter » une photo.
    programmaticScroll = true;
    clearTimeout(programmaticTimeout);
    sliderTrack.scrollTo({ left: targetLeft, behavior: 'smooth' });
    updateControls();
    programmaticTimeout = setTimeout(() => { programmaticScroll = false; }, 500);
  };

  nextBtn.addEventListener('click', () => goTo(current + 1));
  prevBtn.addEventListener('click', () => goTo(current - 1));

  ['pointerdown', 'touchstart', 'wheel'].forEach((type) => {
    sliderTrack.addEventListener(type, () => { manualInteraction = true; }, { passive: true });
  });

  // Garde l'index courant synchronisé quand la personne glisse elle-même
  let scrollTimeout;
  sliderTrack.addEventListener('scroll', () => {
    if (programmaticScroll || !manualInteraction) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const trackRect = sliderTrack.getBoundingClientRect();
      let closest = 0;
      let closestDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.getBoundingClientRect().left - trackRect.left);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      current = closest;
      manualInteraction = false;
      updateControls();
    }, 120);
  }, { passive: true });

  updateControls();
}

// Parallaxe légère, en JavaScript simple (pas de librairie externe) :
// chaque élément portant data-parallax dérive doucement selon sa position
// dans la fenêtre, via une transformation CSS mise à jour au défilement.
// Le défilement de la page lui-même reste 100 % natif — rien n'est
// intercepté, donc rien ne peut rester « pogné ».
const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
const prefersReducedMotionGlobal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (parallaxEls.length && !prefersReducedMotionGlobal) {
  let ticking = false;

  const applyParallax = () => {
    const viewportH = window.innerHeight;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const progress = (center - viewportH / 2) / viewportH; // ~ -1 à 1 pendant la traversée
      el.style.transform = `translateY(${(progress * speed).toFixed(1)}px)`;
    });
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  };

  applyParallax();
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
}

// Panneau final « Envie de jaser? » + pied de page
// Le panneau est en position fixe (voir .reveal-footer dans style.css) et se
// révèle par-dessous le contenu principal à mesure qu'on défile à travers
// .reveal-footer-spacer — un pur effet de superposition, sans « vol » du
// défilement natif, donc aussi fluide dans un sens que dans l'autre. On
// calcule ici une simple progression (0 à 1) de cette révélation, pour :
//   1) faire transitionner le fond de --ink vers --footer-accent, ET le
//      texte de --paper vers --ink en retour (paire qui s'inverse pour
//      rester lisible même une fois le fond devenu clair) ;
//   2) déclencher l'apparition en cascade du contenu une fois bien engagé.
const revealFooter = document.querySelector('.reveal-footer');
const revealFooterSpacer = document.querySelector('.reveal-footer-spacer');

if (revealFooter && revealFooterSpacer) {
  // Résout une couleur CSS (variable, nom, hex...) en triplet [r, g, b] via
  // un élément hors-écran, pour ne jamais dupliquer les couleurs entre le
  // CSS et le JS : les couleurs ne se changent qu'à un seul endroit (:root).
  const resolveRgb = (cssColor) => {
    const probe = document.createElement('span');
    probe.style.color = cssColor;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const nums = computed.match(/[\d.]+/g);
    return nums ? nums.slice(0, 3).map(Number) : [0, 0, 0];
  };

  const rootStyle = getComputedStyle(document.documentElement);
  const inkRgb = resolveRgb(rootStyle.getPropertyValue('--ink').trim());
  const paperRgb = resolveRgb(rootStyle.getPropertyValue('--paper').trim());
  const accentRgb = resolveRgb(rootStyle.getPropertyValue('--footer-accent').trim());
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const lerpRgb = (from, to, t) => `rgb(${lerp(from[0], to[0], t)}, ${lerp(from[1], to[1], t)}, ${lerp(from[2], to[2], t)})`;

  if (prefersReducedMotionGlobal) {
    // Pas de scrub : couleurs finales fixes, contenu affiché directement
    // (déjà géré par la règle CSS prefers-reduced-motion pour l'opacité).
    revealFooter.style.setProperty('--footer-bg', lerpRgb(inkRgb, accentRgb, 1));
    revealFooter.style.setProperty('--footer-fg', lerpRgb(paperRgb, inkRgb, 1));
    revealFooter.classList.add('is-visible');
  } else {
    let footerTicking = false;
    const contentThreshold = 0.4; // apparition du contenu une fois le panneau bien engagé

    const updateFooterReveal = () => {
      const viewportH = window.innerHeight;
      const spacerTop = revealFooterSpacer.getBoundingClientRect().top + window.scrollY;
      const revealStart = spacerTop - viewportH;
      const progress = Math.min(1, Math.max(0, (window.scrollY - revealStart) / viewportH));

      revealFooter.style.setProperty('--footer-bg', lerpRgb(inkRgb, accentRgb, progress));
      revealFooter.style.setProperty('--footer-fg', lerpRgb(paperRgb, inkRgb, progress));
      revealFooter.classList.toggle('is-visible', progress > contentThreshold);

      footerTicking = false;
    };

    const requestFooterTick = () => {
      if (!footerTicking) {
        window.requestAnimationFrame(updateFooterReveal);
        footerTicking = true;
      }
    };

    updateFooterReveal();
    window.addEventListener('scroll', requestFooterTick, { passive: true });
    window.addEventListener('resize', requestFooterTick);
  }
}
