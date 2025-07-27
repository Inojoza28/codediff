const scrollTopBtn = document.getElementById('scrollTopBtn');

const scrollThreshold = 400; // Aparece após 400px de rolagem

window.onscroll = function() {
    if (document.body.scrollTop > scrollThreshold || document.documentElement.scrollTop > scrollThreshold) {
        scrollTopBtn.classList.remove('hidden');
        scrollTopBtn.classList.add('flex', 'items-center', 'justify-center');
    } else {
        scrollTopBtn.classList.add('hidden');
        scrollTopBtn.classList.remove('flex', 'items-center', 'justify-center');
    }
};

scrollTopBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
