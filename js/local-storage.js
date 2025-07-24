/**
 * نظام إدارة الملفات المحلية
 * يحل محل localStorage ويحفظ البيانات في ملفات JSON محلية
 */

class LocalFileStorage {
    constructor() {
        this.dataPath = './data/';
        this.files = {
            workers: 'workers.json',
            attendance: 'attendance.json',
            subcontractors: 'subcontractors.json',
            workshops: 'workshops.json',
            foremen: 'foremen.json',
            settings: 'settings.json',
            users: 'users.json'
        };
        this.cache = {};
        this.initializeFileSystem();
    }

    async initializeFileSystem() {
        console.log('🔧 تهيئة نظام الملفات المحلي...');
        
        // تحميل جميع البيانات في البداية
        for (const [key, filename] of Object.entries(this.files)) {
            await this.loadFile(key);
        }
        
        console.log('✅ تم تهيئة نظام الملفات المحلي بنجاح');
    }

    async loadFile(key) {
        try {
            const filename = this.files[key];
            if (!filename) {
                console.warn(`⚠️ لا يوجد ملف مرتبط بالمفتاح ${key}`);
                this.cache[key] = this.getDefaultValue(key);
                return this.cache[key];
            }
            
            const response = await fetch('/api/load-data/' + filename);
            
            if (response.ok) {
                const data = await response.json();
                this.cache[key] = data;
                console.log(`📂 تم تحميل ${filename}:`, Array.isArray(data) ? data.length : Object.keys(data).length, 'عنصر');
                return data;
            } else {
                console.warn(`⚠️ لم يتم العثور على ${filename}، سيتم إنشاؤه`);
                this.cache[key] = this.getDefaultValue(key);
                
                // إنشاء الملف الافتراضي
                await this.saveFile(key, this.cache[key]);
                return this.cache[key];
            }
        } catch (error) {
            console.error(`❌ خطأ في تحميل ${key}:`, error);
            this.cache[key] = this.getDefaultValue(key);
            
            // محاولة التحميل من localStorage كبديل
            try {
                const localData = localStorage.getItem(key);
                if (localData) {
                    const parsedData = JSON.parse(localData);
                    this.cache[key] = parsedData;
                    console.log(`🔄 تم تحميل ${key} من localStorage كبديل`);
                }
            } catch (localError) {
                console.warn(`⚠️ لم يتم العثور على ${key} في localStorage أيضاً`);
            }
            
            return this.cache[key];
        }
    }

    getDefaultValue(key) {
        const arrayKeys = ['workers', 'attendance', 'subcontractors', 'workshops', 'foremen'];
        return arrayKeys.includes(key) ? [] : {};
    }

