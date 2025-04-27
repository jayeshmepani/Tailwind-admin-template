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


// view-transition
const mainContentSelector = '#main-content > main';
const sidebarSelector = '#sidebar';
const mainContentTransitionName = 'main-area-transition';
const sidebarTransitionName = 'sidebar-transition';

let lastClick = null;
let previousUrl = window.location.href;
let isNavigating = false;

function getElementOuterHeight(el) {
    if (!el) return 0;
    const style = window.getComputedStyle(el);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return el.offsetHeight + marginTop + marginBottom;
}

function updateSidebarHeight() {
    const sidebarElement = document.querySelector(sidebarSelector);
    if (!sidebarElement) {
        return;
    }

    setTimeout(() => {
        try {
            let maxHeight = document.documentElement.scrollHeight;
            maxHeight = Math.max(maxHeight, window.innerHeight);
            sidebarElement.style.height = maxHeight + 'px';
        } catch (error) {
            console.error("Error calculating or setting sidebar height:", error);
        }
    }, 100);
}


function updateSidebarActiveState(currentUrlString) {
    const sidebarLinks = document.querySelectorAll(`${sidebarSelector} a`);
    if (!sidebarLinks.length) return;

    try {
        const currentUrlObj = new URL(currentUrlString);
        const currentPath = currentUrlObj.pathname;
        const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath + 'index.html' : currentPath.replace(/\/index\.html$/, '');

        sidebarLinks.forEach(link => {
            const menuItem = link.closest('.menu-item');
            if (!menuItem) return;

            const rawHref = link.getAttribute('href');
            if (rawHref === null || rawHref.trim() === '' || rawHref.startsWith('#') || rawHref.toLowerCase().startsWith('javascript:')) {
                menuItem.classList.remove('sidebar-active');
                return;
            }

            try {
                const linkUrl = new URL(link.href);
                const linkPath = linkUrl.pathname;
                const normalizedLinkPath = linkPath.endsWith('/') ? linkPath + 'index.html' : linkPath.replace(/\/index\.html$/, '');

                let isActive = (link.href === currentUrlString) || (normalizedLinkPath === normalizedCurrentPath);

                if (isActive) {
                    menuItem.classList.add('sidebar-active');
                    const submenu = menuItem.closest('.submenu-click');
                    if (submenu && !submenu.classList.contains('open')) {
                        // Optional: Logic to open submenu
                    }
                } else {
                    menuItem.classList.remove('sidebar-active');
                }
            } catch (e) {
                menuItem.classList.remove('sidebar-active');
            }
        });
    } catch (e) {
        console.error(`Could not parse current URL for active state: ${currentUrlString}`, e);
        sidebarLinks.forEach(link => {
            const menuItem = link.closest('.menu-item');
            if (menuItem) menuItem.classList.remove('sidebar-active');
        });
    }
}


async function loadAndSwapContent(url) {
    try {
        const resp = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!resp.ok || resp.redirected || (new URL(resp.url)).origin !== window.location.origin) {
            window.location.href = url;
            return;
        }

        const text = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const newMainElement = doc.querySelector(mainContentSelector);
        const newSidebarElement = doc.querySelector(sidebarSelector);
        const newTitle = doc.querySelector('title')?.textContent;

        const currentMainElement = document.querySelector(mainContentSelector);
        const currentSidebarElement = document.querySelector(sidebarSelector);

        if (!newMainElement) {
            console.error(`Could not find NEW main content ('${mainContentSelector}') in fetched ${url}. Falling back.`);
            window.location.href = url;
            return;
        }
        if (!newSidebarElement) {
            console.warn(`Could not find NEW sidebar ('${sidebarSelector}') in fetched ${url}. Proceeding without sidebar swap.`);
        }
        if (!currentMainElement) {
            console.error(`Could not find CURRENT main content ('${mainContentSelector}'). Check page structure. Falling back.`);
            window.location.href = url;
            return;
        }
        if (!currentSidebarElement && newSidebarElement) {
            console.warn(`Current page missing sidebar ('${sidebarSelector}'), but new page has one. Structure mismatch?`);
        }

        newMainElement.style.viewTransitionName = mainContentTransitionName;
        if (newSidebarElement) {
            newSidebarElement.style.viewTransitionName = sidebarTransitionName;
        }

        if (newTitle && document.title !== newTitle) {
            document.title = newTitle;
        }

        currentMainElement.replaceWith(newMainElement);
        if (currentSidebarElement && newSidebarElement) {
            currentSidebarElement.replaceWith(newSidebarElement);
        } else if (!newSidebarElement && currentSidebarElement) {
            currentSidebarElement.remove();
        }

        setTimeout(() => {
            if (typeof initFlowbite === 'function') {
                initFlowbite();
            }
            if (typeof initializeSidebar === 'function') {
                initializeSidebar();
            }
            if (typeof initializeThemeToggle === 'function') {
                initializeThemeToggle();
            }
        }, 150);

        const pageInitScriptElement = doc.querySelector('#page-init-script');
        if (pageInitScriptElement) {
            executePageScript(pageInitScriptElement, doc, url);
        }

        if (window.location.href !== url) {
            history.pushState({ source: 'custom-spa' }, '', url);
            previousUrl = url;
        } else {
            previousUrl = url;
        }

        updateSidebarActiveState(url);
        updateSidebarHeight();

    } catch (error) {
        console.error('Error during loadAndSwapContent:', error);
        window.location.href = url;
    } finally {
        isNavigating = false;
    }
}

