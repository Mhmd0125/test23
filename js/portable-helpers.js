/**
 * نظام الإشعارات والمساعدات للنظام المحمول
 */

// إظهار إشعار
function showNotification(message, type = 'info', duration = 3000) {
    // إزالة الإشعارات السابقة
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // إنشاء إشعار جديد
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // إضافة إلى الصفحة
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار تلقائياً
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// تأكيد العملية
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// معالجة الأخطاء العامة
window.addEventListener('error', function(event) {
    console.error('خطأ في النظام:', event.error);
    showNotification('❌ حدث خطأ في النظام', 'error');
});

// معالجة الأخطاء غير المعالجة
window.addEventListener('unhandledrejection', function(event) {
    console.error('خطأ غير معالج:', event.reason);
    showNotification('⚠️ خطأ في العملية', 'warning');
});

// تحديث الحالة دورياً
let connectionCheckInterval;

function startConnectionMonitoring() {
    connectionCheckInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/status');
            if (response.ok) {
                updateConnectionStatus('connected');
            } else {
                updateConnectionStatus('disconnected');
            }
        } catch (error) {
            updateConnectionStatus('fallback');
        }
    }, 30000); // كل 30 ثانية
}

function stopConnectionMonitoring() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'connected':
                statusElement.innerHTML = '✅ متصل - البيانات محفوظة محلياً';
                break;
            case 'disconnected':
                statusElement.innerHTML = '❌ غير متصل - تحقق من الخادم';
                break;
            case 'fallback':
                statusElement.innerHTML = '⚠️ وضع الطوارئ - localStorage';
                break;
        }
    } else {
        console.warn('عنصر connectionStatus غير موجود في الصفحة');
    }
}

// بدء مراقبة الاتصال عند تحميل الصفحة
window.addEventListener('load', () => {
    setTimeout(startConnectionMonitoring, 2000);
});

// إيقاف المراقبة عند إغلاق الصفحة
window.addEventListener('beforeunload', stopConnectionMonitoring);

// تصدير الدوال للاستخدام العام
window.showNotification = showNotification;
window.confirmAction = confirmAction;
