if (location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', () => {
        const notice = document.createElement('div');
        notice.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#0c1324;color:white;padding:40px;font:18px/1.6 sans-serif;';
        const heading = document.createElement('h1');
        heading.textContent = 'Запустите start.bat из папки игры';
        const text = document.createElement('p');
        text.textContent = 'Модульная версия работает через локальный сервер. Также можно выполнить: python tools/serve.py';
        const link = document.createElement('a');
        link.href = './7_2d_roguelite_digger.html';
        link.textContent = 'Перенести сохранение из прежней версии';
        link.style.color = '#38bdf8';
        notice.append(heading, text, link);
        document.body.append(notice);
    });
}
