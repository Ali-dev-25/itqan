/**
 * ITQAN PLATFORM — Fatin Performance & Interactive Guide Component
 * محرك الأداء المتزامن (الصوت + الحركة + الحوار) لشخصية «فَطِن»
 * 
 * الاسم المعتمد: فَطِن (بفتح الفاء)
 * الهوية الصوتية: ar-SA-HamedNeural
 */
window.Fatin = (() => {
  console.log('[Fatin] fatin.js initialized with synchronized performance engine');

  const POSE_PATH = 'assets/images/fatin/';
  const POSES = [
    'reading-professional.webp',
    'reading.webp',
    'greeting.webp',
    'pointing.webp',
    'thinking.webp',
    'learning.webp',
    'courses.webp',
    'registration.webp',
    'payment.webp',
    'success.webp',
    'goodbye.webp'
  ];

  const GESTURE_CLASSES = [
    'gesture-wave',
    'gesture-self',
    'gesture-welcome',
    'gesture-book',
    'gesture-invite',
    'gesture-forward',
    'gesture-present',
    'gesture-explain',
    'gesture-point',
    'gesture-grow',
    'gesture-practical',
    'gesture-choose',
    'gesture-organize',
    'gesture-write',
    'gesture-nod',
    'gesture-next',
    'gesture-doc',
    'gesture-success',
    'gesture-save'
  ];

  let currentStepIndex = 0;
  let isTourActive = false;
  let isGreetingActive = false;
  let introPhase = 0; // 0: idle, 1: greeting, 2: platform overview
  let preloadedImages = {};
  let currentHighlightEl = null;

  // محرك الصوت الموحد
  let activeAudio = null;
  let activeTimelineCleanup = null;

  /**
   * تحميل مسبق للوضعيات لمنع أي وميض
   */
  function preloadPoses() {
    POSES.forEach(pose => {
      const img = new Image();
      img.src = `${POSE_PATH}${pose}?v=2`;
      preloadedImages[pose] = img;
    });
  }

  /**
   * إيقاف أي صوت أو حركة نشطة فوراً
   */
  function stopAudio() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.onended = null;
      activeAudio.ontimeupdate = null;
      activeAudio = null;
    }
    if (activeTimelineCleanup) {
      activeTimelineCleanup();
      activeTimelineCleanup = null;
    }
  }

  /**
   * إزالة كافة فئات الحركات من العنصر
   */
  function clearGestures(el) {
    if (!el) return;
    GESTURE_CLASSES.forEach(cls => el.classList.remove(cls));
  }

  /**
   * تشغيل مشهد متزامن (صوت + حركات Timeline)
   */
  function playSynchronizedScene(sceneData, avatarWrapEl, avatarImgEl, onEndCallback) {
    stopAudio();
    if (!sceneData || !sceneData.audio) return;

    const audio = new Audio(sceneData.audio);
    activeAudio = audio;

    const timeline = sceneData.timeline || [];
    const triggeredEvents = new Set();
    let gestureTimeout = null;

    clearGestures(avatarWrapEl);

    // تتبع التوقيت اللحظي للصوت لتنفيذ الحركات
    audio.ontimeupdate = () => {
      const curTime = audio.currentTime;

      timeline.forEach((evt, idx) => {
        if (curTime >= evt.time && !triggeredEvents.has(idx)) {
          triggeredEvents.add(idx);

          // 1. تغيير الوضعية إن كانت محددة في الحدث
          if (evt.pose && avatarImgEl) {
            setAvatarPose(avatarImgEl, evt.pose);
          }

          // 2. تطبيق الحركة المتزامنة مع معنى الكلمة
          if (evt.gesture && avatarWrapEl) {
            clearGestures(avatarWrapEl);
            avatarWrapEl.classList.add(evt.gesture);

            if (gestureTimeout) clearTimeout(gestureTimeout);
            gestureTimeout = setTimeout(() => {
              clearGestures(avatarWrapEl);
            }, 650);
          }
        }
      });
    };

    audio.onended = () => {
      clearGestures(avatarWrapEl);
      if (gestureTimeout) clearTimeout(gestureTimeout);
      if (typeof onEndCallback === 'function') {
        onEndCallback();
      }
    };

    activeTimelineCleanup = () => {
      clearGestures(avatarWrapEl);
      if (gestureTimeout) clearTimeout(gestureTimeout);
    };

    audio.play().catch(err => {
      console.warn('[Fatin Audio] Playback prevented by browser policy:', err);
    });
  }

  /**
   * تبديل وضعية الصورة بنعومة
   */
  function setAvatarPose(imgEl, poseFileName) {
    if (!imgEl) return;
    const cleanName = poseFileName.includes('.') ? poseFileName : `${poseFileName}.webp`;
    const targetSrc = `${POSE_PATH}${cleanName}?v=4`;

    if (imgEl.getAttribute('data-current-pose') === cleanName) return;
    imgEl.setAttribute('data-current-pose', cleanName);

    imgEl.classList.add('switching');
    setTimeout(() => {
      imgEl.src = targetSrc;
      imgEl.classList.remove('switching');
    }, 100);
  }

  /* =========================================================================
     1. STANDALONE ENTRANCE PAGE (fatin.html)
     ========================================================================= */
  function initStandalonePage() {
    console.log('[Fatin] initStandalonePage started');
    preloadPoses();

    const fatinContainer = document.getElementById('fatin-container');
    const fatinImg = document.getElementById('fatin');
    const dialogueCard = document.getElementById('fatin-dialogue-card');
    const greetingMsgEl = document.getElementById('fatin-dialogue-greeting');
    const dialogueMsgEl = document.getElementById('fatin-dialogue-message');
    const startBtn = document.getElementById('btn-fatin-start');
    const pageBody = document.getElementById('fatin-standalone-page');

    let hasClicked = false;

    function handleFatinClick(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (hasClicked) return;
      hasClicked = true;
      console.log('[Fatin] User started interaction with فَطِن');

      // 1. إظهار بطاقة الحوار
      if (dialogueCard) {
        dialogueCard.classList.add('show');
      }

      const introScenes = window.FatinIntroScenes || {};
      const scene1 = introScenes.greeting;
      const scene2 = introScenes.tourInvite;

      // 2. تشغيل المشهد 1 (التحية والتعريف بالنفس)
      if (greetingMsgEl) greetingMsgEl.textContent = 'مرحبًا! أنا فَطِن، رفيقكم في إتقان المعرفة.';
      if (dialogueMsgEl) dialogueMsgEl.textContent = 'يسعدني تواجدكم معنا في منصة إتقان!';

      playSynchronizedScene(scene1, fatinContainer, fatinImg, () => {
        // بعد انتهاء المشهد 1، الانتقال بسلاسة للمشهد 2 (التعريف بالجولة)
        setTimeout(() => {
          if (greetingMsgEl) greetingMsgEl.textContent = 'جولة استكشاف منصة إتقان 🚀';
          if (dialogueMsgEl) dialogueMsgEl.textContent = 'سآخذكم في جولة سريعة داخل منصة إتقان، وأعرّفكم بأهم ما تقدمه، وكيف يمكنكم الاستفادة منها. هيا بنا!';

          playSynchronizedScene(scene2, fatinContainer, fatinImg, () => {
            if (fatinImg) setAvatarPose(fatinImg, 'pointing.webp');
          });
        }, 350);
      });
    }

    if (fatinContainer) {
      fatinContainer.addEventListener('click', handleFatinClick);
      fatinContainer.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') handleFatinClick(e);
      });
      fatinContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handleFatinClick(e);
      });
    }

    if (fatinImg) {
      fatinImg.addEventListener('click', handleFatinClick);
    }

    // زر "هيا بنا" للانتقال للموقع الرئيسي
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        stopAudio();

        const splashEl = document.getElementById('fatin-splash');
        const mainContentEl = document.getElementById('main-content');

        if (splashEl && mainContentEl) {
          splashEl.style.transition = 'opacity 0.35s ease-out';
          splashEl.style.opacity = '0';

          setTimeout(() => {
            splashEl.style.display = 'none';
            mainContentEl.style.display = 'block';
            mainContentEl.style.opacity = '0';
            mainContentEl.style.transition = 'opacity 0.4s ease-in';

            setTimeout(() => {
              mainContentEl.style.opacity = '1';
              if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
              }
              if (typeof startTour === 'function') {
                startTour(0);
              }
            }, 50);
          }, 350);
        } else if (
          window.location.pathname.endsWith('fatin.html') ||
          window.location.pathname === '/' ||
          window.location.pathname === '' ||
          document.getElementById('fatin-standalone-page') ||
          !document.getElementById('hero')
        ) {
          window.location.href = 'index.html?tour=auto';
        } else {
          const heroEl = document.getElementById('hero');
          if (heroEl) heroEl.scrollIntoView({ behavior: 'smooth' });
          if (typeof startTour === 'function') startTour(0);
        }
      });
    }
  }

  /* =========================================================================
     2. PUBLIC SITE INTERACTIVE TOUR (index.html)
     ========================================================================= */
  function initSiteTour() {
    console.log('[Fatin] initSiteTour started');
    preloadPoses();
    if (document.getElementById('fatin-container')) {
      initStandalonePage();
    }
    createTourWidget();
    attachKeyboardEvents();
    attachSectionListeners();

    const ctaTourBtn = document.getElementById('btn-hero-cta-tour');
    if (ctaTourBtn) {
      ctaTourBtn.addEventListener('click', () => {
        startIntroAndTour();
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tour') === 'auto' || urlParams.get('tour') === '1') {
      setTimeout(() => {
        startTour(0);
      }, 400);
    } else {
      // إظهار بالون الترحيب العائم فور فتح الصفحة
      const dismissed = sessionStorage.getItem('fatin_welcome_dismissed');
      if (dismissed === '1') {
        showLauncher();
      } else {
        setTimeout(() => {
          showWelcomeGreeting();
        }, 1100);
      }
    }
  }

  /**
   * إنشاء الرفيق العائم للجولة التفاعلية وزر الاستدعاء المصغر في DOM
   */
  function createTourWidget() {
    if (document.getElementById('fatin-tour-widget')) return;

    // 1. زر الاستدعاء المصغر عند إغلاق البالون
    if (!document.getElementById('fatin-floating-launcher')) {
      const launcher = document.createElement('button');
      launcher.type = 'button';
      launcher.id = 'fatin-floating-launcher';
      launcher.className = 'fatin-floating-launcher';
      launcher.title = 'تحدث مع فَطِن رفيقك في إتقان 🦊';
      launcher.setAttribute('aria-label', 'تحدث مع فَطِن رفيقك في إتقان');
      launcher.innerHTML = `
        <div class="fatin-launcher-avatar-wrap">
          <img src="${POSE_PATH}greeting.webp?v=4" alt="فَطِن" class="fatin-launcher-avatar" />
          <span class="fatin-launcher-ping"></span>
        </div>
        <span class="fatin-launcher-text">رفيقك فَطِن 🦊</span>
      `;
      launcher.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startIntroAndTour();
      });
      document.body.appendChild(launcher);
    }

    // 2. الرفيق وفقاعة الحوار
    const widget = document.createElement('div');
    widget.id = 'fatin-tour-widget';
    widget.className = 'fatin-tour-widget';
    widget.setAttribute('role', 'dialog');
    widget.setAttribute('aria-label', 'جولة فَطِن الإرشادية');

    widget.innerHTML = `
      <!-- Speech Bubble Card -->
      <div class="fatin-widget-card" id="fatin-tour-card">
        <div class="fatin-widget-topbar">
          <span class="fatin-widget-badge" id="fatin-step-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
            <span id="fatin-step-number">1 - 7</span>
          </span>
          <button type="button" class="btn-tour-skip" id="btn-tour-close" title="إغلاق (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <h4 class="fatin-widget-title" id="fatin-step-title">عن منصة إتقان</h4>
        <p class="fatin-widget-dialogue" id="fatin-step-dialogue">...</p>

        <div class="fatin-widget-actions">
          <button type="button" class="btn-tour-next" id="btn-tour-next">
            <span id="fatin-btn-next-text">التالي</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
          <button type="button" class="btn-tour-skip" id="btn-tour-skip">
            <span id="fatin-btn-skip-text">إنهاء الجولة</span>
          </button>
        </div>
      </div>

      <!-- Mascot Avatar Directly Beneath Speech Bubble -->
      <div class="fatin-widget-avatar-wrap" id="fatin-widget-avatar-wrap" title="فَطِن - اضغط للمتابعة">
        <img src="${POSE_PATH}greeting.webp?v=4" alt="فَطِن - المرشد التفاعلي" class="fatin-widget-avatar" id="fatin-widget-avatar" />
      </div>
    `;

    document.body.appendChild(widget);

    const nextBtn = document.getElementById('btn-tour-next');
    const skipBtn = document.getElementById('btn-tour-skip');
    const closeBtn = document.getElementById('btn-tour-close');
    const avatarWrap = document.getElementById('fatin-widget-avatar-wrap');

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isGreetingActive) {
          startIntroAndTour();
        } else {
          next();
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isGreetingActive) {
          dismissGreeting();
        } else {
          stopTour();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isGreetingActive) {
          dismissGreeting();
        } else {
          stopTour();
        }
      });
    }

    if (avatarWrap) {
      avatarWrap.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isGreetingActive) {
          startIntroAndTour();
        } else {
          next();
        }
      });
    }
  }

  function showLauncher() {
    const launcher = document.getElementById('fatin-floating-launcher');
    if (launcher) launcher.classList.add('visible');
  }

  function hideLauncher() {
    const launcher = document.getElementById('fatin-floating-launcher');
    if (launcher) launcher.classList.remove('visible');
  }

  /**
   * إظهار بالون الترحيب العائم عند الدخول لأول مرة مع نبذة موجزة
   */
  function showWelcomeGreeting() {
    createTourWidget();
    const widget = document.getElementById('fatin-tour-widget');
    if (!widget || isTourActive) return;

    isGreetingActive = true;
    introPhase = 0;
    hideLauncher();

    const stepBadge = document.getElementById('fatin-step-number');
    const titleEl = document.getElementById('fatin-step-title');
    const dialogueEl = document.getElementById('fatin-step-dialogue');
    const nextTextEl = document.getElementById('fatin-btn-next-text');
    const skipTextEl = document.getElementById('fatin-btn-skip-text');
    const avatarImg = document.getElementById('fatin-widget-avatar');

    if (stepBadge) stepBadge.innerHTML = 'نبذة عن إتقان 🌟';
    if (titleEl) titleEl.textContent = 'أهلاً بك في منصة إتقان! 🎓';
    if (dialogueEl) {
      dialogueEl.innerHTML = `
        <div style="font-size: 0.93rem; font-weight: 700; color: #1E3A8A; margin-bottom: 6px;">
          أنا «فَطِن»، رفيقك في إتقان المعرفة 👋
        </div>
        <div style="font-size: 0.86rem; color: #334155; line-height: 1.68;">
          منصة إتقان هي صرحكم الرائد للتعليم والتدريب التقني، وتأهيل المبرمجين عبر دورات عملية ومشاريع برمجية حقيقية متكاملة لسوق العمل.
        </div>
      `;
    }
    if (nextTextEl) {
      nextTextEl.innerHTML = '🔊 استمع للترحيب والنبذة';
    }
    if (skipTextEl) skipTextEl.textContent = 'تصفح بنفسك';

    if (avatarImg) {
      setAvatarPose(avatarImg, 'greeting.webp');
    }

    widget.classList.add('active');
    widget.classList.add('greeting-mode');
  }

  /**
   * إغلاق بالون الترحيب وحفظ عدم الإزعاج
   */
  function dismissGreeting() {
    sessionStorage.setItem('fatin_welcome_dismissed', '1');
    isGreetingActive = false;
    introPhase = 0;
    const widget = document.getElementById('fatin-tour-widget');
    if (widget) {
      widget.classList.remove('active');
      widget.classList.remove('greeting-mode');
    }
    showLauncher();
  }

  /**
   * 1. بدء الترحيب: "مرحبا أنا فطن"
   */
  function startIntroAndTour() {
    isGreetingActive = false;
    isTourActive = true;
    introPhase = 1;
    hideLauncher();

    const widget = document.getElementById('fatin-tour-widget');
    if (widget) {
      widget.classList.add('active');
      widget.classList.remove('greeting-mode');
    }

    const stepBadge = document.getElementById('fatin-step-number');
    const titleEl = document.getElementById('fatin-step-title');
    const dialogueEl = document.getElementById('fatin-step-dialogue');
    const nextTextEl = document.getElementById('fatin-btn-next-text');
    const skipTextEl = document.getElementById('fatin-btn-skip-text');
    const avatarWrap = document.getElementById('fatin-widget-avatar-wrap');
    const avatarImg = document.getElementById('fatin-widget-avatar');

    if (stepBadge) stepBadge.textContent = 'الترحيب 🦊';
    if (titleEl) titleEl.textContent = 'فَطِن يرحب بكم في إتقان';
    if (dialogueEl) dialogueEl.textContent = 'مرحبًا! أنا فَطِن، رفيقكم في إتقان المعرفة. يسعدني تواجدكم معنا في منصة إتقان!';
    if (nextTextEl) nextTextEl.textContent = 'نبذة عن المنصة 🌟';
    if (skipTextEl) skipTextEl.textContent = 'إنهاء الجولة';

    if (avatarImg) {
      setAvatarPose(avatarImg, 'greeting.webp');
    }

    const heroEl = document.getElementById('hero');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    }

    const introScenes = window.FatinIntroScenes || {};
    const scene1 = introScenes.greeting;

    if (scene1) {
      playSynchronizedScene(scene1, avatarWrap, avatarImg, () => {
        // بمجرد انتهاء التحية الصوتية، ينتقل فوراً للمرحلة الثانية: نبذة عن المنصة
        if (isTourActive && introPhase === 1) {
          playPlatformOverviewPhase();
        }
      });
    } else {
      playPlatformOverviewPhase();
    }
  }

  /**
   * 2. نبذة مبسطة وموجزة عن المنصة وما تقدمه من تعليم ومشاريع
   */
  function playPlatformOverviewPhase() {
    if (!isTourActive) return;
    introPhase = 2;

    const stepBadge = document.getElementById('fatin-step-number');
    const titleEl = document.getElementById('fatin-step-title');
    const dialogueEl = document.getElementById('fatin-step-dialogue');
    const nextTextEl = document.getElementById('fatin-btn-next-text');
    const skipTextEl = document.getElementById('fatin-btn-skip-text');
    const avatarWrap = document.getElementById('fatin-widget-avatar-wrap');
    const avatarImg = document.getElementById('fatin-widget-avatar');

    if (stepBadge) stepBadge.textContent = 'نبذة عن المنصة 🌟';
    if (titleEl) titleEl.textContent = 'رسالة وأهداف منصة إتقان';
    if (dialogueEl) {
      dialogueEl.innerHTML = '«<strong>منصة إتقان</strong> صرح تدريبي وتعليمي رائد، يهدف إلى تأهيلكم بالمهارات البرمجية والتقنية، وبناء مشاريع عملية حقيقية، وتحويل المعرفة النظرية إلى تطبيق عملي لسوق العمل.»';
    }
    if (nextTextEl) nextTextEl.textContent = 'استكشف الدورات 💻';
    if (skipTextEl) skipTextEl.textContent = 'إنهاء الجولة';

    if (avatarImg) {
      setAvatarPose(avatarImg, 'learning.webp');
    }

    const aboutScene = (window.FatinTour && window.FatinTour.about) ? window.FatinTour.about : null;
    if (aboutScene) {
      playSynchronizedScene(aboutScene, avatarWrap, avatarImg, () => {
        setTimeout(() => {
          if (isTourActive && introPhase === 2) {
            introPhase = 0;
            startTour(1); // الانتقال المباشر لقسم الدورات التدريبية
          }
        }, 550);
      });
    } else {
      setTimeout(() => {
        if (isTourActive && introPhase === 2) {
          introPhase = 0;
          startTour(1);
        }
      }, 3500);
    }
  }

  /**
   * ربط التفاعل مع أقسام الموقع
   */
  function attachSectionListeners() {
    if (typeof window.FatinTour === 'undefined') return;

    const sectionMap = {
      'about': window.FatinTour.about,
      'courses': window.FatinTour.courses,
      'services': window.FatinTour.services,
      'features': window.FatinTour.features,
      'how-it-works': window.FatinTour.registration,
      'contact': window.FatinTour.goodbye
    };

    Object.keys(sectionMap).forEach(secId => {
      const sectionEl = document.getElementById(secId);
      if (sectionEl) {
        const tag = sectionEl.querySelector('.section-tag');
        if (tag) {
          tag.style.cursor = 'pointer';
          tag.title = 'اضغط لسماع فَطِن يشرح هذا القسم 🦊';
          tag.addEventListener('click', (e) => {
            e.stopPropagation();
            showSpecificSection(sectionMap[secId]);
          });
        }
      }
    });
  }

  /**
   * بدء الجولة التفاعلية
   */
  function startTour(startIndex = 0) {
    if (typeof window.FatinTourSteps === 'undefined' || !window.FatinTourSteps.length) return;

    hideLauncher();
    isGreetingActive = false;
    introPhase = 0;
    isTourActive = true;
    currentStepIndex = startIndex;

    const widget = document.getElementById('fatin-tour-widget');
    if (widget) {
      widget.classList.add('active');
      widget.classList.remove('greeting-mode');
    }

    renderCurrentStep();
  }

  /**
   * عرض وتشغيل المشهد الحالي من الجولة
   */
  function renderCurrentStep() {
    if (typeof window.FatinTourSteps === 'undefined') return;
    const stepData = window.FatinTourSteps[currentStepIndex];
    if (!stepData) {
      stopTour();
      return;
    }

    const totalSteps = window.FatinTourSteps.length;
    const isLast = currentStepIndex >= totalSteps - 1;

    // 1. تحديث النصوص والشارة
    const dialogueCard = document.getElementById('fatin-tour-card');
    if (dialogueCard) {
      dialogueCard.classList.add('speech-fade');
      setTimeout(() => {
        dialogueCard.classList.remove('speech-fade');
      }, 100);
    }

    const stepBadge = document.getElementById('fatin-step-number');
    const titleEl = document.getElementById('fatin-step-title');
    const dialogueEl = document.getElementById('fatin-step-dialogue');
    const nextTextEl = document.getElementById('fatin-btn-next-text');
    const skipTextEl = document.getElementById('fatin-btn-skip-text');
    const avatarWrap = document.getElementById('fatin-widget-avatar-wrap');
    const avatarImg = document.getElementById('fatin-widget-avatar');

    if (stepBadge) stepBadge.textContent = `${currentStepIndex + 1} - ${totalSteps}`;
    if (titleEl) titleEl.textContent = stepData.title;
    if (dialogueEl) dialogueEl.textContent = stepData.message;
    if (nextTextEl) nextTextEl.textContent = isLast ? 'إنهاء الجولة 🦊' : 'التالي';
    if (skipTextEl) skipTextEl.textContent = isLast ? 'إغلاق' : 'إنهاء الجولة';

    // 2. التمرير السلس نحو القسم وإبرازه
    if (stepData.sectionId) {
      const targetEl = document.getElementById(stepData.sectionId);
      if (targetEl) {
        if (currentHighlightEl) {
          currentHighlightEl.classList.remove('fatin-section-highlight');
        }

        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        targetEl.classList.add('fatin-section-highlight');
        currentHighlightEl = targetEl;
      }
    }

    // 3. تشغيل الأداء الصوتي والحركي المتزامن للمشهد
    if (avatarImg) {
      setAvatarPose(avatarImg, stepData.pose);
    }

    playSynchronizedScene(stepData, avatarWrap, avatarImg, () => {
      // بعد انتهاء الصوت، العودة إلى وضعية الاستقرار
      if (avatarImg) {
        setAvatarPose(avatarImg, stepData.pose);
      }
    });
  }

  /**
   * إظهار شرح مخصص لقسم معين عند النقر المباشر
   */
  function showSpecificSection(sectionItem) {
    if (!sectionItem) return;
    const widget = document.getElementById('fatin-tour-widget');
    if (widget) widget.classList.add('active');

    const dialogueCard = document.getElementById('fatin-tour-card');
    if (dialogueCard) {
      dialogueCard.classList.add('speech-fade');
      setTimeout(() => {
        dialogueCard.classList.remove('speech-fade');
      }, 100);
    }

    const stepBadge = document.getElementById('fatin-step-number');
    const titleEl = document.getElementById('fatin-step-title');
    const dialogueEl = document.getElementById('fatin-step-dialogue');
    const nextTextEl = document.getElementById('fatin-btn-next-text');
    const skipTextEl = document.getElementById('fatin-btn-skip-text');
    const avatarWrap = document.getElementById('fatin-widget-avatar-wrap');
    const avatarImg = document.getElementById('fatin-widget-avatar');

    if (stepBadge) stepBadge.textContent = 'مرشد إتقان 🦊';
    if (titleEl) titleEl.textContent = sectionItem.title;
    if (dialogueEl) dialogueEl.textContent = sectionItem.message;
    if (nextTextEl) nextTextEl.textContent = 'جولة كاملة 🚀';
    if (skipTextEl) skipTextEl.textContent = 'إغلاق';

    if (avatarImg) {
      setAvatarPose(avatarImg, sectionItem.pose);
    }

    playSynchronizedScene(sectionItem, avatarWrap, avatarImg, () => {
      if (avatarImg) setAvatarPose(avatarImg, sectionItem.pose);
    });
  }

  /**
   * الانتقال للفقرة التالية
   */
  function next() {
    if (isGreetingActive) {
      startIntroAndTour();
      return;
    }
    if (introPhase === 1) {
      stopAudio();
      playPlatformOverviewPhase();
      return;
    }
    if (introPhase === 2) {
      stopAudio();
      introPhase = 0;
      startTour(1);
      return;
    }
    if (typeof window.FatinTourSteps === 'undefined') return;
    if (currentStepIndex < window.FatinTourSteps.length - 1) {
      currentStepIndex++;
      renderCurrentStep();
    } else {
      stopTour();
    }
  }

  /**
   * الانتقال للفقرة السابقة
   */
  function prev() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderCurrentStep();
    }
  }

  /**
   * إنهاء الجولة التفاعلية
   */
  function stopTour() {
    isTourActive = false;
    isGreetingActive = false;
    introPhase = 0;
    stopAudio();

    const widget = document.getElementById('fatin-tour-widget');
    if (widget) {
      widget.classList.remove('active');
      widget.classList.remove('greeting-mode');
    }

    if (currentHighlightEl) {
      currentHighlightEl.classList.remove('fatin-section-highlight');
      currentHighlightEl = null;
    }

    showLauncher();
  }

  /**
   * دعم مفاتيح لوحة المفاتيح
   */
  function attachKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (!isTourActive) return;

      if (e.key === 'Escape') {
        stopTour();
      } else if (e.key === 'ArrowLeft' || e.key === 'Enter') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          next();
        }
      } else if (e.key === 'ArrowRight') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          prev();
        }
      }
    });
  }

  return {
    initStandalonePage,
    initSiteTour,
    showWelcomeGreeting,
    startIntroAndTour,
    startTour,
    next,
    prev,
    stopTour,
    stopAudio
  };
})();

// تشغيل تلقائي آمن عند وجود صفحة الموقع الرئيسي أو باراميتر الجولة
if (typeof document !== 'undefined') {
  function autoInitFatin() {
    if (document.getElementById('fatin-standalone-page')) {
      // صفحة fatin.html المستقلة
      if (window.Fatin && typeof window.Fatin.initStandalonePage === 'function') {
        window.Fatin.initStandalonePage();
      }
    } else if (document.getElementById('btn-hero-cta-tour') || new URLSearchParams(window.location.search).has('tour')) {
      // صفحة index.html الرئيسية
      if (window.Fatin && typeof window.Fatin.initSiteTour === 'function') {
        window.Fatin.initSiteTour();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitFatin);
  } else {
    autoInitFatin();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.Fatin;
}
