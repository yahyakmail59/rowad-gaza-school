# نشر مدرسة رواد غزة الثانوية على GitHub وPythonAnywhere

هذا المشروع موقع ثابت مبني بـHTML وCSS وJavaScript ويستخدم IndexedDB داخل متصفح المستخدم؛ لذلك لا يحتاج Flask أو Django أو قاعدة بيانات على خادم PythonAnywhere.

## بيانات النشر المعتمدة

- اسم حساب PythonAnywhere: `RowadGaza`
- عنوان الموقع: `https://RowadGaza.pythonanywhere.com`
- اسم المستودع المقترح: `rowad-gaza-school`
- مجلد المشروع على PythonAnywhere: `/home/RowadGaza/rowad-gaza-school`
- ربط الملفات الثابتة: URL بقيمة `/` إلى Directory بقيمة `/home/RowadGaza/rowad-gaza-school`

> أسماء النطاقات غير حساسة لحالة الأحرف؛ لذلك قد يعرض المتصفح العنوان بصيغة `rowadgaza.pythonanywhere.com`، وهو نفس العنوان.

## أولاً: إنشاء المستودع على GitHub

1. سجّل الدخول إلى GitHub.
2. اضغط علامة `+` ثم **New repository**.
3. اكتب اسم المستودع: `rowad-gaza-school`.
4. اختر `Private` إذا كانت بيانات المشروع غير مخصصة للنشر العام، أو `Public` إذا أردت إتاحته للجميع.
5. لا تضف README أو `.gitignore` أو License من GitHub، لأنها موجودة أو ستُدار داخل المشروع.
6. اضغط **Create repository** واترك صفحة Quick setup مفتوحة.

## ثانياً: رفع المشروع من Windows إلى GitHub

افتح PowerShell داخل مجلد المشروع ثم نفّذ الأوامر التالية. استبدل `YOUR_GITHUB_USERNAME` باسم حسابك على GitHub:

```powershell
git init
git branch -M main
git add .
git status
git commit -m "Initial release for Rowad Gaza Secondary School"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/rowad-gaza-school.git
git remote -v
git push -u origin main
```

عند طلب تسجيل الدخول، استخدم نافذة تسجيل GitHub أو Personal Access Token؛ كلمة مرور حساب GitHub العادية لا تُستخدم مع Git عبر HTTPS.

إذا كان اسم `origin` موجوداً بالفعل بعنوان خاطئ، استعمل:

```powershell
git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/rowad-gaza-school.git
git push -u origin main
```

## ثالثاً: تنزيل المشروع على PythonAnywhere

1. سجّل الدخول إلى حساب `RowadGaza` في PythonAnywhere.
2. افتح تبويب **Consoles** ثم شغّل **Bash console**.
3. إذا كان المستودع عاماً، نفّذ الأمر التالي بعد استبدال اسم حساب GitHub:

```bash
cd /home/RowadGaza
git clone https://github.com/YOUR_GITHUB_USERNAME/rowad-gaza-school.git
cd /home/RowadGaza/rowad-gaza-school
ls
```

يجب أن يظهر `index.html` مباشرة داخل `/home/RowadGaza/rowad-gaza-school`.

إذا كان المستودع خاصاً، استخدم رابط HTTPS مع Personal Access Token عند طلب المصادقة، أو اضبط SSH key لحساب PythonAnywhere وأضفه إلى GitHub.

## رابعاً: إنشاء Web App ثابت

1. افتح تبويب **Web** في PythonAnywhere.
2. اضغط **Add a new web app**.
3. اختر النطاق الخاص بالحساب: `RowadGaza.pythonanywhere.com`.
4. اختر **Manual configuration** ثم أي إصدار Python متاح؛ لن يستخدم المشروع Python وقت التشغيل.
5. في صفحة إعداد التطبيق، انزل إلى قسم **Static files**.
6. أضف الربط التالي بالضبط:

| URL | Directory |
|---|---|
| `/` | `/home/RowadGaza/rowad-gaza-school` |

7. اضغط زر **Reload RowadGaza.pythonanywhere.com** أعلى الصفحة.
8. افتح `https://RowadGaza.pythonanywhere.com` ثم استخدم `Ctrl+F5` لتجاوز النسخة المخزنة في المتصفح.

لا حاجة إلى تعديل WSGI لأن الربط `/` يخدم المشروع كاملاً كملفات ثابتة.

## تحديث الموقع بعد أي تعديل

ارفع التعديلات من جهازك أولاً:

```powershell
git add .
git status
git commit -m "Describe the update"
git push origin main
```

ثم افتح Bash console في PythonAnywhere ونفّذ:

```bash
cd /home/RowadGaza/rowad-gaza-school
git pull origin main
```

بعدها ارجع إلى تبويب **Web** واضغط **Reload**، ثم افتح الموقع مع `Ctrl+F5`.

## التحقق وحل المشكلات

- خطأ 404 للصفحة الرئيسية: تأكد أن الملف موجود في `/home/RowadGaza/rowad-gaza-school/index.html` وأن Static files URL هو `/`.
- التصميم أو الشعار لا يظهر: جرّب فتح `https://RowadGaza.pythonanywhere.com/assets/styles.css` و`https://RowadGaza.pythonanywhere.com/assets/images/ruwad-gaza-school-logo.jpg` مباشرة.
- بقي الإصدار القديم: اضغط Reload في Web ثم `Ctrl+F5`.
- فشل `git pull`: نفّذ `git status` داخل مجلد المشروع ولا تعدّل ملفات الموقع يدوياً على PythonAnywhere.
- البيانات لا تظهر على جهاز آخر: هذا متوقع، لأن IndexedDB محلية لكل متصفح وجهاز وليست قاعدة بيانات مشتركة على الخادم.

