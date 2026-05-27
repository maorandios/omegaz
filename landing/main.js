const SLIDE_MS = 5000

function initHeroLoop() {
  const loop = document.querySelector('[data-hero-loop]')
  if (!loop) return

  const slides = loop.querySelectorAll('.phone__slide')
  const steps = document.querySelectorAll('.phone__step')
  let index = 0

  function show(next) {
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === next))
    steps.forEach((step, i) => step.classList.toggle('is-active', i === next))
    index = next
  }

  setInterval(() => {
    show((index + 1) % slides.length)
  }, SLIDE_MS)
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

document.getElementById('year').textContent = String(new Date().getFullYear())
initHeroLoop()
initLegalDialogs()