    async saveFile(key, data) {
        try {
            const filename = this.files[key];
            
            // حفظ في الذاكرة المؤقتة
            this.cache[key] = data;
            
            // إرسال البيانات للخادم المحلي لحفظها
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: filename,
                    data: data
                })
            });

            if (response.ok) {
                console.log(`💾 تم حفظ ${filename} بنجاح`);
                return true;
            } else {
                throw new Error('فشل في حفظ الملف');
            }
        } catch (error) {
            console.error(`❌ خطأ في حفظ ${key}:`, error);
            
            // في حالة فشل الحفظ، نحاول استخدام localStorage كبديل
            try {
                localStorage.setItem(key, JSON.stringify(data));
                console.log(`🔄 تم الحفظ في localStorage كبديل`);
                return true;
            } catch (localError) {
                console.error('❌ فشل في الحفظ في localStorage أيضاً:', localError);
                return false;
            }
        }
    }

    // وظائف مشابهة لـ localStorage
    getItem(key) {
        if (this.cache[key] !== undefined) {
            return JSON.stringify(this.cache[key]);
        }
        
        // إذا لم تكن في الذاكرة المؤقتة، نحاول تحميلها
        this.loadFile(key);
        return JSON.stringify(this.cache[key] || this.getDefaultValue(key));
    }

    setItem(key, value) {
        try {
            const data = JSON.parse(value);
            this.saveFile(key, data);
        } catch (error) {
            console.error('❌ خطأ في تحليل البيانات:', error);
        }
    }

    // دالة للحصول على البيانات مباشرة (بدون JSON.stringify/parse)
    getData(key) {
        return this.cache[key] || this.getDefaultValue(key);
    }

    // دالة لحفظ البيانات مباشرة
    setData(key, data) {
        this.saveFile(key, data);
    }

    // مزامنة البيانات مع localStorage للتوافق
    syncWithLocalStorage() {
        for (const [key, data] of Object.entries(this.cache)) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
                console.warn(`تحذير: لم يتم مزامنة ${key} مع localStorage`);
            }
        }
    }

    // استيراد البيانات من localStorage
    async importFromLocalStorage() {
        console.log('📥 استيراد البيانات من localStorage...');
        
        for (const key of Object.keys(this.files)) {
            try {
                const localData = localStorage.getItem(key);
                if (localData) {
                    const data = JSON.parse(localData);
                    await this.saveFile(key, data);
                    console.log(`✅ تم استيراد ${key} من localStorage`);
                }
            } catch (error) {
                console.error(`❌ خطأ في استيراد ${key}:`, error);
            }
        }
        
        console.log('✅ انتهى استيراد البيانات');
    }

    // تصدير جميع البيانات
    async exportAllData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            data: {}
        };

        for (const [key, data] of Object.entries(this.cache)) {
            exportData.data[key] = data;
        }

        return exportData;
    }

    // نسخ احتياطي
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData = await this.exportAllData();
        
        try {
            const response = await fetch('/api/create-backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: `backup-${timestamp}.json`,
                    data: backupData
                })
            });

            if (response.ok) {
                console.log('✅ تم إنشاء نسخة احتياطية بنجاح');
                return true;
            }
        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
        }
        
        return false;
    }
}

// إنشاء instance عالمي
const fileStorage = new LocalFileStorage();

// تحديث localStorage ليستخدم نظام الملفات الجديد
const originalLocalStorage = {
    getItem: localStorage.getItem.bind(localStorage),
    setItem: localStorage.setItem.bind(localStorage)
};

// Override localStorage methods
localStorage.getItem = function(key) {
    // إذا كان المفتاح من ملفات البيانات الرئيسية، استخدم نظام الملفات
    if (fileStorage.files[key]) {
        return fileStorage.getItem(key);
    }
    
    // للمفاتيح الأخرى مثل users أو currentUser، جرب نظام الملفات أولاً
    if (key === 'users' || key === 'currentUser') {
        // محاولة تحميل من الذاكرة المؤقتة أولاً
        if (fileStorage.cache[key]) {
            return JSON.stringify(fileStorage.cache[key]);
        }
        
        // إذا لم توجد في الذاكرة المؤقتة، استخدم localStorage العادي
        return originalLocalStorage.getItem(key);
    }
    
    // وإلا استخدم localStorage العادي
    return originalLocalStorage.getItem(key);
};

localStorage.setItem = function(key, value) {
    // إذا كان المفتاح من ملفات البيانات الرئيسية، استخدم نظام الملفات
    if (fileStorage.files[key]) {
        fileStorage.setItem(key, value);
    } else if (key === 'users') {
        // للمستخدمين، احفظ في كلا النظامين
        try {
            const userData = JSON.parse(value);
            fileStorage.cache[key] = userData;
            
            // محاولة حفظ في الملف
            fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: 'users.json',
                    data: userData
                })
            }).catch(err => console.warn('فشل حفظ المستخدمين في الملف:', err));
        } catch (err) {
            console.warn('خطأ في معالجة بيانات المستخدمين:', err);
        }
        
        // احفظ في localStorage العادي أيضاً
        originalLocalStorage.setItem(key, value);
    } else {
        // وإلا استخدم localStorage العادي
        originalLocalStorage.setItem(key, value);
    }
};

// تصدير للاستخدام العام
window.fileStorage = fileStorage;

console.log('🎉 تم تحميل نظام إدارة الملفات المحلية');
