// تهيئة مستخدم افتراضي إذا لم يكن موجوداً
if (!localStorage.getItem('users')) {
    const defaultUsers = [
        { username: 'admin', password: '123' }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

// معالجة تسجيل الدخول
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // حفظ حالة تسجيل الدخول
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'contractor-selection.html';
    } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
});

// معالجة إنشاء مستخدم جديد
document.getElementById('createUserLink')?.addEventListener('click', function(e) {
    e.preventDefault();
    const username = prompt('أدخل اسم المستخدم الجديد:');
    if (username) {
        const password = prompt('أدخل كلمة المرور الجديدة:') || '123';
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.username === username)) {
            alert('اسم المستخدم موجود مسبقاً');
            return;
        }
        
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert('تم إنشاء المستخدم بنجاح. يمكنك الآن تسجيل الدخول');
    }
});