async function executePageScript(scriptElement, fetchedDoc, baseUrl) {
    const scriptToExecute = scriptElement.cloneNode(true);

    if (scriptToExecute.src && !scriptToExecute.textContent) {
        try {
            const script = document.createElement('script');
            try {
                script.src = new URL(scriptToExecute.src, fetchedDoc.baseURI || baseUrl).href;
            } catch (urlError) {
                console.warn("Could not resolve script src URL, using original:", scriptToExecute.src, urlError);
                script.src = scriptToExecute.src;
            }
            if (scriptToExecute.type) script.type = scriptToExecute.type;
            script.async = false;

            document.body.appendChild(script);

            script.onload = () => { };
            script.onerror = () => console.error('Error loading dynamically added script:', script.src);

        } catch (e) {
            console.error("Error creating/appending dynamic external script tag:", e);
        }
    }
    else if (scriptToExecute.textContent) {
        try {
            let dependencyError = false;
            const scriptContent = scriptToExecute.textContent;
            if (scriptContent.includes('$') && typeof $ === 'undefined') { dependencyError = true; console.error("Dependency Error: jQuery ($) not defined for inline script."); }
            if (scriptContent.includes('new TableComponent') && typeof TableComponent === 'undefined') { dependencyError = true; console.error("Dependency Error: TableComponent not defined for inline script."); }
            if (scriptContent.includes('ApexCharts') && typeof ApexCharts === 'undefined') { dependencyError = true; console.error("Dependency Error: ApexCharts not defined for inline script."); }
            if (scriptContent.includes('toastr') && typeof toastr === 'undefined') { dependencyError = true; console.error("Dependency Error: toastr not defined for inline script."); }

            if (!dependencyError) {
                const script = document.createElement('script');
                script.textContent = `try { ${scriptContent.trim()} } catch(e) { console.error('Error executing inline page script:', e); }`;
                document.body.appendChild(script);
                document.body.removeChild(script);
            } else {
                // Error already logged
            }
        } catch (e) {
            console.error("Error executing inline page-specific init script:", e);
        }
    }
}


