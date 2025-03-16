// notifications.js
document.addEventListener('DOMContentLoaded', () => {
    const showNotificationButton = document.getElementById('show-notification-btn');
    const notificationTypeSelect = document.getElementById('notification-type');

    if (showNotificationButton && notificationTypeSelect) {
        const showNotification = () => {
            const selectedType = notificationTypeSelect.value;

            if (typeof toastr !== 'undefined') {
                toastr.options = {
                    closeButton: true,
                    debug: false,
                    newestOnTop: false,
                    progressBar: true,
                    positionClass: "toast-top-right",
                    preventDuplicates: false,
                    onclick: null,
                    showDuration: "300",
                    hideDuration: "1000",
                    timeOut: "5000",
                    extendedTimeOut: "1000",
                    showEasing: "swing",
                    hideEasing: "linear",
                    showMethod: "fadeIn",
                    hideMethod: "fadeOut"
                };

                switch (selectedType) {
                    case 'success':
                        toastr.success('This is a success message!', 'Success');
                        break;
                    case 'warning':
                        toastr.warning('This is a warning message!', 'Warning');
                        break;
                    case 'info':
                        toastr.info('This is an info message!', 'Info');
                        break;
                    case 'error':
                        toastr.error('This is an error message!', 'Error');
                        break;
                    default:
                        console.error('Unknown notification type selected.');
                }
            } else {
                console.error('toastr is not loaded. Make sure the CDN link is correct and included BEFORE this script.');
            }
        };

        showNotificationButton.addEventListener('click', (event) => {
            event.preventDefault();
            showNotification();
        });

    } else {
        console.error("Notification button or type select not found. Check your HTML for elements with id='show-notification-btn' and id='notification-type'.")
    }
});