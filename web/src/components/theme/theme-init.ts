// Default theme is DARK (forge). Light only applies when the user has explicitly
// chosen it. Runs before paint (beforeInteractive) so there's no flash.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('forge-theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`