async function handleNavigation(url) {
    if (isNavigating) {
        console.warn("Navigation already in progress, ignoring request for:", url);
        return;
    }

    const currentUrlObj = new URL(window.location.href);
    const targetUrlObj = new URL(url);

    if (currentUrlObj.origin === targetUrlObj.origin &&
        currentUrlObj.pathname === targetUrlObj.pathname &&
        currentUrlObj.search === targetUrlObj.search) {
        if (currentUrlObj.hash !== targetUrlObj.hash) {
            if (window.location.href !== url) {
                history.pushState({ source: 'custom-spa-hash' }, '', url);
                previousUrl = url;
            }
            if (targetUrlObj.hash) {
                const element = document.querySelector(targetUrlObj.hash);
                element?.scrollIntoView({ behavior: 'smooth' });
            }
        }
        return;
    }

    if (targetUrlObj.origin !== window.location.origin) {
        window.location.href = url;
        return;
    }

    isNavigating = true;

    if (document.startViewTransition) {
        const currentMain = document.querySelector(mainContentSelector);
        const currentSidebar = document.querySelector(sidebarSelector);
        if (currentMain) currentMain.style.viewTransitionName = mainContentTransitionName;
        if (currentSidebar) currentSidebar.style.viewTransitionName = sidebarTransitionName;

        try {
            const transition = document.startViewTransition(async () => {
                await loadAndSwapContent(url);
            });

            transition.finished.then(() => {
                const newMain = document.querySelector(mainContentSelector);
                const newSidebar = document.querySelector(sidebarSelector);
                if (newMain) newMain.style.viewTransitionName = '';
                if (newSidebar) newSidebar.style.viewTransitionName = '';
            }).catch(error => {
                console.error("View Transition finished with error:", error);
                if (isNavigating) {
                    window.location.href = url;
                    isNavigating = false;
                }
            });

        } catch (error) {
            console.error("View Transition initiation failed:", error);
            const currentMain = document.querySelector(mainContentSelector);
            const currentSidebar = document.querySelector(sidebarSelector);
            if (currentMain) currentMain.style.viewTransitionName = '';
            if (currentSidebar) currentSidebar.style.viewTransitionName = '';
            window.location.href = url;
            isNavigating = false;
        }
    } else {
        await loadAndSwapContent(url);
    }
}


document.addEventListener('click', e => {
    lastClick = { x: e.clientX, y: e.clientY };
}, { passive: true });


document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');

    if (!link || !link.href) {
        return;
    }

    if (link.hasAttribute('data-no-spa') ||
        link.getAttribute('target') === '_blank' ||
        !['http:', 'https:', ''].includes(link.protocol) ||
        link.origin !== window.location.origin ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return;
    }

    if (link.closest('#profileDropdown') || link.closest('.menu-hover-area')) {
        if (link.getAttribute('href') === '#' || link.protocol === 'javascript:') {
            return;
        }
    }
    if (link.closest('.submenu-click')) {
        if (link.getAttribute('href') === '#' || link.protocol === 'javascript:') {
            return;
        }
    }

    const url = link.href;
    const currentUrlObj = new URL(window.location.href);
    const targetUrlObj = new URL(url);
    if (currentUrlObj.pathname === targetUrlObj.pathname && currentUrlObj.search === targetUrlObj.search && !targetUrlObj.hash) {
        // e.preventDefault();
        console.log("Ignoring click on same URL (no hash change).");
        return;
    }

    // e.preventDefault();
    await handleNavigation(url);
});


window.addEventListener('popstate', async (event) => {
    const currentUrl = window.location.href;
    if (currentUrl !== previousUrl) {
        console.log(`Popstate detected: Navigating to ${currentUrl}`);
        await handleNavigation(currentUrl);
    }
});


if (!window.pageSwapListenerAdded) {
    window.addEventListener('pageswap', (e) => {
        if (!e.viewTransition) return;
        try {
            const mainElement = document.querySelector(mainContentSelector);
            const sidebarElement = document.querySelector(sidebarSelector);
            if (mainElement) mainElement.style.viewTransitionName = mainContentTransitionName;
            if (sidebarElement) sidebarElement.style.viewTransitionName = sidebarTransitionName;
        } catch (error) {
            console.error("Error setting transition names on pageswap:", error);
        }
    });
    window.pageSwapListenerAdded = true;
}

if (!window.pageRevealListenerAdded) {
    window.addEventListener('pagereveal', async (e) => {
        if (!e.viewTransition) return;
        try {
            await e.viewTransition.ready;
            updateSidebarActiveState(window.location.href);
            updateSidebarHeight();
        } catch (error) {
            console.error("Error during pagereveal viewTransition ready:", error);
        }
    });
    window.pageRevealListenerAdded = true;
}


document.addEventListener('DOMContentLoaded', () => {
    previousUrl = window.location.href;

    if (typeof initFlowbite === 'function') {
        initFlowbite();
    }
    if (typeof initializeSidebar === 'function') {
        initializeSidebar();
    }
    if (typeof initializeThemeToggle === 'function') {
        initializeThemeToggle();
    }

    updateSidebarActiveState(previousUrl);
    updateSidebarHeight();
});

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateSidebarHeight, 250);
});

console.log("SPA Navigation Enhancements Initialized.");