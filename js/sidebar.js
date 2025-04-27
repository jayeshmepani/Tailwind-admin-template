function updateSidebarHeightWithOriginalLogic() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) {
        return;
    }

    if (window.innerWidth < 768) {
        function getMaxHeight(el) {
            const style = window.getComputedStyle(el);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            if (el && typeof el.offsetHeight !== 'undefined') {
                return el.offsetHeight + marginTop + marginBottom;
            }
            return 0;
        }

        const allElements = document.querySelectorAll('*');
        let maxHeight = 0;

        allElements.forEach(el => {
            const outerHeight = getMaxHeight(el);
            if (outerHeight > maxHeight) {
                maxHeight = outerHeight;
            }
        });

        const htmlOuterHeight = getMaxHeight(document.documentElement);
        if (htmlOuterHeight > maxHeight) {
            maxHeight = htmlOuterHeight;
        }
        sidebar.style.height = maxHeight + 'px';
    } else {
        // On larger screens, remove inline height to let CSS control it
        sidebar.style.height = '';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const desktopMenuToggle = document.getElementById("desktopMenuToggle");
    const sidebar = document.getElementById("sidebar");

    if (!mobileMenuToggle || !desktopMenuToggle || !sidebar) {
        return;
    }

    let isSidebarCollapsed = false;
    const mobileToggleIcon = mobileMenuToggle.querySelector('.mobile-toggle-icon');
    const menuIcon = mobileToggleIcon?.querySelector('.menu-icon');
    const closeIcon = mobileToggleIcon?.querySelector('.close-icon');

    function toggleSidebarMobile() {
        if (!sidebar || !menuIcon || !closeIcon || !mobileToggleIcon) return;
        const isSidebarHidden = sidebar.style.width === '0px' || sidebar.style.width === '';
        sidebar.style.width = isSidebarHidden ? '15rem' : '0px';
        menuIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
        mobileToggleIcon.classList.toggle('mobile-toggle-active');
        setTimeout(updateSidebarHeightWithOriginalLogic, 50);
    }

    function toggleSidebarDesktop() {
        if (!sidebar || !desktopMenuToggle) return;
        isSidebarCollapsed = !isSidebarCollapsed;
        sidebar.classList.toggle("collapsed", isSidebarCollapsed);
        const toggleIcon = desktopMenuToggle.querySelector('svg');
        if (toggleIcon) {
            toggleIcon.innerHTML = isSidebarCollapsed
                ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>`
                : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>`;
        }
        // Apply width change immediately for consistency with resize
        if (window.innerWidth >= 768) {
            sidebar.style.width = isSidebarCollapsed ? '4rem' : '15rem';
        }
        setTimeout(updateSidebarHeightWithOriginalLogic, 50);
    }

    mobileMenuToggle.addEventListener("click", toggleSidebarMobile);
    desktopMenuToggle.addEventListener("click", toggleSidebarDesktop);

    document.querySelectorAll('#sidebar .menu-item-hover > a').forEach(menuButton => {
        menuButton.addEventListener('click', (e) => {
            const currentSidebar = document.getElementById('sidebar');
            if (!currentSidebar) return;

            if (!currentSidebar.classList.contains('collapsed')) {
                e.preventDefault();
                const submenu = menuButton.closest('.menu-item-hover')?.querySelector('.submenu-click');
                const arrow = menuButton.querySelector('.submenu-arrow');

                if (submenu) submenu.classList.toggle('open');
                if (arrow) arrow.classList.toggle('rotate', submenu?.classList.contains('open'));

                if (submenu) setTimeout(updateSidebarHeightWithOriginalLogic, 250);
            }
        });
    });

    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    const handleResize = () => {
        const currentSidebar = document.getElementById('sidebar');
        if (!currentSidebar) return;

        if (window.innerWidth >= 768) {
            currentSidebar.style.width = isSidebarCollapsed ? '4rem' : '15rem';
            if (isSidebarCollapsed && !currentSidebar.classList.contains('collapsed')) {
                currentSidebar.classList.add("collapsed");
            } else if (!isSidebarCollapsed && currentSidebar.classList.contains('collapsed')) {
                currentSidebar.classList.remove("collapsed");
            }
        } else {
            if (currentSidebar.classList.contains('collapsed')) currentSidebar.classList.remove('collapsed');
            if (currentSidebar.style.width !== '15rem') {
                currentSidebar.style.width = '0px';
            }
        }
        updateSidebarHeightWithOriginalLogic(); // This now handles the width check internally
    };

    const debouncedResizeHandler = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResizeHandler);


    if (window.innerWidth >= 768) {
        sidebar.style.width = '';
    } else {
        sidebar.style.width = '0px';
        if (menuIcon && closeIcon && mobileToggleIcon) {
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
            mobileToggleIcon.classList.remove('mobile-toggle-active');
        }
    }

    document.querySelectorAll('#sidebar .hover-trigger').forEach(trigger => {
        const hoverArea = trigger.querySelector('.menu-hover-area');
        if (!hoverArea) return;
        trigger.addEventListener('mouseenter', () => {
            const currentSidebar = document.getElementById('sidebar');
            if (currentSidebar && isSidebarCollapsed) {
                hoverArea.style.display = 'block';
            }
        });

        const hideHoverArea = (e) => {
            if (hoverArea && !hoverArea.contains(e.relatedTarget) && !trigger.contains(e.relatedTarget)) {
                hoverArea.style.display = 'none';
            }
        };
        trigger.addEventListener('mouseleave', hideHoverArea);
        hoverArea.addEventListener('mouseleave', hideHoverArea);
    });

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (typeof toastr !== 'undefined') {
                toastr.success('You have been logged out.', 'Logout Successful');
            } else {
                alert('You have been logged out.');
            }
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        });
    }

    updateSidebarHeightWithOriginalLogic();

});

window.updateSidebarHeightWithOriginalLogic = updateSidebarHeightWithOriginalLogic;