function initHeroVideo() {
  const video = document.getElementById('hero-demo-video')
  const placeholder = document.querySelector('[data-hero-placeholder]')
  if (!video) return

  const hidePlaceholder = () => placeholder?.classList.add('is-hidden')
  const showPlaceholder = () => placeholder?.classList.remove('is-hidden')

  video.addEventListener('playing', hidePlaceholder)
  video.addEventListener('canplay', hidePlaceholder)
  video.addEventListener('error', showPlaceholder)
  video.addEventListener('emptied', showPlaceholder)

  const tryPlay = () => {
    if (document.hidden) return
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        showPlaceholder()
      })
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  if (prefersReducedMotion.matches) {
    video.pause()
    video.removeAttribute('autoplay')
    showPlaceholder()
    return
  }

  tryPlay()
  document.addEventListener('visibilitychange', tryPlay)
}

function initLegalDialogs() {
  const dialogs = {
    privacy: document.getElementById('dialog-privacy'),
    terms: document.getElementById('dialog-terms'),
  }

  document.querySelectorAll('[data-legal-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-legal-open')
      const dialog = dialogs[key]
      dialog?.showModal()
    })
  })

  document.querySelectorAll('[data-legal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('dialog')?.close()
    })
  })

  Object.values(dialogs).forEach((dialog) => {
    dialog?.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close()
    })
  })
}

function initTemplateLoop() {
  const loop = document.querySelector('[data-template-loop]')
  if (!loop) return

  const items = loop.querySelectorAll('[data-template-item]')
  if (items.length < 2) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (prefersReducedMotion.matches) return

  let index = 0
  window.setInterval(() => {
    items[index].classList.remove('is-active')
    index = (index + 1) % items.length
    items[index].classList.add('is-active')
  }, 2000)
}

document.getElementById('year').textContent = String(new Date().getFullYear())
if (window.lucide?.createIcons) {
  window.lucide.createIcons()
}
initHeroVideo()
initLegalDialogs()
initTemplateLoop()
