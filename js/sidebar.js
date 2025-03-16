document.addEventListener("DOMContentLoaded", function () {
    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const desktopMenuToggle = document.getElementById("desktopMenuToggle");
    const sidebar = document.getElementById("sidebar");
    let isSidebarCollapsed = false;
    const mobileToggleIcon = mobileMenuToggle.querySelector('.mobile-toggle-icon');
    const menuIcon = mobileToggleIcon.querySelector('.menu-icon');
    const closeIcon = mobileToggleIcon.querySelector('.close-icon');

    function toggleSidebarMobile() {
        const isSidebarHidden = sidebar.style.width === '0px';
        sidebar.style.width = isSidebarHidden ? '16rem' : '0px';
        menuIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
        mobileToggleIcon.classList.toggle('mobile-toggle-active');
    }

    function toggleSidebarDesktop() {
        isSidebarCollapsed = !isSidebarCollapsed;
        sidebar.classList.toggle("collapsed", isSidebarCollapsed);
        const toggleIcon = desktopMenuToggle.querySelector('svg');
        toggleIcon.innerHTML = isSidebarCollapsed
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>`
            : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>`;
    }

    mobileMenuToggle.addEventListener("click", toggleSidebarMobile);
    desktopMenuToggle.addEventListener("click", toggleSidebarDesktop);

    document.querySelectorAll('.menu-item-hover > a').forEach(menuButton => {
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();

            if (!sidebar.classList.contains('collapsed')) {
                const submenu = menuButton.closest('.menu-item-hover').querySelector('.submenu-click');
                const arrow = menuButton.querySelector('.submenu-arrow');

                submenu.classList.toggle('open');

                arrow.classList.toggle('rotate', submenu.classList.contains('open'));
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            sidebar.style.width = isSidebarCollapsed ? '4rem' : '16rem';
            if (isSidebarCollapsed) sidebar.classList.add("collapsed");
        } else {
            if (sidebar.classList.contains('collapsed')) sidebar.classList.remove('collapsed');
            sidebar.style.width = '0px';
        }
    });

    if (window.innerWidth >= 768) {
        sidebar.style.width = '16rem';
    } else {
        sidebar.style.width = '0px';
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
        mobileToggleIcon.classList.remove('mobile-toggle-active');
    }

    document.querySelectorAll('.hover-trigger').forEach(trigger => {
        const hoverArea = trigger.querySelector('.menu-hover-area');
        trigger.addEventListener('mouseenter', () => {
            if (sidebar.classList.contains('collapsed')) hoverArea.style.display = 'block';
        });

        const hideHoverArea = (e) => {
            if (!hoverArea.contains(e.relatedTarget) && !trigger.contains(e.relatedTarget)) {
                hoverArea.style.display = 'none';
            }
        };
        trigger.addEventListener('mouseleave', hideHoverArea);
        hoverArea.addEventListener('mouseleave', hideHoverArea);
    });
});