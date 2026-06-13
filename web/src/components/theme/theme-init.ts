// Default theme is DARK (forge). Light only applies when the user has explicitly
// chosen it. A `?theme=light|dark` query-param overrides localStorage (used by
// the /preview-side for å vise begge tema samtidig). Runs before paint
// (beforeInteractive) so there's no flash.
export const themeInitScript = `(function(){try{var p=new URLSearchParams(location.search).get('theme');var t=p||localStorage.getItem('forge-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`
