// One small toast for the journey screens, kept outside React so any animation step can call it.
let el: HTMLDivElement | null = null
let timer = 0

export function toast(html: string) {
  if (!el) {
    el = document.createElement('div')
    el.className = 'j-toast'
    el.setAttribute('role', 'status')
    document.body.appendChild(el)
  }
  el.innerHTML = html
  el.classList.add('on')
  clearTimeout(timer)
  timer = window.setTimeout(() => el?.classList.remove('on'), 2400)
}
