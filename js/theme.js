//theme-switch script
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
            if (themeToggle) themeToggle.checked = true;
        } else {
            htmlElement.classList.remove('dark');
            if (themeToggle) themeToggle.checked = false;
        }
    };

    let currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                currentTheme = 'dark';
            } else {
                currentTheme = 'light';
            }
            localStorage.setItem('theme', currentTheme);
            applyTheme(currentTheme);
        });
    }
});


//view-transition script
let lastClick = null;
document.addEventListener('click', e => lastClick = { x: e.clientX, y: e.clientY });

let previousUrl = window.location.href;

async function loadAndSwapMain(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            console.error(`Failed to fetch ${url}: ${resp.statusText}`);
            window.location.href = url;
            return;
        }
        const text = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const newMainContainer = doc.querySelector('#main-content');
        const currentMainContainer = document.querySelector('#main-content');

        if (!newMainContainer || !currentMainContainer) {
            console.error('Could not find #main-content container.');
            window.location.href = url;
            return;
        }

        const newMain = newMainContainer.querySelector('main');
        const currentMain = currentMainContainer.querySelector('main');

        if (!newMain || !currentMain) {
            console.error('Could not find <main> element.');
            window.location.href = url;
            return;
        }

        currentMain.replaceWith(newMain);

        if (typeof initFlowbite === 'function') {
            initFlowbite();
        }

        const pageInitScriptElement = doc.querySelector('#page-init-script');

        if (pageInitScriptElement) {
            if (pageInitScriptElement.src && !pageInitScriptElement.textContent) {
                try {
                    const script = document.createElement('script');
                    try {
                        script.src = new URL(pageInitScriptElement.src, doc.baseURI || url).href;
                    } catch (urlError) {
                        console.error("Error constructing absolute URL for script, falling back to original src:", pageInitScriptElement.src, urlError);
                        script.src = pageInitScriptElement.src;
                    }

                    if (pageInitScriptElement.type) {
                        script.type = pageInitScriptElement.type;
                    }
                    script.async = false;

                    script.onload = () => {
                        if (typeof initFlowbite === 'function') {
                            setTimeout(() => { initFlowbite(); }, 50);
                        }
                    };
                    script.onerror = () => {
                        console.error('Error loading dynamically added script:', script.src);
                    };

                    document.body.appendChild(script);
                    // Optionally remove the script tag after loading if it causes issues, but usually not needed for external scripts
                    // document.body.removeChild(script) might remove before execution completes

                } catch (e) {
                    console.error("Error creating/appending dynamic script tag:", e);
                }
            } else if (pageInitScriptElement.textContent) {
                try {
                    let dependencyError = false;
                    if (pageInitScriptElement.textContent.includes('$') && typeof $ === 'undefined') {
                        console.error("jQuery ($) not defined for inline script execution.");
                        dependencyError = true;
                    }
                    if (pageInitScriptElement.textContent.includes('new TableComponent') && typeof TableComponent === 'undefined') {
                        console.error("TableComponent not defined for inline script execution.");
                        dependencyError = true;
                    }
                    if (pageInitScriptElement.textContent.includes('ApexCharts') && typeof ApexCharts === 'undefined') {
                        console.error("ApexCharts not defined for inline script execution.");
                        dependencyError = true;
                    }
                    if (pageInitScriptElement.textContent.includes('toastr') && typeof toastr === 'undefined') {
                        console.error("toastr not defined for inline script execution.");
                        dependencyError = true;
                    }

                    if (!dependencyError) {
                        const scriptContent = pageInitScriptElement.textContent.trim();
                        const script = document.createElement('script');
                        script.textContent = scriptContent;

                        document.body.appendChild(script);
                        document.body.removeChild(script); // Clean up inline script execution tag

                        if (typeof initFlowbite === 'function') {
                            setTimeout(() => { initFlowbite(); }, 50);
                        }
                    }
                } catch (e) {
                    console.error("Error executing inline page-specific init script:", e);
                }
            }
        } else {
            // No #page-init-script found, maybe re-init flowbite just in case? (Already done above)
            // if (typeof initFlowbite === 'function') { initFlowbite(); }
        }

        if (window.location.href !== url) {
            history.pushState({}, '', url);
            previousUrl = url;
        }

    } catch (error) {
        console.error('Error during loadAndSwapMain:', error);
        window.location.href = url;
    }
}

document.querySelectorAll('#sidebar a[href$=".html"], a.internal-link').forEach(link => {
    if (link.origin !== window.location.origin) {
        return;
    }
    link.addEventListener('click', async e => {
        const url = link.href;
        if (url === window.location.href) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        if (!document.startViewTransition) {
            await loadAndSwapMain(url);
            return;
        }
        await document.startViewTransition(async () => {
            await loadAndSwapMain(url);
        });
    });
});

window.addEventListener('popstate', async (event) => {
    const currentUrl = window.location.href;
    if (currentUrl !== previousUrl) {
        if (document.startViewTransition) {
            await document.startViewTransition(async () => {
                await loadAndSwapMain(currentUrl);
            });
        } else {
            await loadAndSwapMain(currentUrl);
        }
        previousUrl = currentUrl;
    }
});

if (!window.pageSwapListenerAdded) {
    window.addEventListener('pageswap', e => {
        if (!e.viewTransition) return;
        const mainElement = document.querySelector('#main-content > main');
        if (mainElement) {
            mainElement.style.viewTransitionName = 'main-content-transition';
        }
    });
    window.pageSwapListenerAdded = true;
}
if (!window.pageRevealListenerAdded) {
    window.addEventListener('pagereveal', e => {
        if (!e.viewTransition) return;
        e.viewTransition.ready.then(() => {
            const mainElement = document.querySelector('#main-content > main');
            if (mainElement) {
                // Optionally clear name after transition
                // mainElement.style.viewTransitionName = '';
            }
        });
    });
    window.pageRevealListenerAdded = true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initFlowbite === 'function') {
        initFlowbite();
    }
    previousUrl = window.location.href;
});