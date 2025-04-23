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

async function loadAndSwapMainContent(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            window.location.href = url;
            return;
        }
        const text = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const newMainElement = doc.querySelector(mainContentSelector);
        const currentMainElement = document.querySelector(mainContentSelector);

        if (!newMainElement) {
            console.error(`Could not find new main element ('${mainContentSelector}') in fetched document for ${url}. Check page structure. Falling back.`);
            window.location.href = url;
            return;
        }
        if (!currentMainElement) {
            console.error(`Could not find current main element ('${mainContentSelector}') in current document. Check page structure. Falling back.`);
            window.location.href = url;
            return;
        }

        const newTitle = doc.querySelector('title')?.textContent;
        if (newTitle && document.title !== newTitle) {
            document.title = newTitle;
        }

        currentMainElement.replaceWith(newMainElement);

        if (typeof initFlowbite === 'function') {
            setTimeout(() => {
                initFlowbite();
                if (typeof initializeSidebar === 'function') initializeSidebar();
                if (typeof initializeThemeToggle === 'function') initializeThemeToggle();
            }, 50);
        }

        const pageInitScriptElement = doc.querySelector('#page-init-script');
        if (pageInitScriptElement) {
            const scriptToExecute = pageInitScriptElement.cloneNode(true);

            if (scriptToExecute.src && !scriptToExecute.textContent) {
                try {
                    const script = document.createElement('script');
                    try {
                        script.src = new URL(scriptToExecute.src, doc.baseURI || url).href;
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
                    } else {
                        // Dependency error already logged
                    }
                } catch (e) {
                    console.error("Error executing inline page-specific init script:", e);
                }
            }
        }

        if (window.location.href !== url) {
            history.pushState({}, '', url);
            previousUrl = url;
        } else {
            previousUrl = url;
        }

        updateSidebarActiveState(url);

    } catch (error) {
        console.error('Error during loadAndSwapMainContent:', error);
        window.location.href = url;
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

    if (!document.startViewTransition) {
        await loadAndSwapMainContent(url);
        return;
    }

    try {
        await document.startViewTransition(async () => {
            await loadAndSwapMainContent(url);
        });
    } catch (error) {
        console.error("View Transition failed:", error);
        window.location.href = url;
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

                if (isActive) {
                    menuItem.classList.add('sidebar-active');

                    const submenu = menuItem.closest('.submenu-click');
                    if (submenu && !submenu.classList.contains('open')) {
                        const parentMenuItem = submenu.closest('.menu-item.menu-item-hover');
                        const triggerLink = parentMenuItem?.querySelector('a:not([href^="#"]):not([href=""])');
                        if (triggerLink && !parentMenuItem.classList.contains('submenu-open')) {
                            // Potentially trigger click or add class here if needed for auto-expansion
                            // triggerLink.click();
                            // parentMenuItem.classList.add('submenu-open');
                        }
                    }
                } else {
                    menuItem.classList.remove('sidebar-active');
                }
            } catch (e) {
                console.warn(`Could not parse link href: ${link.href}`, e);
                menuItem.classList.remove('sidebar-active');
            }
        });
    } catch (e) {
        console.error(`Could not parse current URL: ${currentUrlString}`, e);
        sidebarLinks.forEach(link => {
            const menuItem = link.closest('.menu-item');
            if (menuItem) menuItem.classList.remove('sidebar-active');
        });
    }
}

document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');

    if (link && link.href && link.origin === window.location.origin) {
        const url = link.href;

        if (link.closest('#profileDropdown') || link.closest('.submenu-click') || link.closest('.menu-hover-area')) {
            if (link.closest('.submenu-click a') && link.href !== '#') {
                // Allow submenu page links
            } else {
                // Ignore clicks on toggles/non-page links within these areas
                return;
            }
        }

        if (url === window.location.href && !link.hash) {
            e.preventDefault();
            return;
        }

        if (link.hasAttribute('data-no-spa') || link.getAttribute('target') === '_blank') {
            return;
        }

        e.preventDefault();
        await handleNavigation(url);
    }
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
        } else {
            console.warn(`Pageswap: Could not find '${mainContentSelector}' to assign transition name.`);
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
    if (typeof initFlowbite === 'function') {
        initFlowbite();
    }
    if (typeof initializeSidebar === 'function') {
        initializeSidebar();
    }
    if (typeof initializeThemeToggle === 'function') {
        initializeThemeToggle();
    }

    previousUrl = window.location.href;
    updateSidebarActiveState(previousUrl);
});