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
let lastClick = null;
document.addEventListener('click', e => lastClick = { x: e.clientX, y: e.clientY });

let previousUrl = window.location.href;
const mainContentSelector = '#main-content > main';
const mainContentTransitionName = 'main-area-transition';

function executePageInitScript(scriptElement, baseDocUrl) {
    if (!scriptElement) return;

    const scriptToExecute = scriptElement.cloneNode(true);

    if (scriptToExecute.src && !scriptToExecute.textContent) {
        try {
            const script = document.createElement('script');
            try {
                script.src = new URL(scriptToExecute.src, baseDocUrl).href;
            } catch (urlError) {
                script.src = scriptToExecute.src;
            }
            if (scriptToExecute.type) script.type = scriptToExecute.type;
            script.async = false;
            script.onload = () => { };
            script.onerror = () => console.error('Error loading dynamically added script:', script.src);
            document.body.appendChild(script);
        } catch (e) {
            console.error("Error creating/appending dynamic external script tag:", e);
        }
    } else if (scriptToExecute.textContent) {
        try {
            let dependencyError = false;
            const scriptContent = scriptToExecute.textContent;
            if (scriptContent.includes('$') && typeof $ === 'undefined') { dependencyError = true; console.error("Dependency Error: jQuery ($) not defined for inline script."); }
            if (scriptContent.includes('new TableComponent') && typeof TableComponent === 'undefined') { dependencyError = true; console.error("Dependency Error: TableComponent not defined for inline script."); }
            if (scriptContent.includes('ApexCharts') && typeof ApexCharts === 'undefined') { dependencyError = true; console.error("Dependency Error: ApexCharts not defined for inline script."); }
            if (scriptContent.includes('toastr') && typeof toastr === 'undefined') { dependencyError = true; console.error("Dependency Error: toastr not defined for inline script."); }

            if (!dependencyError) {
                const script = document.createElement('script');
                script.textContent = scriptContent.trim();
                document.body.appendChild(script);
                document.body.removeChild(script);
            }
        } catch (e) {
            console.error("Error executing inline page-specific init script:", e);
        }
    }
}

function runInitializationFunctions() {
    if (typeof initFlowbite === 'function') {
        try {
            setTimeout(() => {
                initFlowbite();
                if (typeof initializeThemeToggle === 'function') initializeThemeToggle();
            }, 50);
        } catch (e) {
            console.error("Error running initialization functions (Flowbite, Theme Toggle):", e);
        }
    } else {
        if (typeof initializeThemeToggle === 'function') initializeThemeToggle();
    }
}

async function fetchPageData(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            return { success: false, error: `Fetch failed with status ${resp.status}` };
        }
        const text = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const newMainElement = doc.querySelector(mainContentSelector);
        const newTitle = doc.querySelector('title')?.textContent;
        const pageInitScriptElement = doc.querySelector('#page-init-script');

        if (!newMainElement) {
            return { success: false, error: `Could not find new main element ('${mainContentSelector}') in fetched document for ${url}.` };
        }

        return { success: true, newMainElement, newTitle, pageInitScriptElement, baseDocUrl: doc.baseURI || url };

    } catch (error) {
        return { success: false, error: `Error during fetchPageData: ${error}` };
    }
}

async function handleNavigation(url) {
    const currentUrlObj = new URL(window.location.href);
    const targetUrlObj = new URL(url);

    if (currentUrlObj.origin === targetUrlObj.origin && currentUrlObj.pathname === targetUrlObj.pathname && currentUrlObj.search === targetUrlObj.search) {
        if (currentUrlObj.hash === targetUrlObj.hash || !targetUrlObj.hash) {
            return;
        }
        if (window.location.href !== url) {
            history.pushState({}, '', url);
            previousUrl = url;
        }
        if (targetUrlObj.hash) {
            const element = document.querySelector(targetUrlObj.hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        return;
    }

    let pageData = null;
    let swapSuccess = false;

    const updateDOM = (data) => {
        const currentMainElement = document.querySelector(mainContentSelector);
        if (!currentMainElement) {
            console.error(`Could not find current main element ('${mainContentSelector}') in current document. Check page structure.`);
            return false;
        }
        currentMainElement.replaceWith(data.newMainElement);
        if (data.newTitle && document.title !== data.newTitle) {
            document.title = data.newTitle;
        }
        if (window.location.href !== url) {
            history.pushState({}, '', url);
            previousUrl = url;
        } else {
            previousUrl = url;
        }
        updateSidebarActiveState(url);
        return true;
    };

    const performPostTransitionUpdates = (data) => {
        runInitializationFunctions();
        executePageInitScript(data.pageInitScriptElement, data.baseDocUrl);

        setTimeout(() => {
            if (typeof window.updateSidebarHeightWithOriginalLogic === 'function') {
                window.updateSidebarHeightWithOriginalLogic();
            }
        }, 100);

        const targetUrlObjForScroll = new URL(data.baseDocUrl);
        if (!targetUrlObjForScroll.hash) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        } else {
            const element = document.querySelector(targetUrlObjForScroll.hash);
            if (element) {
                setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 150);
            }
        }
    };

    if (!document.startViewTransition) {
        pageData = await fetchPageData(url);
        if (pageData.success) {
            swapSuccess = updateDOM(pageData);
            if (swapSuccess) {
                performPostTransitionUpdates(pageData);
            } else {
                window.location.href = url;
            }
        } else {
            console.error(pageData.error + " Falling back to full navigation.");
            window.location.href = url;
        }
        return;
    }

    try {
        const transition = document.startViewTransition(async () => {
            pageData = await fetchPageData(url);
            if (pageData.success) {
                swapSuccess = updateDOM(pageData);
                if (!swapSuccess) {
                    window.location.href = url;
                    throw new Error("Current main element missing during transition update.");
                }
            } else {
                console.error(pageData.error + " Falling back to full navigation.");
                window.location.href = url;
                throw new Error("Fetch or parse failed during transition update.");
            }
        });

        await transition.finished;

        if (swapSuccess && pageData?.success) {
            performPostTransitionUpdates(pageData);
        }

    } catch (error) {
        console.error("View Transition failed:", error);
        if (window.location.href !== url) {
            window.location.href = url;
        }
    }
}

