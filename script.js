document.addEventListener("DOMContentLoaded", function () {
    let index = 0;
    const slides = document.querySelectorAll(".slide");

    function showSlide() {
        slides.forEach((slide) => {
            slide.classList.remove("active");
        });

        index++;
        if (index >= slides.length) {
            index = 0;
        }

        slides[index].classList.add("active");

        setTimeout(showSlide, 3000);
    }

    showSlide();
});