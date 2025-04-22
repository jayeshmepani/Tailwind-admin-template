function initializeMyNotifications() {

    if (typeof toastr === 'undefined') {
        console.error("notifications.js: toastr is not loaded.");
        return;
    }

    const showNotificationButton = document.getElementById('show-notification-btn');
    const notificationTypeSelect = document.getElementById('notification-type');

    if (!showNotificationButton || !notificationTypeSelect) {
        console.error("notifications.js: Notification button or type select element not found in DOM.");
        return;
    }

    toastr.options = {
        closeButton: true, debug: false, newestOnTop: false, progressBar: true,
        positionClass: "toast-top-right", preventDuplicates: false, onclick: null,
        showDuration: "300", hideDuration: "1000", timeOut: "5000", extendedTimeOut: "1000",
        showEasing: "swing", hideEasing: "linear", showMethod: "fadeIn", hideMethod: "fadeOut"
    };

    const showNotification = () => {
        const selectedType = notificationTypeSelect.value;
        const message = `This is a ${selectedType} notification!`;
        const title = selectedType.charAt(0).toUpperCase() + selectedType.slice(1);

        if (toastr[selectedType]) {
            toastr[selectedType](message, title);
        } else {
            console.error('notifications.js: Unknown notification type selected:', selectedType);
            toastr.info(message, 'Info');
        }
    };

    showNotificationButton.removeEventListener('click', showNotification);
    showNotificationButton.addEventListener('click', showNotification);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeMyNotifications();
} else {
    window.addEventListener('load', initializeMyNotifications);
}