function updateSidebarActiveState(currentUrlString) {
    const sidebarLinks = document.querySelectorAll('#sidebar a');
    try {
        const currentUrlObj = new URL(currentUrlString);
        const currentPath = currentUrlObj.pathname;

        sidebarLinks.forEach(link => {
            const menuItem = link.closest('.menu-item');
            if (!menuItem) return;

            const rawHref = link.getAttribute('href');

            if (rawHref === null || rawHref.trim() === '' || rawHref.startsWith('#') || rawHref.toLowerCase().startsWith('javascript:')) {
                menuItem.classList.remove('sidebar-active');
                return;
            }

            try {
                const linkUrl = new URL(link.href, document.baseURI);
                const linkPath = linkUrl.pathname;

                let isActive = (linkPath === currentPath);
                isActive = isActive || (linkPath === '/' && currentPath.endsWith('/index.html'));
                isActive = isActive || (currentPath === '/' && linkPath.endsWith('/index.html'));
                isActive = isActive || (currentPath.endsWith('/') && linkPath === currentPath + 'index.html');
                isActive = isActive || (linkPath.endsWith('/') && currentPath === linkPath + 'index.html');

                if (isActive) {
                    menuItem.classList.add('sidebar-active');
                } else {
                    menuItem.classList.remove('sidebar-active');
                }
            } catch (e) {
                console.warn(`Could not parse link href for sidebar state: ${link.href}`, e);
                menuItem.classList.remove('sidebar-active');
            }
        });
    } catch (e) {
        console.error(`Could not parse current URL for sidebar state: ${currentUrlString}`, e);
        sidebarLinks.forEach(link => {
            const menuItem = link.closest('.menu-item');
            if (menuItem) menuItem.classList.remove('sidebar-active');
        });
    }
}

document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');

    if (!link || !link.href) return;
    if (link.origin !== window.location.origin) return;

    if (link.closest('#profileDropdown') || link.closest('.menu-hover-area') || link.closest('.submenu-click > a[href="#"]')) {
        if (link.closest('#profileDropdown') && link.origin === window.location.origin && !link.hasAttribute('data-no-spa') && link.getAttribute('target') !== '_blank') {
        }
        else if (link.closest('.submenu-click > a[href="#"]')) {
            return;
        }
        else if (link.closest('.submenu-click') && link.href !== '#' && link.origin === window.location.origin && !link.hasAttribute('data-no-spa') && link.getAttribute('target') !== '_blank') {
        }
        else {
            return;
        }
    }

    const url = link.href;

    if (url === window.location.href && !link.hash) {
        e.preventDefault();
        return;
    }

    if (link.hasAttribute('data-no-spa') || link.getAttribute('target') === '_blank') {
        return;
    }

    e.preventDefault();
    await handleNavigation(url);
});

window.addEventListener('popstate', async (event) => {
    const currentUrl = window.location.href;
    if (currentUrl !== previousUrl) {
        await handleNavigation(currentUrl);
    }
});

if (!window.pageSwapListenerAdded) {
    window.addEventListener('pageswap', e => {
        if (!e.viewTransition) return;
        const mainElement = document.querySelector(mainContentSelector);
        if (mainElement) {
            mainElement.style.viewTransitionName = mainContentTransitionName;
        }
    });
    window.pageSwapListenerAdded = true;
}

if (!window.pageRevealListenerAdded) {
    window.addEventListener('pagereveal', e => {
        if (!e.viewTransition) return;
        e.viewTransition.ready.then(() => {
            const mainElement = document.querySelector(mainContentSelector);
            if (mainElement) mainElement.style.viewTransitionName = '';
        });
    });
    window.pageRevealListenerAdded = true;
}

document.addEventListener('DOMContentLoaded', () => {
    runInitializationFunctions();
    previousUrl = window.location.href;
    updateSidebarActiveState(previousUrl);
});