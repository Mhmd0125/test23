/**
 * ملف JavaScript للصفحة الرئيسية
 * يدير التفاعلات الأساسية والتنقل
 */

// تهيئة الصفحة الرئيسية
document.addEventListener('DOMContentLoaded', function() {
    // إضافة تأثيرات بصرية للصفحة الرئيسية
    addMainPageEffects();
    
    // التحقق من حالة تسجيل الدخول
    checkLoginStatus();
});

// إضافة تأثيرات بصرية للصفحة الرئيسية
function addMainPageEffects() {
    // إضافة تأثير الظهور التدريجي للبطاقة
    const card = document.querySelector('.card');
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // إضافة تأثير hover للزر
    const loginBtn = document.querySelector('.btn');
    if (loginBtn) {
        loginBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        loginBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }
}

// التحقق من حالة تسجيل الدخول
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        // إذا كان المستخدم مسجل دخول، إعادة توجيه للوحة التحكم
        const userObj = JSON.parse(currentUser);
        
        // إضافة رسالة ترحيب
        const card = document.querySelector('.card');
        if (card) {
            card.innerHTML = `
                <h2>مرحباً بعودتك، ${userObj.username}!</h2>
                <p>يمكنك الانتقال مباشرة إلى لوحة التحكم</p>
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
                    <a href="dashboard.html" class="btn">لوحة التحكم</a>
                    <button onclick="logout()" class="btn warning">تسجيل خروج</button>
                </div>
            `;
        }
    }
}

// تسجيل الخروج
function logout() {
    // حذف بيانات المستخدم من التخزين المحلي
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    
    // إعادة تحميل الصفحة
    location.reload();
}

// إضافة تأثيرات إضافية للصفحة
function addPageAnimations() {
    // تأثير الخلفية المتحركة
    const body = document.body;
    
    // إنشاء عناصر الخلفية المتحركة
    for (let i = 0; i < 5; i++) {
        const circle = document.createElement('div');
        circle.className = 'floating-circle';
        circle.style.cssText = `
            position: fixed;
            width: ${Math.random() * 100 + 50}px;
            height: ${Math.random() * 100 + 50}px;
            background: rgba(52, 152, 219, 0.1);
            border-radius: 50%;
            top: ${Math.random() * 100}vh;
            left: ${Math.random() * 100}vw;
            animation: float ${Math.random() * 10 + 10}s infinite linear;
            pointer-events: none;
            z-index: -1;
        `;
        body.appendChild(circle);
    }
    
    // إضافة CSS للحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.7;
            }
            50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 0.3;
            }
            100% {
                transform: translateY(0px) rotate(360deg);
                opacity: 0.7;
            }
        }
        
        .floating-circle {
            animation-duration: 15s !important;
        }
    `;
    document.head.appendChild(style);
}

// استدعاء تأثيرات الصفحة
addPageAnimations();
