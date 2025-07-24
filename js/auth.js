// تهيئة مستخدم افتراضي إذا لم يكن موجوداً
async function initializeDefaultUsers() {
    try {
        // محاولة تحميل المستخدمين من الملف
        const response = await fetch('/api/load-data/users.json');
        let users = [];
        
        if (response.ok) {
            users = await response.json();
        }
        
        // إذا لم يكن هناك مستخدمين، إنشاء مستخدم افتراضي
        if (!users || users.length === 0) {
            users = [
                { username: 'admin', password: '123' }
            ];
            
            // حفظ المستخدمين الافتراضيين
            await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: 'users.json',
                    data: users
                })
            });
        }
        
        // حفظ في localStorage أيضاً للتوافق
        localStorage.setItem('users', JSON.stringify(users));
        
    } catch (error) {
        console.error('خطأ في تهيئة المستخدمين:', error);
        
        // في حالة فشل الاتصال، استخدم localStorage فقط
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                { username: 'admin', password: '123' }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    }
}

// تهيئة المستخدمين عند تحميل الصفحة
initializeDefaultUsers();

// معالجة تسجيل الدخول
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        // محاولة تحميل المستخدمين من الخادم
        const response = await fetch('/api/load-data/users.json');
        let users = [];
        
        if (response.ok) {
            users = await response.json();
        } else {
            // إذا فشل تحميل من الخادم، استخدم localStorage
            users = JSON.parse(localStorage.getItem('users')) || [];
        }
        
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // حفظ حالة تسجيل الدخول
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'contractor-selection.html';
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        
        // تجربة استخدام localStorage كبديل
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'contractor-selection.html';
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    }
});

// معالجة إنشاء مستخدم جديد
document.getElementById('createUserLink')?.addEventListener('click', async function(e) {
    e.preventDefault();
    const username = prompt('أدخل اسم المستخدم الجديد:');
    if (username) {
        const password = prompt('أدخل كلمة المرور الجديدة:') || '123';
        
        try {
            // تحميل المستخدمين الحاليين
            const response = await fetch('/api/load-data/users.json');
            let users = [];
            
            if (response.ok) {
                users = await response.json();
            } else {
                users = JSON.parse(localStorage.getItem('users')) || [];
            }
            
            if (users.some(u => u.username === username)) {
                alert('اسم المستخدم موجود مسبقاً');
                return;
            }
            
            users.push({ username, password });
            
            // حفظ المستخدمين الجدد
            const saveResponse = await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: 'users.json',
                    data: users
                })
            });
            
            if (saveResponse.ok) {
                localStorage.setItem('users', JSON.stringify(users));
                alert('تم إنشاء المستخدم بنجاح. يمكنك الآن تسجيل الدخول');
            } else {
                throw new Error('فشل في حفظ المستخدم');
            }
            
        } catch (error) {
            console.error('خطأ في إنشاء المستخدم:', error);
            
            // تجربة localStorage كبديل
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.username === username)) {
                alert('اسم المستخدم موجود مسبقاً');
                return;
            }
            
            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert('تم إنشاء المستخدم بنجاح (محفوظ محلياً). يمكنك الآن تسجيل الدخول');
        }
    }
});